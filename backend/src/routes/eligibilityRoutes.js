const express = require('express');
const router = express.Router();

const Scheme = require('../models/Scheme');
const FarmerProfile = require('../models/FarmerProfile');
const EligibilityCheck = require('../models/EligibilityCheck');
const embeddingService = require('../services/embeddingService');
const vectorSearchService = require('../services/vectorSearchService');
const llmService = require('../services/llmService');
const suggestionEngine = require('../services/suggestionEngine');
const { asyncHandler } = require('../middleware/errorHandler');
const { eligibilityLimiter } = require('../middleware/rateLimiter');
const { validateEligibilityCheck } = require('../middleware/validators');
const logger = require('../config/logger');

/**
 * POST /api/eligibility/check
 * The core RAG endpoint: runs the full eligibility pipeline.
 *
 * Flow:
 *   1. Load farmer profile
 *   2. Find scheme
 *   3. Build search query from profile
 *   4. Generate query embedding
 *   5. Vector search for relevant document chunks
 *   6. Send profile + chunks to LLM
 *   7. If not eligible, find alternative schemes
 *   8. Save result and return
 */
router.post(
  '/check',
  eligibilityLimiter,
  validateEligibilityCheck,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { profileId, schemeName } = req.body;

    // Step 1: Load farmer profile
    const profile = await FarmerProfile.findById(profileId).lean();
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Farmer profile not found' });
    }

    // Step 2: Find the scheme
    const scheme = await Scheme.findOne({ name: schemeName, isActive: true }).lean();
    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: `Scheme "${schemeName}" not found. Use GET /api/schemes to see available schemes.`,
      });
    }

    logger.info(`Eligibility check: ${profile.name} → ${schemeName}`);

    // Step 3: Build search query from farmer profile
    const searchQuery = `eligibility criteria for ${schemeName} farmer from ${profile.state} district ${profile.district} with ${profile.landHolding} acres land holding ${profile.landHoldingHectares} hectares growing ${profile.cropType} category ${profile.category}`;

    // Step 4: Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);

    // Step 5: Vector search for relevant chunks
    const relevantChunks = await vectorSearchService.searchSimilarChunks(
      queryEmbedding,
      scheme._id.toString(),
      5
    );

    if (relevantChunks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No relevant document sections found for this scheme. The PDF may need to be re-uploaded.',
      });
    }

    // Step 6: Send to LLM for eligibility determination
    const llmResult = await llmService.checkEligibility(profile, relevantChunks, schemeName);

    // Step 7: If not eligible, find alternatives
    let suggestions = [];
    if (!llmResult.eligible) {
      suggestions = await suggestionEngine.findAlternatives(profile, scheme._id);
    }

    // Step 8: Save eligibility check record
    const totalResponseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    const eligibilityRecord = await EligibilityCheck.create({
      farmerId: profile._id,
      schemeId: scheme._id,
      schemeName: schemeName,
      eligible: llmResult.eligible,
      confidence: llmResult.confidence,
      reason: llmResult.reason,
      citation: llmResult.citation,
      citationSource: llmResult.citationSource,
      benefitAmount: llmResult.benefitAmount,
      requiredDocuments: llmResult.requiredDocuments,
      suggestions: suggestions,
      responseTime: totalResponseTime,
    });

    logger.info(
      `Eligibility result: ${schemeName} → ${llmResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (${totalResponseTime}s)`
    );

    // Return the complete result
    res.json({
      success: true,
      data: {
        checkId: eligibilityRecord._id,
        farmer: {
          name: profile.name,
          state: profile.state,
          district: profile.district,
          landHolding: profile.landHolding,
          landHoldingHectares: profile.landHoldingHectares,
          category: profile.category,
        },
        scheme: schemeName,
        eligible: llmResult.eligible,
        confidence: llmResult.confidence,
        reason: llmResult.reason,
        citation: llmResult.citation,
        citationSource: llmResult.citationSource,
        benefitAmount: llmResult.benefitAmount,
        requiredDocuments: llmResult.requiredDocuments,
        suggestions: suggestions,
        responseTime: totalResponseTime,
        chunksAnalyzed: relevantChunks.length,
      },
    });
  })
);

/**
 * GET /api/eligibility/history/:profileId
 * Get eligibility check history for a farmer profile.
 */
router.get(
  '/history/:id',
  asyncHandler(async (req, res) => {
    const checks = await EligibilityCheck.find({ farmerId: req.params.id })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: checks.length,
      data: checks,
    });
  })
);

module.exports = router;
