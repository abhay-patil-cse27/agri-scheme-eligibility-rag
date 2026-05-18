const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/auth');
const llmService = require('../services/llmService');
const logger = require('../config/logger');

// Setup multer to store files temporarily in a temp directory
const tempDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `scan-${Date.now()}-${file.originalname}`);
  }
});

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif', 'application/pdf'
]);
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.heic', '.heif']);

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype.toLowerCase();
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIMES.has(mime) || !ALLOWED_EXTS.has(ext)) {
      return cb(new Error(`Unsupported file type (${ext}). Allowed: JPG, PNG, PDF, WebP, HEIC.`), false);
    }
    // Cross-check: extension and mime must be in the same group
    const mimeGroup = mime.startsWith('image/') ? 'image' : 'document';
    const extGroup = ext === '.pdf' ? 'document' : 'image';
    if (mimeGroup !== extGroup) {
      return cb(new Error('File type mismatch: extension does not match content type.'), false);
    }
    cb(null, true);
  }
});

/**
 * @route   POST /api/scan/document
 * @desc    Upload an image or PDF to auto-extract profile fields.
 *          Strict zero-storage: The file is analyzed and IMMEDIATELY deleted.
 * @access  Private
 */
router.post('/document', protect, upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No document file provided.' });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    logger.info(`Starting ephemeral scan for user ${req.user.id}, file: ${req.file.filename}, type: ${mimeType}`);

    const docType = req.body.documentType || 'Official ID / Land Record';
    const landUnit = req.body.landUnit || 'Hectares';
    let extractedData;

    if (mimeType === 'application/pdf') {
      // PDF Processing Flow
      const fileBuffer = fs.readFileSync(filePath);
      let pdfData;
      try {
        pdfData = await pdfParse(fileBuffer);
      } catch (pdfErr) {
        logger.error(`PDF parse error: ${pdfErr.message}`);
        return res.status(400).json({
          success: false,
          error: 'Failed to read the PDF file. It might be corrupt.'
        });
      }

      const extractedText = pdfData.text ? pdfData.text.trim() : '';
      logger.info(`PDF Text Extraction result length: ${extractedText.length}`);

      if (extractedText.length > 50) {
        logger.info(`Extracting profile using text RAG from PDF`);
        extractedData = await llmService.extractProfileFromPDFText(extractedText, docType, 'self-scan', landUnit);
      } else {
        logger.warn(`PDF has no indexable text. Presumed scanned image PDF.`);
        return res.status(400).json({
          success: false,
          error: 'This PDF appears to be a scanned image with no indexable text. Since Groq Vision requires raw image files, please upload your scanned document as a JPG, PNG, or WebP image instead of a PDF!'
        });
      }
    } else {
      // Normal Image Processing Flow
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      extractedData = await llmService.extractProfileFromDocument(base64Data, docType, 'self-scan', landUnit, mimeType);
    }

    logger.info(`Extraction complete for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: extractedData,
      message: 'Document scanned successfully. Data extracted.'
    });

  } catch (error) {
    logger.error(`Document scan error for user ${req.user.id}: ${error.message}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to scan and extract data from the document.' });
  } finally {
    // CRITICAL PRIVACY STEP: Always delete the file from the temp directory!
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`CRITICAL: Failed to delete temp file ${filePath}: ${err.message}`);
      } else {
        logger.info(`Temp file ${filePath} securely deleted.`);
      }
    });
  }
});

module.exports = router;

