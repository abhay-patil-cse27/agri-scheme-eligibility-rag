const express = require('express');
const router = express.Router();

const llmService = require('../services/llmService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateVoiceTranscript } = require('../middleware/validators');

/**
 * POST /api/voice/process
 * Accept a speech-to-text transcript and extract farmer profile fields.
 * The actual speech-to-text happens in the browser via Web Speech API.
 * This endpoint receives the transcript text and uses LLM to extract structured data.
 */
router.post(
  '/process',
  validateVoiceTranscript,
  asyncHandler(async (req, res) => {
    const { transcript } = req.body;

    // Use LLM to extract structured profile from voice transcript
    const extractedProfile = await llmService.extractProfileFromTranscript(transcript);

    // Identify which fields were successfully extracted
    const extractedFields = Object.entries(extractedProfile)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key]) => key);

    const missingFields = ['name', 'state', 'district', 'landHolding', 'cropType', 'category']
      .filter((field) => !extractedFields.includes(field));

    res.json({
      success: true,
      data: {
        extractedProfile,
        extractedFields,
        missingFields,
        isComplete: missingFields.length === 0,
        message:
          missingFields.length === 0
            ? 'All required fields extracted successfully'
            : `Missing fields: ${missingFields.join(', ')}. Please provide additional details.`,
      },
    });
  })
);

module.exports = router;
