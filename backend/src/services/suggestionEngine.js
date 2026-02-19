const Scheme = require('../models/Scheme');
const embeddingService = require('./embeddingService');
const vectorSearchService = require('./vectorSearchService');
const llmService = require('./llmService');
const logger = require('../config/logger');

/**
 * Find alternative schemes when a farmer is ineligible for their target scheme.
 * Searches across all other schemes for potential matches.
 *
 * @param {Object} profile - Farmer profile data
 * @param {string} excludeSchemeId - Scheme ID to exclude (the one they were ineligible for)
 * @returns {Array} Top 2-3 alternative scheme suggestions with reasoning
 */
async function findAlternatives(profile, excludeSchemeId) {
  const startTime = Date.now();

  try {
    // Get all active schemes except the excluded one
    const otherSchemes = await Scheme.find({
      _id: { $ne: excludeSchemeId },
      isActive: true,
    }).lean();

    if (otherSchemes.length === 0) {
      logger.info('No alternative schemes available');
      return [];
    }

    // Build a search query from the farmer's profile
    const searchQuery = `eligibility criteria for farmer from ${profile.state} with ${profile.landHolding} acres ${profile.cropType} farming ${profile.category} category`;

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);

    const suggestions = [];

    // Check each alternative scheme (limit to 5 to keep response time reasonable)
    const schemesToCheck = otherSchemes.slice(0, 5);

    for (const scheme of schemesToCheck) {
      try {
        // Quick vector search for this scheme
        const chunks = await vectorSearchService.searchSimilarChunks(
          queryEmbedding,
          scheme._id.toString(),
          3
        );

        if (chunks.length === 0) continue;

        // Quick eligibility check
        const result = await llmService.checkEligibility(profile, chunks, scheme.name);

        suggestions.push({
          schemeName: scheme.name,
          schemeId: scheme._id,
          eligible: result.eligible,
          reason: result.reason,
          benefitAmount: result.benefitAmount,
          matchScore: chunks[0]?.score || 0,
          citation: result.citation,
        });
      } catch (schemeError) {
        logger.warn(`Suggestion check failed for ${scheme.name}: ${schemeError.message}`);
        // Continue with other schemes
      }
    }

    // Sort by: eligible first, then by match score
    suggestions.sort((a, b) => {
      if (a.eligible !== b.eligible) return b.eligible - a.eligible;
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

    // Return top 3 suggestions
    const topSuggestions = suggestions.slice(0, 3);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(
      `Found ${topSuggestions.length} alternative suggestions in ${duration}s`
    );

    return topSuggestions;
  } catch (error) {
    logger.error('Suggestion engine error:', error.message);
    return [];
  }
}

module.exports = {
  findAlternatives,
};
