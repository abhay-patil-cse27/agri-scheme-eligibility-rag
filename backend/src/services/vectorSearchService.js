const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Perform vector search on the scheme_chunks collection.
 * Uses MongoDB Atlas $vectorSearch aggregation stage.
 *
 * @param {number[]} queryEmbedding - 384-dim embedding of the query
 * @param {string|null} schemeId - Optional: filter to a specific scheme
 * @param {number} limit - Number of results to return (default 5)
 * @returns {Array} Matching chunks sorted by relevance score
 */
async function searchSimilarChunks(queryEmbedding, schemeId = null, limit = 5) {
  const startTime = Date.now();

  // Build the $vectorSearch stage
  const vectorSearchStage = {
    $vectorSearch: {
      index: 'vector_index',
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates: limit * 20,
      limit: limit,
    },
  };

  // Add filter for specific scheme if provided
  if (schemeId) {
    vectorSearchStage.$vectorSearch.filter = {
      schemeId: new mongoose.Types.ObjectId(schemeId),
    };
  }

  const pipeline = [
    vectorSearchStage,
    {
      $project: {
        _id: 1,
        schemeId: 1,
        schemeName: 1,
        text: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('scheme_chunks');
    const results = await collection.aggregate(pipeline).toArray();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(
      `Vector search completed: ${results.length} results in ${duration}s` +
        (schemeId ? ` (filtered to scheme ${schemeId})` : '')
    );

    return results;
  } catch (error) {
    // If vector index doesn't exist yet, provide helpful error
    if (error.codeName === 'CommandNotSupportedOnView' || error.message.includes('vector')) {
      logger.error(
        'Vector search failed. Have you created the vector_index in MongoDB Atlas? ' +
          'See backend/src/config/vector-search-index.json for the index definition.'
      );
    }
    throw new Error(`Vector search failed: ${error.message}`);
  }
}

/**
 * Search across all schemes (no scheme filter).
 * Useful for the suggestion engine when finding alternatives.
 */
async function searchAllSchemes(queryEmbedding, limit = 10) {
  return searchSimilarChunks(queryEmbedding, null, limit);
}

module.exports = {
  searchSimilarChunks,
  searchAllSchemes,
};
