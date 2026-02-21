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
const { eligibilityLimiter, publicEligibilityLimiter } = require('../middleware/rateLimiter');
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
    const { profileId, schemeName, language = 'en' } = req.body;

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

    // Process schemes sequentially to avoid overwhelming Groq LLM API with parallel 70b calls
    const results = [];
    for (const scheme of schemesToCheck) {
      try {
        // Use a generic search query aimed at retrieving the RULES, not matching the specific profile numbers
        const searchQuery = `eligibility criteria, beneficiary conditions, who is eligible, age limit, land holding limit, income limit, exclusions, who is not eligible for ${scheme.name}`;
        const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
        // Increase retrieved chunks to 8 to ensure we capture both inclusive rules and exclusionary rules
        const relevantChunks = await vectorSearchService.searchSimilarChunks(queryEmbedding, scheme._id.toString(), 8);

        if (relevantChunks.length === 0) {
          results.push({ scheme: scheme.name, error: 'No relevant document sections found.' });
          continue;
        }

        const llmResult = await llmService.checkEligibility(profile, relevantChunks, scheme.name, language);

        let suggestions = [];
        if (!llmResult.eligible && schemesToCheck.length === 1) {
          suggestions = await suggestionEngine.findAlternatives(profile, scheme._id, language);
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

        results.push({
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
        });

        // Add a slight delay between sequential requests to let token buckets refill
        if (schemesToCheck.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        logger.error(`Error processing scheme ${scheme.name}:`, err.message);
        results.push({ scheme: scheme.name, error: err.message });
      }
    }

    // Return array if all, or single object if one scheme for backwards compatibility
    const responseData = (schemesToCheck.length === 1 && schemeName !== 'all') ? results[0] : results;

    res.json({
      success: true,
      data: responseData,
    });
  })
);

/**
 * POST /api/eligibility/public-check
 * UNAUTHENTICATED RAG endpoint for the Freemium public access model.
 * 
 * Flow:
 *   1. Accept raw profile data from body (not a database ID)
 *   2. Find scheme
 *   3. Generate query embedding & vector search
 *   4. Send to LLM
 *   5. Return result WITHOUT saving to database
 */
router.post(
  '/public-check',
  publicEligibilityLimiter,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { profileData, schemeName, language = 'en' } = req.body;

    if (!profileData || !profileData.name || !profileData.state) {
      return res.status(400).json({ success: false, error: 'Basic profile data (Name, State) is required.' });
    }

    // Determine which schemes to check
    let schemesToCheck = [];
    if (schemeName && schemeName !== 'all') {
      const scheme = await Scheme.findOne({ name: schemeName, isActive: true }).lean();
      if (!scheme) {
        return res.status(404).json({ success: false, error: `Scheme "${schemeName}" not found.` });
      }
      schemesToCheck.push(scheme);
    } else {
      schemesToCheck = await Scheme.find({ isActive: true }).lean();
      if (schemesToCheck.length === 0) {
        return res.status(404).json({ success: false, error: 'No active schemes found in database.' });
      }
    }

    logger.info(`Public Eligibility check: ${profileData.name} → ${schemeName === 'all' || !schemeName ? 'ALL SCHEMES' : schemeName}`);

    // Process schemes sequentially for public checks as well
    const results = [];
    for (const scheme of schemesToCheck) {
      try {
        const searchQuery = `eligibility criteria, beneficiary conditions, who is eligible, age limit, land holding limit, income limit, exclusions, who is not eligible for ${scheme.name}`;
        const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
        const relevantChunks = await vectorSearchService.searchSimilarChunks(queryEmbedding, scheme._id.toString(), 8);

        if (relevantChunks.length === 0) {
          results.push({ scheme: scheme.name, error: 'No relevant document sections found.' });
          continue;
        }

        const llmResult = await llmService.checkEligibility(profileData, relevantChunks, scheme.name, language);
        
        let suggestions = [];
        if (!llmResult.eligible && schemesToCheck.length === 1) {
          suggestions = await suggestionEngine.findAlternatives(profileData, scheme._id, language);
        }
        
        const totalResponseTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
        
        const officialWebsiteUrl = scheme.officialWebsite || llmResult.officialWebsite;
        const documentUrl = `${req.protocol}://${req.get('host')}/api/schemes/docs/${scheme.sourceFile}`;

        results.push({
          checkId: 'public-' + Date.now(),
          scheme: scheme.name,
          ...llmResult,
          officialWebsite: officialWebsiteUrl,
          documentUrl: documentUrl,
          suggestions: suggestions,
          responseTime: totalResponseTime,
          chunksAnalyzed: relevantChunks.length,
          isPublicCheck: true
        });

        if (schemesToCheck.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        logger.error(`Error processing public scheme check ${scheme.name}:`, err.message);
        results.push({ scheme: scheme.name, error: err.message });
      }
    }

    const responseData = (schemesToCheck.length === 1 && schemeName !== 'all') ? results[0] : results;
    res.json({ success: true, data: responseData });
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

/**
 * POST /api/eligibility/translate-result
 * Translates an existing eligibility result into a target language.
 */
router.post(
  '/translate-result',
  asyncHandler(async (req, res) => {
    const { result, language } = req.body;
    if (!result || !language) {
      return res.status(400).json({ success: false, error: 'Result object and language are required' });
    }

    try {
      const translatedData = await llmService.translateEligibilityResult(result, language);
      res.json({
        success: true,
        data: translatedData
      });
    } catch (err) {
      logger.error('Failed to translate result:', err.message);
      res.status(500).json({ success: false, error: 'Failed to translate result' });
    }
  })
);

module.exports = router;
