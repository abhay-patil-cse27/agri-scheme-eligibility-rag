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
const { validateEligibilityCheck, validateObjectId } = require('../middleware/validators');
const { protect } = require('../middleware/auth');
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
  protect,
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

    // Role check: Farmer can only check their own profile
    if (req.user.role === 'farmer' && profile.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to check this profile' });
    }

    // Step 2: Determine which schemes to check
    let schemesToCheck = [];
    if (schemeName && schemeName !== 'all') {
      const scheme = await Scheme.findOne({ name: schemeName, isActive: true }).lean();
      if (!scheme) {
        return res.status(404).json({
          success: false,
          error: `Scheme "${schemeName}" not found.`,
        });
      }
      schemesToCheck.push(scheme);
    } else {
      schemesToCheck = await Scheme.find({ isActive: true }).lean();
      if (schemesToCheck.length === 0) {
        return res.status(404).json({ success: false, error: 'No active schemes found in database.' });
      }
    }

    logger.info(`Eligibility check: ${profile.name} → ${schemeName === 'all' || !schemeName ? 'ALL SCHEMES' : schemeName}`);

    // Process all schemes in parallel
    const results = await Promise.all(schemesToCheck.map(async (scheme) => {
      try {
        // Use a generic search query aimed at retrieving the RULES, not matching the specific profile numbers
        const searchQuery = `eligibility criteria, beneficiary conditions, who is eligible, age limit, land holding limit, income limit, exclusions, who is not eligible for ${scheme.name}`;
        const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
        // Increase retrieved chunks to 8 to ensure we capture both inclusive rules and exclusionary rules
        const relevantChunks = await vectorSearchService.searchSimilarChunks(queryEmbedding, scheme._id.toString(), 8);

        if (relevantChunks.length === 0) {
          return { scheme: scheme.name, error: 'No relevant document sections found.' };
        }

        const llmResult = await llmService.checkEligibility(profile, relevantChunks, scheme.name);

        let suggestions = [];
        if (!llmResult.eligible && schemesToCheck.length === 1) {
          suggestions = await suggestionEngine.findAlternatives(profile, scheme._id);
        }

        const totalResponseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

        const officialWebsiteUrl = scheme.officialWebsite || llmResult.officialWebsite;
        const documentUrl = `${req.protocol}://${req.get('host')}/api/schemes/docs/${scheme.sourceFile}`;

        const eligibilityRecord = await EligibilityCheck.create({
          farmerId: profile._id,
          schemeId: scheme._id,
          schemeName: scheme.name,
          eligible: llmResult.eligible,
          confidence: llmResult.confidence,
          reason: llmResult.reason,
          citation: llmResult.citation,
          citationSource: llmResult.citationSource,
          officialWebsite: officialWebsiteUrl,
          documentUrl: documentUrl,
          benefitAmount: llmResult.benefitAmount,
          requiredDocuments: llmResult.requiredDocuments,
          suggestions: suggestions,
          responseTime: totalResponseTime,
        });

        return {
          checkId: eligibilityRecord._id,
          scheme: scheme.name,
          eligible: llmResult.eligible,
          confidence: llmResult.confidence,
          reason: llmResult.reason,
          citation: llmResult.citation,
          citationSource: llmResult.citationSource,
          officialWebsite: officialWebsiteUrl,
          documentUrl: documentUrl,
          benefitAmount: llmResult.benefitAmount,
          requiredDocuments: llmResult.requiredDocuments,
          suggestions: suggestions,
          responseTime: totalResponseTime,
          chunksAnalyzed: relevantChunks.length,
        };
      } catch (err) {
        logger.error(`Error processing scheme ${scheme.name}:`, err.message);
        return { scheme: scheme.name, error: err.message };
      }
    }));

    // Return array if all, or single object if one scheme for backwards compatibility
    const responseData = (schemesToCheck.length === 1 && schemeName !== 'all') ? results[0] : results;

    res.json({
      success: true,
      data: responseData,
    });
  })
);

/**
 * GET /api/eligibility/history/:profileId
 * Get eligibility check history for a farmer profile.
 */
router.get(
  '/history/:id',
  protect,
  asyncHandler(async (req, res) => {
    // Check if profile belongs to user
    const profile = await FarmerProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    if (req.user.role === 'farmer' && profile.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

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

/**
 * DELETE /api/eligibility/:id
 * Delete an eligibility check record.
 */
router.delete(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const check = await EligibilityCheck.findById(req.params.id);
    
    if (!check) {
      return res.status(404).json({ success: false, error: 'Eligibility check not found' });
    }

    // Role check: Farmer can only delete their own checks
    if (req.user.role === 'farmer') {
      const profile = await FarmerProfile.findById(check.farmerId);
      if (profile && profile.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this check' });
      }
    }

    await EligibilityCheck.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {},
    });
  })
);

module.exports = router;
