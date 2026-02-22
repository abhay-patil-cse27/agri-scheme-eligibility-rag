const mongoose = require('mongoose');
const logger = require('../config/logger');
const { cosineSimilarity } = require('../utils/mathUtils');

/**
 * Applies Maximal Marginal Relevance (MMR) to diversify search results.
 * 
 * @param {Array} chunks - The raw candidate chunks from MongoDB.
 * @param {number} targetLimit - The desired number of diverse chunks.
 * @param {number} lambda - Controls trade-off between relevance (1) and diversity (0).
 * @returns {Array} The selected diverse chunks.
 */
function applyMMR(chunks, targetLimit = 8, lambda = 0.5) {
  if (chunks.length <= targetLimit) {
    return chunks;
  }

  const selected = [];
  const unselected = [...chunks];

  // Step 1: Automatically select the highest scored chunk (first one due to sort)
  selected.push(unselected.shift());

  // Loop until we reach the target limit or run out of candidates
  while (selected.length < targetLimit && unselected.length > 0) {
    let bestScore = -Infinity;
    let bestIndex = -1;

    for (let i = 0; i < unselected.length; i++) {
      const candidate = unselected[i];
      const relevanceScore = candidate.score || 0;
      
      let maxSimilarityToSelected = -Infinity;

      for (const sel of selected) {
        if (!candidate.embedding || !sel.embedding) continue;
        const sim = cosineSimilarity(candidate.embedding, sel.embedding);
        if (sim > maxSimilarityToSelected) {
          maxSimilarityToSelected = sim;
        }
      }

      if (maxSimilarityToSelected === -Infinity) maxSimilarityToSelected = 0;

      // MMR Score Formula
      const mmrScore = (lambda * relevanceScore) - ((1 - lambda) * maxSimilarityToSelected);

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      selected.push(unselected.splice(bestIndex, 1)[0]);
    } else {
      break;
    }
  }

  return selected;
}

/**
 * Perform vector search on the scheme_chunks collection.
 * Uses MongoDB Atlas $vectorSearch aggregation stage.
 *
 * @param {number[]} queryEmbedding - 384-dim embedding of the query
 * @param {string|null} schemeId - Optional: filter to a specific scheme
 * @param {number} limit - Number of results to return (default 8)
 * @returns {Array} Matching chunks sorted by relevance and diversity
 */
async function searchSimilarChunks(queryEmbedding, schemeId = null, limit = 8, category = null) {
  const startTime = Date.now();
  const fetchLimit = limit > 0 ? Math.max(limit * 3, 30) : 30; // Over-fetch for MMR

  // Build the $vectorSearch stage
  const vectorSearchStage = {
    $vectorSearch: {
      index: 'vector_index',
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates: fetchLimit * 10,
      limit: fetchLimit,
    },
  };

  // Build filter object
  const searchFilter = {};
  
  if (schemeId) {
    searchFilter.schemeId = new mongoose.Types.ObjectId(schemeId);
  }

  // NOTE: 'category' was removed from the filter because it is not indexed in the MongoDB Atlas vector_index.
  // The Atlas index currently only supports 'schemeId' as a filter path.
  // If category filtering is required via $vectorSearch, the Atlas index JSON must be updated first.

  if (Object.keys(searchFilter).length > 0) {
    vectorSearchStage.$vectorSearch.filter = searchFilter;
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
        embedding: 1, // Include embedding for MMR calculation
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('scheme_chunks');
    const rawResults = await collection.aggregate(pipeline).toArray();

    // Apply MMR to diversify the results down to the requested limit
    const diversifiedResults = applyMMR(rawResults, limit, 0.5);

    // Memory Cleanup: explicitly delete chunk.embedding before returning
    const finalResults = diversifiedResults.map(chunk => {
      delete chunk.embedding;
      return chunk;
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(
      `Vector search completed: fetched ${rawResults.length}, returned ${finalResults.length} diverse results in ${duration}s` +
        (schemeId ? ` (filtered to scheme ${schemeId})` : '')
    );

    return finalResults;
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

