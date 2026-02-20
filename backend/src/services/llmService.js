const Groq = require('groq-sdk');
const config = require('../config/env');
const logger = require('../config/logger');

const groq = new Groq({ apiKey: config.groqApiKey });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute a function with exponential backoff retries (useful for 429 Too Many Requests)
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 2000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if ((error.status === 429 || error.status >= 500) && attempt < maxRetries - 1) {
        attempt++;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`API Rate Limit hit (429/50x). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        await sleep(delay);
      } else {
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
    - Actively look for exclusion criteria (e.g., income tax payee, pensioner, institutional landholder). If the profile exceeds standard realistic limits (e.g., 40 acres might be too large for small/marginal schemes or indicate high wealth), scrutinize the excerpts heavily.
    - Be highly conservative. If a scheme (or component) is meant for institutions, primary cooperatives, FPOs, or large-scale industrial infrastructure (e.g., Agri-Infrastructure-Fund, 2MW solar plants), assume an individual standard farmer is NOT ELIGIBLE unless the excerpts explicitly state individual farmers can apply for that *exact* component.
    - If crucial eligibility parameters clearly required by the scheme are missing from the excerpts, default to NOT ELIGIBLE or reduce confidence, explicitly stating the lack of data.

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
  "reason": "Very brief 1 sentence summary (e.g., 'You are eligible for ₹6,000 yearly' or 'You do not meet the land limits').",
  "benefitAmount": "Exact amount as string or null (e.g., '₹6,000')",
  "paymentFrequency": "Frequency as string or null (e.g., 'Yearly in 3 installments')",
  "actionSteps": ["Upload Aadhar on portal", "Wait for verification"] or [],
  "rejectionExplanation": {
    "criteria": "Rule they failed (e.g., 'Maximum land holding allowed is 2 hectares')",
    "yourProfile": "Their profile value (e.g., 'You have 3 hectares of land')"
  } or null,
  "citation": "Exact text quoted from the document excerpts that supports your decision",
  "citationSource": {
    "page": 12,
    "section": "Eligibility Criteria"
  },
  "officialWebsite": "URL or null"
}`;

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
- Age: ${profile.age || 'Not specified'}
- State: ${profile.state}
- District: ${profile.district}
- Land Holding: ${profile.landHolding} acres (${profile.landHoldingHectares} hectares)
- Crop Type: ${profile.cropType}
- Social Category: ${profile.category}
- Annual Income: ${profile.annualIncome ? '₹' + profile.annualIncome : 'Not specified'}
- Irrigation Access: ${profile.hasIrrigationAccess ? 'Yes' : 'No'}

OFFICIAL DOCUMENT EXCERPTS:
${documentContext}

Based ONLY on the above document excerpts, determine if this farmer is eligible for ${schemeName}. Return your answer as the specified JSON structure.

IMPORTANT MULTILINGUAL RULE: 
You MUST translate the values for 'reason', 'actionSteps' (array of strings), 'benefitAmount', 'paymentFrequency', and the string values inside the 'rejectionExplanation' object into the following target language: **${language === 'hi' ? 'Hindi (हिंदी)' : language === 'mr' ? 'Marathi (मराठी)' : 'English'}**. Keep the JSON keys in English, but output the human-readable text strictly in the target language. Use simple, conversational language suitable for a farmer.`;

  try {
    const completion = await withRetry(() => groq.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: ELIGIBILITY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }));

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error('Empty response from Groq LLM');
    }

    const result = parseResponse(rawResponse);
    result.responseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    logger.info(
      `Eligibility check completed: ${schemeName} → ${result.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (${result.responseTime}s)`
    );

    return result;
  } catch (error) {
    logger.error(`Groq LLM error for ${schemeName}:`, error.message);
    throw new Error(`LLM eligibility check failed: ${error.message}`);
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
    return {
      eligible: Boolean(parsed.eligible),
      confidence: parsed.confidence || 'medium',
      reason: parsed.reason || 'No reason provided',
      citation: parsed.citation || '',
      citationSource: {
        page: parsed.citationSource?.page || null,
        section: parsed.citationSource?.section || '',
        subsection: parsed.citationSource?.subsection || '',
        paragraph: parsed.citationSource?.paragraph || null,
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
  const systemPrompt = `You are a profile extraction assistant. Extract farmer details from the given voice transcript.

RESPOND ONLY WITH THIS JSON STRUCTURE:
{
  "name": "farmer name or null",
  "age": number_or_null,
  "state": "state name or null",
  "district": "district name or null",
  "landHolding": number_in_acres_or_null,
  "cropType": "crop type or null",
  "category": "General or SC or ST or OBC or null",
  "annualIncome": number_or_null,
  "hasIrrigationAccess": true_or_false_or_null
}

  Extract whatever information is available. Set null for missing fields.`;

  try {
    const completion = await withRetry(() => groq.chat.completions.create({
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
 * @returns {string} Trancribed text
 */
async function transcribeAudio(filePath) {
  const fs = require('fs');
  try {
    const transcription = await withRetry(() => groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      response_format: "json",
    }));
    
    logger.info('Audio transcribed successfully');
    return transcription.text;
  } catch (error) {
    logger.error('Audio transcription failed:', error.message);
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

module.exports = {
  checkEligibility,
  extractProfileFromTranscript,
  transcribeAudio
};
