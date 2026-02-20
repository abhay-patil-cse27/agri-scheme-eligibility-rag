const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const upload = multer({ dest: 'uploads/' });

const llmService = require('../services/llmService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateVoiceTranscript } = require('../middleware/validators');

/**
 * POST /api/voice/process
 * Accept a speech-to-text transcript and extract farmer profile fields.
 */
router.post(
  '/process',
  validateVoiceTranscript,
  asyncHandler(async (req, res) => {
    const { transcript } = req.body;
    const extractedProfile = await llmService.extractProfileFromTranscript(transcript);
    
    // Check missing fields including age
    const extractedFields = Object.entries(extractedProfile)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key]) => key);
    const missingFields = ['name', 'age', 'state', 'district', 'landHolding', 'cropType', 'category']
      .filter((field) => !extractedFields.includes(field));

    res.json({
      success: true,
      data: { extractedProfile, extractedFields, missingFields, isComplete: missingFields.length === 0 }
    });
  })
);

/**
 * POST /api/voice/transcribe
 * Takes multipart/form-data audio file, transcribes using Whisper, extracts profile
 */
router.post(
  '/transcribe',
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    const originalName = req.file.originalname || 'audio.webm';
    const ext = path.extname(originalName) || '.webm';
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);

    try {
      const transcript = await llmService.transcribeAudio(newPath);
      const extractedProfile = await llmService.extractProfileFromTranscript(transcript);
      
      const extractedFields = Object.entries(extractedProfile)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key]) => key);
      const missingFields = ['name', 'age', 'state', 'district', 'landHolding', 'cropType', 'category']
        .filter((field) => !extractedFields.includes(field));

      res.json({
        success: true,
        data: { transcript, extractedProfile, extractedFields, missingFields, isComplete: missingFields.length === 0 },
      });
    } finally {
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    }
  })
);

module.exports = router;
