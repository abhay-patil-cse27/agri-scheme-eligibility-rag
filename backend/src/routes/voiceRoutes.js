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
      const { language = 'en' } = req.body;
      const transcript     = await llmService.transcribeAudio(newPath, language);
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

/**
 * POST /api/voice/tts
 * Proxy text to ElevenLabs API and stream back the MP3
 */
router.post(
  '/tts',
  asyncHandler(async (req, res) => {
    const { text, language = 'hi' } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'No text provided' });

    const config = require('../config/env');
    if (!config.elevenlabsApiKey) {
       return res.status(500).json({ success: false, error: 'ElevenLabs API key is not configured' });
    }

    try {
      // Use the Multilingual v2 model with a default voice (e.g., Rachel, or any generic voice ID)
      // Voice ID "EXAVITQu4vr4xnSDxMaL" is a common default 'Bella' or 'Rachel' '21m00Tcm4TlvDq8ikWAM'
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; 
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenlabsApiKey,
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API Error: ${response.status} - ${errText}`);
      }

      res.set({
        'Content-Type': 'audio/mpeg'
      });

      // Send the audio buffer back to the client
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);

    } catch (err) {
      logger.error('TTS route error:', err.message);
      res.status(500).json({ success: false, error: 'Failed to generate speech audio' });
    }
  })
);

module.exports = router;
