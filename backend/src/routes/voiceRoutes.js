const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const llmService  = require('../services/llmService');
const { asyncHandler }        = require('../middleware/errorHandler');
const { validateVoiceTranscript } = require('../middleware/validators');
const { protect } = require('../middleware/auth');
const logger = require('../config/logger');

// ── Make sure uploads dir always exists (absolute path from project root) ──
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4',
                     'audio/mpeg', 'audio/flac', 'audio/x-m4a', 'audio/webm;codecs=opus'];
    // Accept any audio/* MIME
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`), false);
    }
  },
});

/**
 * POST /api/voice/process
 * Accept a text transcript → extract farmer profile fields via LLM.
 */
router.post(
  '/process',
  protect,
  validateVoiceTranscript,
  asyncHandler(async (req, res) => {
    const { transcript } = req.body;
    logger.info(`Voice process request – transcript length: ${transcript?.length}`);

    const extractedProfile = await llmService.extractProfileFromTranscript(transcript);

    const extractedFields = Object.entries(extractedProfile)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key]) => key);
    const missingFields = ['name', 'age', 'state', 'district', 'landHolding', 'cropType', 'category']
      .filter((field) => !extractedFields.includes(field));

    res.json({
      success: true,
      data: { extractedProfile, extractedFields, missingFields, isComplete: missingFields.length === 0 },
    });
  })
);

/**
 * POST /api/voice/transcribe
 * Accepts multipart/form-data audio → Groq Whisper → extract profile
 */
router.post(
  '/transcribe',
  protect,
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided – send field named "audio"' });
    }

    // Rename temp file with correct extension so Groq can detect format
    const ext     = path.extname(req.file.originalname || 'recording.webm') || '.webm';
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);

    logger.info(`Audio file received: ${req.file.originalname} (${req.file.size} bytes) → ${newPath}`);

    try {
      const transcript     = await llmService.transcribeAudio(newPath);
      const extractedProfile = await llmService.extractProfileFromTranscript(transcript);

      const extractedFields = Object.entries(extractedProfile)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k]) => k);
      const missingFields = ['name', 'age', 'state', 'district', 'landHolding', 'cropType', 'category']
        .filter((field) => !extractedFields.includes(field));

      res.json({
        success: true,
        data: { transcript, extractedProfile, extractedFields, missingFields, isComplete: missingFields.length === 0 },
      });
    } catch (err) {
      logger.error('Voice transcribe route error:', err.message);
      // Clean up temp file before re-throwing
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      throw err; // Let asyncHandler convert to 500 with the real message
    } finally {
      // Always clean up (error re-throw goes to asyncHandler, so finally still runs)
      try { if (fs.existsSync(newPath)) fs.unlinkSync(newPath); } catch (_) {}
    }
  })
);

module.exports = router;
