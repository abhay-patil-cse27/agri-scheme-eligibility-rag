const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Scheme = require('../models/Scheme');
const SchemeChunk = require('../models/SchemeChunk');
const pdfProcessor = require('../services/pdfProcessor');
const embeddingService = require('../services/embeddingService');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateObjectId } = require('../middleware/validators');
const logger = require('../config/logger');

// Multer config for PDF uploads
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'schemes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * POST /api/schemes/upload
 * Upload a PDF and trigger the full RAG ingestion pipeline:
 *   PDF → Extract → Chunk → Embed → Store in MongoDB
 */
router.post(
  '/upload',
  uploadLimiter,
  upload.single('pdf'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const schemeName = req.body.schemeName || path.basename(req.file.originalname, '.pdf');
    const description = req.body.description || '';
    const category = req.body.category || 'other';

    logger.info(`Starting PDF ingestion: ${schemeName}`);

    // Step 1: Process PDF (extract + chunk)
    const { chunks, totalChunks, numPages } = await pdfProcessor.processPDF(
      req.file.path,
      schemeName
    );

    // Step 2: Generate embeddings for all chunks
    const texts = chunks.map((c) => c.text);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    // Step 3: Create Scheme record
    const scheme = await Scheme.create({
      name: schemeName,
      description,
      category,
      sourceFile: req.file.filename,
      totalChunks,
      processedAt: new Date(),
    });

    // Step 4: Store chunks with embeddings in MongoDB
    const chunkDocs = chunks.map((chunk, i) => ({
      schemeId: scheme._id,
      schemeName: schemeName,
      text: chunk.text,
      embedding: embeddings[i],
      metadata: chunk.metadata,
    }));

    await SchemeChunk.insertMany(chunkDocs);

    logger.info(`PDF ingestion complete: ${schemeName} → ${totalChunks} chunks stored`);

    res.status(201).json({
      success: true,
      data: {
        schemeId: scheme._id,
        name: schemeName,
        numPages,
        totalChunks,
        message: `PDF processed and ${totalChunks} chunks stored with embeddings`,
      },
    });
  })
);

/**
 * GET /api/schemes
 * List all processed schemes.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const schemes = await Scheme.find({ isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: schemes.length,
      data: schemes,
    });
  })
);

/**
 * GET /api/schemes/:id
 * Get scheme details including chunk count.
 */
router.get(
  '/:id',
  validateObjectId,
  asyncHandler(async (req, res) => {
    const scheme = await Scheme.findById(req.params.id).select('-__v').lean();

    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found' });
    }

    const chunkCount = await SchemeChunk.countDocuments({ schemeId: scheme._id });

    res.json({
      success: true,
      data: { ...scheme, chunkCount },
    });
  })
);

/**
 * DELETE /api/schemes/:id
 * Remove a scheme and all its chunks.
 */
router.delete(
  '/:id',
  validateObjectId,
  asyncHandler(async (req, res) => {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found' });
    }

    // Delete all chunks for this scheme
    const deletedChunks = await SchemeChunk.deleteMany({ schemeId: scheme._id });

    // Delete the scheme itself
    await Scheme.findByIdAndDelete(req.params.id);

    // Clean up the PDF file
    const filePath = path.join(uploadsDir, scheme.sourceFile);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logger.info(`Scheme deleted: ${scheme.name} (${deletedChunks.deletedCount} chunks removed)`);

    res.json({
      success: true,
      data: {
        message: `Scheme "${scheme.name}" and ${deletedChunks.deletedCount} chunks deleted`,
      },
    });
  })
);

module.exports = router;
