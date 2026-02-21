const Groq = require('groq-sdk');
const config = require('../config/env');
const logger = require('../config/logger');

const groqInstances = [
  new Groq({ apiKey: config.groqApiKey })
];
let currentGroqIndex = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



/**
 * Execute a function with exponential backoff retries (useful for 429 Too Many Requests)
 */
async function withRetry(fn, maxRetries = 8, baseDelay = 2000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if ((error.status === 429 || error.status >= 500) && attempt < maxRetries - 1) {
        attempt++;
        let delay = baseDelay * Math.pow(2, attempt - 1);
        
        // Key rotation fallback logic completely commented out per user request:
        // if (error.status === 429 && groqInstances.length > 1) {
        //   currentGroqIndex = (currentGroqIndex + 1) % groqInstances.length;
        //   logger.warn(`API Rate Limit hit (429). Rotating to backup API Key (index ${currentGroqIndex})...`);
        //   delay = 1000; 
        // } else {
        logger.warn(`API Rate Limit hit (${error.status}). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        // }
        
        // Add random jitter between 200ms and 800ms
        const jitter = Math.floor(Math.random() * 600) + 200;
        await sleep(delay + jitter);
      } else {
        if (error.status === 429) {
          throw new Error('API Rate Limit Exceeded. The service is currently handling too many requests. Please try again in a few moments.');
        }
        if (error.status >= 500) {
          throw new Error('AI Service is temporarily unavailable. Please try again later.');
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

Your task:
- Compare the farmer's profile against the scheme's eligibility criteria found in the document excerpts.
- Determine if the farmer is ELIGIBLE or NOT ELIGIBLE.
- If ELIGIBLE:
    - Provide the exact Benefit Amount (e.g., "₹6,000").
    - Provide the Payment Frequency if available (e.g., "Yearly in 3 installments").
    - Provide clear, simple Action Steps to apply (e.g., "1. Visit pmkisan.gov.in", "2. Submit Aadhar").
    - Set rejectionExplanation to null.
- If NOT ELIGIBLE:
    - Set benefitAmount, paymentFrequency, and actionSteps to null.
    - Provide a scannable rejectionExplanation object detailing EXACTLY what criteria they failed.
        - criteria: The strict rule from the document.
        - yourProfile: The farmer's actual value that caused the failure.

RESPOND ONLY WITH THIS EXACT JSON STRUCTURE:
{
  "eligible": true or false,
  "confidence": "high" or "medium" or "low",
  "reason": "Detailed 3-5 sentence explanation that: (a) states whether the farmer is eligible or not, (b) explains which specific criteria from the document matched or failed against the farmer's profile, (c) mentions the specific numbers (e.g. land size, income, age) that led to the decision, and (d) uses a warm, empathetic tone addressing the farmer directly.",
  "benefitAmount": "Exact amount as string or null (e.g., '₹6,000')",
  "paymentFrequency": "Frequency as string or null (e.g., 'Yearly in 3 installments')",
  "actionSteps": ["Upload Aadhar on portal", "Wait for verification"] or [],
  "requiredDocuments": ["Aadhaar Card", "Land ownership records / 7/12 extract", "Bank passbook with IFSC", "Passport-size photo"] (ALWAYS provide this list — include all standard documents needed to apply for this scheme, plus any category-specific certificates as per the rules above),
  "rejectionExplanation": {
    "criteria": "Rule they failed (e.g., 'Maximum land holding allowed is 2 hectares')",
    "yourProfile": "Their profile value (e.g., 'You have 3 hectares of land')"
  } or null,
  "citation": "Exact verbatim text quoted from the document excerpts that supports your decision. Must be a direct quote, not a paraphrase.",
  "citationSource": {
    "page": 12,
    "section": "Eligibility Criteria",
    "paragraph": 3
  },
  "officialWebsite": "URL or null"
}`;


const languageMap = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  mr: 'Marathi (मराठी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡିଆ)',
  as: 'Assamese (অসমীয়া)',
  ur: 'Urdu (اردو)',
};

/**
 * Check eligibility by sending farmer profile + retrieved document chunks to Groq LLM.
 *
 * @param {Object} profile - Farmer profile data
 * @param {Array} relevantChunks - Document chunks from vector search
 * @param {string} schemeName - Name of the scheme being checked
 * @param {string} [language='en'] - The target language to translate output strings to (e.g. 'en', 'hi', 'mr')
 * @returns {Object} Structured eligibility result
 */
async function checkEligibility(profile, relevantChunks, schemeName, language = 'en') {
  const startTime = Date.now();
  const targetLangString = languageMap[language] || 'English';

  // Build the user prompt with profile and document context
  const documentContext = relevantChunks
    .map(
      (chunk, i) =>
        `--- Document Excerpt ${i + 1} (Page ${chunk.metadata?.page || 'N/A'}, Section: ${chunk.metadata?.section || 'N/A'}) ---\n${chunk.text}`
    )
    .join('\n\n');

  const userPrompt = `SCHEME: ${schemeName}

FARMER PROFILE:
- Name: ${profile.name || 'N/A'}
- Age: ${profile.age || 'Not specified'} (Evaluate carefully against age limits)
- State: ${profile.state}
- District: ${profile.district}
- Land Holding: ${profile.landHolding} acres (${profile.landHoldingHectares || (profile.landHolding * 0.404686).toFixed(3)} hectares) (IMPORTANT: 1 acre = 0.404686 hectares. Check limits accurately)
- Crop Type: ${profile.cropType}
- Social Category: ${profile.category}
- Annual Income: ${profile.annualIncome ? '₹' + profile.annualIncome : 'Not specified'}
- Irrigation Access: ${profile.hasIrrigationAccess ? 'Yes' : 'No'}

OFFICIAL DOCUMENT EXCERPTS:
${documentContext}

Based ONLY on the above document excerpts, determine if this farmer is eligible for ${schemeName}. Return your answer as the specified JSON structure.

IMPORTANT MULTILINGUAL RULE: 
You MUST translate the values for 'reason', 'actionSteps' (array of strings), 'benefitAmount', 'paymentFrequency', and the string values inside the 'rejectionExplanation' object into the following target language: **${targetLangString}**. Keep the JSON keys in English, but output the human-readable text strictly in the target language. Use simple, conversational language suitable for a farmer.`;

  let rawResponse;

  try {
    const completion = await withRetry(() => groqInstances[currentGroqIndex].chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: ELIGIBILITY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }));

    rawResponse = completion.choices[0]?.message?.content;
  } catch (error) {
    logger.error(`Groq LLM error for ${schemeName}:`, error.message);
    throw new Error(`LLM eligibility check failed: ${error.message}`);
  }

  if (!rawResponse) {
    throw new Error('Empty response from Groq LLM');
  }

  try {
    const result = parseResponse(rawResponse);
    result.responseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    logger.info(
      `Eligibility check completed: ${schemeName} → ${result.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (${result.responseTime}s)`
    );

    return result;
  } catch (error) {
    logger.error(`Failed to parse LLM response for ${schemeName}:`, error.message);
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
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Sanitize citationSource.page — LLM sometimes returns strings like "Various"
    let pageVal = parsed.citationSource?.page;
    if (pageVal !== null && pageVal !== undefined) {
      const num = Number(pageVal);
      pageVal = isNaN(num) ? String(pageVal) : String(num);
    } else {
      pageVal = '';
    }

    let paragraphVal = parsed.citationSource?.paragraph;
    if (paragraphVal !== null && paragraphVal !== undefined) {
      paragraphVal = String(paragraphVal);
    } else {
      paragraphVal = '';
    }

    return {
      eligible: Boolean(parsed.eligible),
      confidence: parsed.confidence || 'medium',
      reason: parsed.reason || 'No reason provided',
      citation: parsed.citation || '',
      citationSource: {
        page: pageVal,
        section: parsed.citationSource?.section || '',
        subsection: parsed.citationSource?.subsection || '',
        paragraph: paragraphVal,
      },
      officialWebsite: parsed.officialWebsite || '',
      benefitAmount: parsed.benefitAmount || null,
      requiredDocuments: Array.isArray(parsed.requiredDocuments) ? parsed.requiredDocuments : [],
      additionalNotes: parsed.additionalNotes || '',
    };
  } catch (parseError) {
    logger.error('Failed to parse LLM response:', parseError.message);
    logger.error('Raw response:', cleaned);
    throw new Error('LLM returned invalid JSON response');
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
5. Irrigation: If they mention well, canal, river, pump ("विहीर", "नदी", "कालवा", "सिंचाई"), set hasIrrigationAccess to true.

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
  "hasIrrigationAccess": true_or_false_or_null
}

EXAMPLE TRANSCRIPT (Marathi):
"नमस्ते, माझं नाव रमेश पाटील आहे, मी ४५ वर्षांचा आहे. मी महाराष्ट्र राज्यातील पुणे जिल्ह्यात राहतो. माझ्याकडे २ एकर जमीन आहे आणि मी गहू पिकवतो. माझ्याकडे विहीर आहे."
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
  "hasIrrigationAccess": true
}

Extract whatever information is available from the actual provided transcript. Set null for completely missing fields.`;

  try {
    const completion = await withRetry(() => groqInstances[currentGroqIndex].chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Voice transcript: "${transcript}"` },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    }));

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    logger.info('Profile extracted from transcript successfully');
    return result;
  } catch (error) {
    logger.error('Profile extraction from transcript failed:', error.message);
    throw new Error(`Voice profile extraction failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using Groq's Whisper API
 * @param {string} filePath - Path to the audio file
 * @param {string} [language='en'] - Regional language code (e.g. 'hi', 'mr')
 * @returns {string} Trancribed text
 */
async function transcribeAudio(filePath, language = 'en') {
  const fs = require('fs');
  try {
    const whisperLanguage = language ? language.substring(0, 2).toLowerCase() : 'en';
    const transcription = await withRetry(() => groqInstances[currentGroqIndex].audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3", // upgraded from turbo for much better Indian language accuracy
      prompt: `Agricultural scheme eligibility app. Farmers speak in regional Indian languages.
RULES:
- Transcribe EXACTLY as spoken. Do NOT translate to English, do NOT paraphrase.
- Preserve regional number words faithfully. Key number words per language:
  Hindi: एक दो तीन चार पाँच छह सात आठ नौ दस बीस पचास सौ हजार लाख
  Marathi: एक दोन तीन चार पाच सहा सात आठ नऊ दहा वीस पन्नास शंभर हजार लाख
  Bengali: এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ বিশ পঞ্চাশ একশো হাজার লক্ষ
  Telugu: ఒకటి రెండు మూడు నాలుగు అయిదు ఆరు ఏడు ఎనిమిది తొమ్మిది పది ఇరవై యాభై వంద వేయి
  Tamil: ஒன்று இரண்டு மூன்று நான்கு ஐந்து ஆறு ஏழு எட்டு ஒன்பது பத்து இருபது ஐம்பது நூறு ஆயிரம்
  Gujarati: એક બે ત્રણ ચાર પાંચ છ સાત આઠ નવ દસ
  Kannada: ಒಂದು ಎರಡು ಮೂರು ನಾಲ್ಕು ಐದು ಆರು ಏಳು ಎಂಟು ಒಂಬತ್ತು ಹತ್ತು
  Malayalam: ഒന്ന് രണ്ട് മൂന്ന് നാല് അഞ്ച് ആറ് ഏഴ് എട്ട് ഒൻപത് പത്ത്
- Also preserve land unit words: एकर एकड़ एकरे हेक्टर बीघा गुंठा (acre/hectare/bigha/gunta)
- Example: "माझ्याकडे दोन एकर जमीन आहे" → transcribe exactly as said.`,
      response_format: "json",
      language: whisperLanguage
    }));
    
    logger.info('Audio transcribed successfully');
    return transcription.text;
  } catch (error) {
    logger.error('Audio transcription failed:', error.message);
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

/**
 * Translate an eligibility result JSON natively into the target language.
 */
async function translateEligibilityResult(resultObj, targetLanguage = 'hi') {
  const targetLangString = languageMap[targetLanguage] || targetLanguage;
  
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


  try {
    const completion = await withRetry(() => groqInstances[currentGroqIndex].chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(resultObj) },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }));

    const translated = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      ...resultObj,
      reason: translated.reason || resultObj.reason,
      actionSteps: translated.actionSteps || resultObj.actionSteps,
      benefitAmount: translated.benefitAmount || resultObj.benefitAmount,
      paymentFrequency: translated.paymentFrequency || resultObj.paymentFrequency,
      requiredDocuments: translated.requiredDocuments || resultObj.requiredDocuments,
      rejectionExplanation: translated.rejectionExplanation || resultObj.rejectionExplanation,
    };
  } catch (error) {
    logger.error('Translation failed:', error.message);
    throw new Error(`LLM translation failed: ${error.message}`);
  }
}

module.exports = {
  checkEligibility,
  extractProfileFromTranscript,
  transcribeAudio,
  translateEligibilityResult
};
