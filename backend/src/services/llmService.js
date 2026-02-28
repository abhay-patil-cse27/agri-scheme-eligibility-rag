const Groq = require("groq-sdk");
const config = require("../config/env");
const logger = require("../config/logger");

const groqInstances = [new Groq({ apiKey: config.groqApiKey })];
let currentGroqIndex = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// ── Global Concurrency & LRU Cache ──────────────────
const queue = [];
let activeCount = 0;
const MAX_CONCURRENT = 3;

// Phase 5 In-Memory Cache for Heavy LLM tasks
const translationCache = new Map();
const MAX_CACHE_SIZE = 500; // LRU approach


/**
 * Limit the number of concurrent LLM requests globally.
 */
async function runQueued(fn) {
  return new Promise((resolve, reject) => {
    const task = async () => {
      activeCount++;
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        activeCount--;
        if (queue.length > 0) {
          const next = queue.shift();
          // Use setImmediate to avoid stack overflow for very large queues
          setImmediate(next);
        }
      }
    };

    if (activeCount < MAX_CONCURRENT) {
      task();
    } else {
      queue.push(task);
    }
  });
}

/**
 * Execute a function with exponential backoff retries (useful for 429 Too Many Requests)
 */
async function withRetry(fn, maxRetries = 8, baseDelay = 2000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (
        (error.status === 429 || error.status >= 500) &&
        attempt < maxRetries - 1
      ) {
        attempt++;
        let delay = baseDelay * Math.pow(2, attempt - 1);

        // Key rotation fallback logic completely commented out per user request:
        // if (error.status === 429 && groqInstances.length > 1) {
        //   currentGroqIndex = (currentGroqIndex + 1) % groqInstances.length;
        //   logger.warn(`API Rate Limit hit (429). Rotating to backup API Key (index ${currentGroqIndex})...`);
        //   delay = 1000;
        // } else {
        logger.warn(
          `API Rate Limit hit (${error.status}). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`,
        );
        // }

        // Add random jitter between 200ms and 800ms
        const jitter = Math.floor(Math.random() * 600) + 200;
        await sleep(delay + jitter);
      } else {
        if (error.status === 429) {
          throw new Error(
            "API Rate Limit Exceeded. The service is currently handling too many requests. Please try again in a few moments.",
          );
        }
        if (error.status >= 500) {
          throw new Error(
            "AI Service is temporarily unavailable. Please try again later.",
          );
        }
        throw error;
      }
    }
  }
}

/**
 * System prompt enforcing citation-backed, structured JSON output.
 * This is the core of the RAG eligibility engine.
 */
const ELIGIBILITY_SYSTEM_PROMPT = `You are an expert agricultural scheme eligibility analyst for Indian government schemes.

STRICT RULES:
1. You MUST base your decision ONLY on the provided document excerpts.
2. You MUST NOT hallucinate or invent information not present in the excerpts.
3. You MUST provide an exact text citation from the document excerpts to support your decision.
4. You MUST respond ONLY with valid JSON — no markdown, no explanation outside JSON.
5. You MUST speak directly to the farmer in a conversational, empathy-driven first-person tone (e.g., "You are eligible for this scheme because your 2 acres of land..."). DO NOT refer to them in the third person ("The farmer is eligible...").
6. STRICT REQUIRED DOCUMENTS RULES BASED ON SOCIAL CATEGORY:
    - If Category is 'SC' or 'ST', append exactly "SC/ST Caste Certificate". Do NOT append anything else.
    - If Category is 'OBC', append exactly "OBC Certificate" AND "Non-Creamy Layer (NCL) Certificate". Do NOT ask for SC/ST certificates.
    - If Category is 'EWS', append exactly "EWS Income and Asset Certificate".
    - If Category is 'Minority', append exactly "Minority Community Certificate".
    - If Category is 'General', do NOT append any category-related certificates.
7. REALISTIC ASSESSMENT & EXCLUSIONS:
    - Carefully evaluate numerical criteria. For example, if the scheme requires age 18-40, and the farmer is 22, they ARE ELIGIBLE. Do NOT reject them.
    - If the scheme requires land up to 2 hectares, and the farmer has 5 acres (approx 2.02 hectares), carefully check the exact limits.
    - Be objective. If the Farmer meets the conditions mentioned in the excerpts (e.g. they are a farmer, age matches, land matches), mark them ELIGIBLE. Do not invent reasons to reject them.
    - If a scheme is meant for farmers/agri-entrepreneurs (e.g. Agri-Infrastructure-Fund) and the farmer is an individual, assume they ARE ELIGIBLE unless the excerpts explicitly ban individuals.
    - If crucial eligibility parameters (like income limits) are missing from the excerpts, DO NOT automatically reject the farmer. Instead, assume they ARE ELIGIBLE but set confidence to 'medium' or 'low', and mention the missing confirmation in your reasoning.
8. SOURCE WEIGHTING RULES:
    - You will receive excerpts with metadata: Type (e.g., guidelines, amendment, faq, state_addendum) and Language.
    - ALWAYS prioritize 'guidelines' and 'amendment' over 'faq' or 'addendum'.
    - If an 'amendment' contradicts earlier 'guidelines', the 'amendment' wins.
    - If a State Addendum exists for the farmer's state, it takes precedence over general guidelines for state-specific rules.
    - FAQs are for clarification only and should never override official policy documents.
9. GRAPH-BASED EXCLUSION RULES & DUPLICATE CHECKS (CRITICAL):
    - If you are provided with "GRAPH CONFLICTS", these are absolute business rules from the graph database.
    - If the "Currently Enrolled In" list contains the EXACT SAME scheme you are evaluating, you MUST mark them NOT ELIGIBLE with the reason "Duplicate Enrollment".
    - If the "Currently Enrolled In" list contains multiple other schemes from the exact same category (e.g. they are enrolled in 5 other insurance schemes), treat it as a mutual exclusion conflict and reject them, explaining they already have active coverage.
    - This rule overrides everything else.

10. ENHANCED ANALYSIS RULES (STRICT DEMOGRAPHICS):
    - CROSS-VERIFY: Check if the farmer's Annual Income exceeds the document's poverty line/limit.
    - LAND AUDIT: Check if the farmer's Land Holding exceeds the small/marginal farmer definition in the text (typically 2 hectares or 5 acres).
    - CATEGORY MATCH: Ensure specific benefits for women, SC, ST, or Minority groups are highlighted.
    - DEMOGRAPHIC CHECK: If a scheme is Gender-locked (e.g. women-only) and the profile is Male, reject.
    - BPL CHECK: If BPL status is required and 'hasBPLCard' is false, REJECT.
    - OWNERSHIP CHECK: If tenancy is prohibited and ownership is required, REJECT if 'ownershipType' is 'Tenant/Sharecropper'.

11. STRICT FINANCIAL & CITATION AUDIT (CRITICAL):
    - BENEFIT ACCURACY: Only provide an exact numerical amount (e.g., '₹6,000') if clearly stated in the excerpts.
    - APPROX BENEFITS: If an exact amount is NOT in the text but the scheme type implies a range (e.g., KCC credit limits, PM-Kisan standard ¥6,000), you MAY provide an estimate but you MUST prefix it with "Approx: " and explain it's an estimation based on regional norms.
    - UNREALISTIC AMOUNTS: Do NOT invent high benefit amounts. If the text mentions a subsidy percentage (e.g., 50% subsidy), record "50% Subsidy" instead of a raw rupee amount.
    - STRICT CITATIONS: Your citation MUST be a verbatim, direct quote from the provided excerpts. Do not summarize or paraphrase. If you cannot find a direct quote, do not provide one.
    - WEBSITE LOGIC: For 'officialWebsite', provide the URL only if found in the text. If NOT found, set it to exactly null. NEVER return the text "URL or null".

RESPOND ONLY WITH THIS EXACT JSON STRUCTURE:
{
  "eligible": true or false,
  "confidence": "high" or "medium" or "low",
  "reason": "Detailed 3-5 sentence explanation. Use a warm, empathetic tone addressing the farmer directly.",
  "benefitAmount": "Exact amount (e.g., '₹6,000') or 'Approx: ₹1.60 Lakh' or null",
  "paymentFrequency": "Frequency string or null",
  "actionSteps": ["Step 1", "Step 2"] or [],
  "requiredDocuments": ["Doc 1", "Doc 2"] (Always include standard docs + category certs),
  "rejectionExplanation": {
    "criteria": "Rule they failed",
    "yourProfile": "Their profile value"
  } or null,
  "citation": "Verbatim text quoted from the document excerpts.",
  "citationSource": {
    "documentName": "filename.pdf",
    "page": 1,
    "section": "Eligibility",
    "paragraph": 3
  },
  "officialWebsite": "https://example.gov.in or null"
}`;

const languageMap = {
  en: "English",
  hi: "Hindi (हिंदी)",
  mr: "Marathi (मराठी)",
  bn: "Bengali (বাংলা)",
  te: "Telugu (తెలుగు)",
  ta: "Tamil (தமிழ்)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  or: "Odia (ଓଡିଆ)",
  as: "Assamese (অসমীয়া)",
  ur: "Urdu (اردو)",
};

/**
 * Check eligibility by sending farmer profile + retrieved document chunks + graph conflicts to Groq LLM.
 *
 * @param {Object} profile - Farmer profile data
 * @param {Array} relevantChunks - Document chunks from vector search
 * @param {string} schemeName - Name of the scheme being checked
 * @param {string} [language='en'] - The target language
 * @param {Array} [graphConflicts=[]] - List of conflicts from Neo4j
 * @returns {Object} Structured eligibility result
 */
async function checkEligibility(
  profile,
  relevantChunks,
  schemeName,
  language = "en",
  graphConflicts = [],
) {
  const startTime = Date.now();
  const cleanLang = language.split('-')[0].toLowerCase();
  const targetLangString = languageMap[cleanLang] || "English";

  // Build the user prompt with profile and document context
  const documentContext = relevantChunks
    .map(
      (chunk, i) =>
        `--- Document Excerpt ${i + 1} (Type: ${chunk.metadata?.documentType || "guidelines"}, Language: ${chunk.metadata?.language || "en"}, Page: ${chunk.metadata?.page || "N/A"}, Section: ${chunk.metadata?.section || "N/A"}) ---\n${chunk.text}`,
    )
    .join("\n\n");

  const userPrompt = `SCHEME: ${schemeName}

FARMER PROFILE:
- Name: ${profile.name || "N/A"}
- Age: ${profile.age || "Not specified"} (Evaluate carefully against age limits)
- State: ${profile.state}
- District: ${profile.district}
- Land Holding: ${profile.landHolding} acres (${profile.landHoldingHectares || (profile.landHolding * 0.404686).toFixed(3)} hectares) (IMPORTANT: 1 acre = 0.404686 hectares. Check limits accurately)
- Crop Type: ${profile.cropType}
- Social Category: ${profile.category}
- Annual Income: ${profile.annualIncome ? "₹" + profile.annualIncome : "Not specified"}
- Irrigation Access: ${profile.hasIrrigationAccess ? "Yes" : "No"}
- Currently Enrolled In: ${profile.activeSchemes?.join(", ") || "None"}

GRAPH CONFLICTS (EXCLUSION RULES):
${
  graphConflicts && graphConflicts.length > 0
    ? graphConflicts
        .map(
          (c) =>
            `- CONFLICT: Already enrolled in ${c.scheme}. Rule: ${c.reason}`,
        )
        .join("\n")
    : "None identified."
}

OFFICIAL DOCUMENT EXCERPTS:
${documentContext}

Based ONLY on the above document excerpts, determine if this farmer is eligible for ${schemeName}. Return your answer as the specified JSON structure.

IMPORTANT MULTILINGUAL RULE: 
You MUST translate the values for 'reason', 'actionSteps' (array of strings), 'benefitAmount', 'paymentFrequency', 'requiredDocuments' (array of strings), 'rejectionExplanation' (critera and yourProfile), and 'citation' into the following target language: **${targetLangString}**. Keep the JSON keys in English, but output the human-readable text strictly in the target language. Use simple, conversational language suitable for a farmer. Ensure currency is written using native numerals if appropriate.`;

  let rawResponse;

  try {
    const completion = await runQueued(() =>
      withRetry(() =>
        groqInstances[currentGroqIndex].chat.completions.create({
          model: config.groqModel,
          messages: [
            { role: "system", content: ELIGIBILITY_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      ),
    );

    rawResponse = completion.choices[0]?.message?.content;
  } catch (error) {
    logger.error(`Groq LLM error for ${schemeName}:`, error.message);
    throw new Error(`LLM eligibility check failed: ${error.message}`);
  }

  if (!rawResponse) {
    throw new Error("Empty response from Groq LLM");
  }

  try {
    const result = parseResponse(rawResponse);
    result.responseTime = parseFloat(
      ((Date.now() - startTime) / 1000).toFixed(2),
    );

    logger.info(
      `Eligibility check completed: ${schemeName} → ${result.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"} (${result.responseTime}s)`,
    );

    return result;
  } catch (error) {
    logger.error(
      `Failed to parse LLM response for ${schemeName}:`,
      error.message,
    );
    throw new Error(`LLM parsing failed: ${error.message}`);
  }
}

/**
 * Parse LLM response into structured format.
 * Handles edge cases like markdown wrapping or malformed JSON.
 */
function parseResponse(rawResponse) {
  let cleaned = rawResponse.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Sanitize citationSource.page — LLM    returns strings like "Various"
    let pageVal = parsed.citationSource?.page;
    if (pageVal !== null && pageVal !== undefined) {
      const num = Number(pageVal);
      pageVal = isNaN(num) ? String(pageVal) : String(num);
    } else {
      pageVal = "";
    }

    let paragraphVal = parsed.citationSource?.paragraph;
    if (paragraphVal !== null && paragraphVal !== undefined) {
      paragraphVal = String(paragraphVal);
    } else {
      paragraphVal = "";
    }

    return {
      eligible: Boolean(parsed.eligible),
      confidence: parsed.confidence || "medium",
      reason: parsed.reason || "No reason provided",
      citation: parsed.citation || "",
      citationSource: {
        documentName: parsed.citationSource?.documentName || "",
        page: pageVal,
        section: parsed.citationSource?.section || "",
        subsection: parsed.citationSource?.subsection || "",
        paragraph: paragraphVal,
      },
      officialWebsite: parsed.officialWebsite || "",
      benefitAmount: parsed.benefitAmount || null,
      requiredDocuments: Array.isArray(parsed.requiredDocuments)
        ? parsed.requiredDocuments
        : [],
      additionalNotes: parsed.additionalNotes || "",
    };
  } catch (parseError) {
    logger.error("Failed to parse LLM response:", parseError.message);
    logger.error("Raw response:", cleaned);
    throw new Error("LLM returned invalid JSON response");
  }
}

/**
 * Extract structured profile from a voice transcript using LLM.
 */
async function extractProfileFromTranscript(transcript) {
  const systemPrompt = `You are an expert AI data extractor for an Indian agricultural platform.
Your ONLY job is to extract farmer profile details from a raw, conversational voice transcript (which may be in Hindi, Marathi, English, Telugu, Bengali, Tamil etc.) and output strict JSON.

STRICT TRANSLATION & STANDARDIZATION RULES:
1. Translating Text: Always translate the extracted state, district, crop type, and name into English text, regardless of the language spoken in the transcript.
2. Handling Numbers: Regional spoken numbers (e.g. "दोन एकर", "दो", "पाच") MUST be converted into actual JSON numbers (e.g. 2, 5).
3. Social Category: If the user says "मागासवर्गीय", "पिछड़ा वर्ग", "OBC", map it to "OBC". If they say "SC/ST", "दलित", map to "SC" or "ST". If they don't explicitly mention it, set it to null.
4. Land Units: If they say "एकर" or "Bigha" or "Gunta", attempt to roughly convert to Acres if possible, or just extract the raw number.
5. Irrigation: If they mention well, canal, river, pump ("विहीर", "नदी", "कालवा", "सिंचाई", "ट्यूबवेल", "बोअरवेल", "विहीर"), set hasIrrigationAccess to true.
6. Demographics: Look for keywords indicating BPL/Ration card ("रेशन कार्ड", "दारिद्र्य", "अंत्योदय", "बीपीएल"), tenancy/rental vs ownership ("भाडेतत्त्वावर", "मालकी", "बटाटेदार", "हिस्सेदार", "खरेदी खत"), Kisan Credit Card ("KCC", "किसान क्रेडिट"), Divyangjan ("दिव्यांग", "अपंग", "अपाहिज", "विकलांग"), and bank accounts linked to Aadhar ("आधार बँक", "सीडेड"). Infer gender naturally from the name or spoken grammar (e.g. "मी महिला आहे", "मैं किसान हूँ" vs "मैं महिला किसान हूँ").
7. Dialect Awareness: Correctly interpret regional pronunciations or slag (e.g., "शेत" vs "क्षेत्र", "पैसे" vs "रकमे", "पानी" vs "जल"). Use context to disambiguate. If they say "७/१२" (Satbara) or "८अ" (8A), it implies they are a land owner.
8. Conflict Detection: If they mention receiving benefits from other schemes (e.g. "पंतप्रधान सन्मान निधीचे पैसे येतात", "नमो शेतकरी चे पैसे येतात"), ensure these are added to activeSchemes using their official names (e.g., "PM-KISAN", "Namo Shetkari Mahasanman Nidhi").

RESPOND ONLY WITH THIS EXACT JSON STRUCTURE (No markdown, no explanation):
{
  "name": "English name or null",
  "age": number_or_null,
  "state": "English state name or null",
  "district": "English district name or null",
  "landHolding": number_in_acres_or_null,
  "cropType": "English crop type or null",
  "category": "General or SC or ST or OBC or null",
  "annualIncome": number_or_null,
  "hasIrrigationAccess": true_or_false_or_null,
  "gender": "Male or Female or Other or null",
  "hasBPLCard": true_or_false_or_null,
  "ownershipType": "Owner or Tenant/Sharecropper or Co-owner or null",
  "hasKcc": true_or_false_or_null,
  "isDifferentlyAbled": true_or_false_or_null,
  "hasAadharSeededBank": true_or_false_or_null
}

EXAMPLE TRANSCRIPT (Marathi):
"नमस्ते, माझं नाव रमेश पाटील आहे, मी ४५ वर्षांचा आहे. मी महाराष्ट्र राज्यातील पुणे जिल्ह्यात राहतो. माझ्याकडे २ एकर जमीन आहे आणि मी गहू पिकवतो. माझ्याकडे रेशन कार्ड आहे."
EXPECTED OUTPUT:
{
  "name": "Ramesh Patil",
  "age": 45,
  "state": "Maharashtra",
  "district": "Pune",
  "landHolding": 2,
  "cropType": "Wheat",
  "category": null,
  "annualIncome": null,
  "hasIrrigationAccess": null,
  "gender": "Male",
  "hasBPLCard": true,
  "ownershipType": "Owner",
  "hasKcc": null,
  "isDifferentlyAbled": null,
  "hasAadharSeededBank": null
}

Extract whatever information is available from the actual provided transcript. Set null for completely missing fields.`;

  try {
    const completion = await runQueued(() =>
      withRetry(() =>
        groqInstances[currentGroqIndex].chat.completions.create({
          model: config.groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Voice transcript: "${transcript}"` },
          ],
          temperature: 0.1,
          max_tokens: 512,
          response_format: { type: "json_object" },
        }),
      ),
    );

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    logger.info("Profile extracted from transcript successfully");
    return result;
  } catch (error) {
    logger.error("Profile extraction from transcript failed:", error.message);
    throw new Error(`Voice profile extraction failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using Groq's Whisper API
 * @param {string} filePath - Path to the audio file
 * @param {string} [language='en'] - Regional language code (e.g. 'hi', 'mr')
 * @returns {string} Trancribed text
 */
async function transcribeAudio(filePath, language = "en") {
  const fs = require("fs");
  try {
    const whisperLanguage = language
      ? language.substring(0, 2).toLowerCase()
      : "en";
    const transcription = await runQueued(() =>
      withRetry(() =>
        groqInstances[currentGroqIndex].audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: "whisper-large-v3", // upgraded from turbo for much better Indian language accuracy
          prompt:
            "Agricultural scheme app. Transcribe exactly as spoken in regional language. Do NOT translate. Preserve regional number words and land unit words (e.g., एकर, हेक्टर, bigha, acre, hectare).",
          response_format: "json",
          language: whisperLanguage,
        }),
      ),
    );

    logger.info("Audio transcribed successfully");
    return transcription.text;
  } catch (error) {
    logger.error("Audio transcription failed:", error.message);
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

/**
 * Translate an eligibility result JSON natively into the target language.
 */
async function translateEligibilityResult(resultObj, targetLanguage = "hi") {
  const cleanLang = targetLanguage.split('-')[0].toLowerCase();
  const targetLangString = languageMap[cleanLang] || cleanLang;

  const systemPrompt = `You are a strict, expert translator for an Indian government agricultural scheme platform.

Translate only the specified JSON fields into ${targetLangString}. Follow every rule below WITHOUT EXCEPTION.

RULES:
1. JSON KEYS: Keep ALL keys in English. NEVER translate key names.
2. TRANSLATE ONLY these fields: reason, actionSteps (array), benefitAmount, paymentFrequency, requiredDocuments (array), rejectionExplanation.criteria, rejectionExplanation.yourProfile.
3. DO NOT CHANGE: eligible, confidence, scheme, responseTime, or any other field.
4. NUMBERS & CURRENCY:
   - Write currency using native numerals of the target language where natural.
   - Hindi example: ₹6,000 → ₹६,०००   Marathi: ₹6,000 → ₹६,०००   Tamil: ₹6,000 → ₹6,000 (keep Arabic when Tamil native numerals are uncommon in official use)
   - Always keep the ₹ symbol.
   - Land sizes: translate units (acres → एकर in Hindi, एकरे in Marathi, ఎకరాలు in Telugu, etc.)
5. COMPLETENESS: Translate EVERY sentence. Never skip, shorten, or summarise.
6. TONE: Simple, warm, conversational — like explaining to a rural farmer. Avoid bureaucratic language.
7. OUTPUT: Return ONLY valid JSON. No markdown, no code fences, no extra text outside JSON.

EXAMPLE (English → Hindi):
Input benefitAmount: "₹6,000 per year"
Output benefitAmount: "₹६,००० प्रति वर्ष"`;

  // --- Phase 5: In-Memory LRU Caching ---
  const cacheKey = `${targetLanguage}::${JSON.stringify({scheme: resultObj.scheme, err: resultObj.error, cite: resultObj.citation})}`;
  if (translationCache.has(cacheKey)) {
    logger.info(`[LRU CACHE HIT] Translated ${resultObj.scheme} into ${targetLanguage}`);
    return translationCache.get(cacheKey);
  }

  try {
    const completion = await runQueued(() =>
      withRetry(() =>
        groqInstances[currentGroqIndex].chat.completions.create({
          model: config.groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(resultObj) },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      ),
    );

    const translated = JSON.parse(
      completion.choices[0]?.message?.content || "{}",
    );

    const finalTranslatedObj = {
      ...resultObj,
      reason: translated.reason || resultObj.reason,
      actionSteps: translated.actionSteps || resultObj.actionSteps,
      benefitAmount: translated.benefitAmount || resultObj.benefitAmount,
      paymentFrequency:
        translated.paymentFrequency || resultObj.paymentFrequency,
      requiredDocuments:
        translated.requiredDocuments || resultObj.requiredDocuments,
      rejectionExplanation:
        translated.rejectionExplanation || resultObj.rejectionExplanation,
      citation: translated.citation || resultObj.citation,
    };

    // Store in cache and manage LRU size
    if (translationCache.size >= MAX_CACHE_SIZE) {
      // Delete the oldest key (first item in Map)
      const oldestKey = translationCache.keys().next().value;
      translationCache.delete(oldestKey);
    }
    translationCache.set(cacheKey, finalTranslatedObj);

    return finalTranslatedObj;
  } catch (error) {
    logger.error("Translation failed:", error.message);
    throw new Error(`LLM translation failed: ${error.message}`);
  }
}

/**
 * General conversational assistant for Krishi Mitra.
 * Handles both navigation (rule-based hints) and general agricultural knowledge.
 *
 * @param {string} query - The user's question
 * @param {Array} history - Previous messages in the conversation
 * @param {Object} profile - Brief farmer profile for personalization
 * @param {string} language - Target language code (default 'en')
 * @returns {string} The AI's response text
 */
async function chatWithKrishiMitra(query, history = [], profile = {}, language = 'en') {
  const systemPrompt = `You are "Krishi Mitra", a helpful and knowledgeable agricultural assistant for the Niti Setu platform.
  
  YOUR PERSONALITY:
  - You are a friendly, wise, and empathetic "friend of the farmer".
  - You speak simply and clearly, avoiding unnecessary jargon.
  - You are passionate about helping farmers access government benefits and improve their yields.

  YOUR KNOWLEDGE BASE:
  - You know about Indian government schemes (PM-Kisan, RKVY, NMSA, etc.).
  - You know basic farming practices (soil health, irrigation, pest control).
  - You know how to use the Niti Setu app (Eligibility Check, Schemes Page, Profile Management).

  STRICT RULES:
  1. If the user asks about the app itself, guide them to the correct page:
     - To check eligibility: "Go to the 'Eligibility Check' page in the sidebar."
     - To see their history: "Check the 'History' tab in your dashboard."
     - To view documents: "The 'Schemes' section has all the official PDF documents."
  2. If the user asks a specialized farming question, provide helpful advice but suggest consulting a local KVK (Krishi Vigyan Kendra) for critical matters.
  3. ALWAYS maintain a supportive tone.
  4. If you don't know the answer, admit it and suggest where they might find it.
  5. CRITICAL INSTRUCTION: You MUST translate and respond strictly in the language code provided: "${language}". If "${language}" is "hi-IN", reply entirely in Hindi script. If Marathi, Bengali, Tamil etc., use their native script. Do not output English if a native Indian language code is passed.

  FARMER CONTEXT:
  The person you are talking to is named ${profile.name || "Farmer"}. They are from ${profile.state || "India"} and grow ${profile.cropType || "crops"}. Use this to personalize your advice.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6), // Keep last 3 turns of context
    { role: "user", content: query }
  ];

  try {
    const completion = await runQueued(() =>
      withRetry(() =>
        groqInstances[currentGroqIndex].chat.completions.create({
          model: "llama-3.3-70b-versatile", // High quality for general chat
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      ),
    );

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    logger.error("Krishi Mitra chat failed:", error.message);
    throw new Error(`Chat assistant failed: ${error.message}`);
  }
}

/**
 * Phase 4: Ephemeral Auto-Scan Multi-Modal Extraction
 * Extracts farmer profile structured data from a base64 encoded document image.
 * Uses strict data minimization to avoid extracting generic PII (like Aadhaar numbers).
 * 
 * @param {string} base64Image - The base64 string of the uploaded document
 * @param {string} documentType - Type of document (e.g. '7/12', 'Aadhaar', 'KCC')
 * @returns {Promise<Object>} - Parsed profile object
 */
async function extractProfileFromDocument(base64Image, documentType) {
  const systemPrompt = `You are a strict, secure OCR and data extraction AI for a government agricultural platform.
Your job is to read the provided document (type: ${documentType}) and extract ONLY the agricultural and core demographic data required for scheme eligibility.

STRICT PRIVACY RULES:
1. NEVER extract or output any Government ID numbers (e.g., the 12-digit Aadhaar number, PAN number). Ignore them completely.
2. If the document is an Aadhaar card, extract the Name, State, Date of Birth/Age, and Gender.
3. If the document is a 7/12 Land Extract (Satbara), extract the Owner Name, State/District, and Land Holding (Sum the total land size in Acres heavily accurately by converting Hectares if needed; 1 Hectare = 2.47 Acres).

OUTPUT FORMAT:
Output ONLY valid JSON. Your output must strictly adhere to this schema:
{
  "name": "Extracted full name",
  "age": Number (calculated from DOB if present),
  "gender": "male" | "female" | "other",
  "state": "Full State Name in English (e.g. Maharashtra)",
  "category": "general" | "obc" | "sc" | "st" | "other" (infer if possible, else leave empty),
  "landHolding": Number (in Acres),
  "annualIncome": Number (if present)
}
Omit any keys where the data is not found in the image. DO NOT output markdown, backticks, or conversational text.`;

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: systemPrompt },
        { 
          type: 'image_url', 
          image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
        }
      ]
    }
  ];

  try {
    const completion = await runQueued(() =>
      withRetry(() =>
        groqInstances[currentGroqIndex].chat.completions.create({
          model: "llama-3.2-11b-vision-preview", // Vision model
          messages: messages,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      )
    );

    const extractedText = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(extractedText);
  } catch (error) {
    logger.error('Document extraction failed:', error);
    throw new Error('Failed to analyze document: ' + error.message);
  }
}

module.exports = {
  checkEligibility,
  extractProfileFromTranscript,
  transcribeAudio,
  translateEligibilityResult,
  chatWithKrishiMitra,
  extractProfileFromDocument
};
