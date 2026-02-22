# Phase 1: Hybrid RAG Architecture Enhancement (MMR - Diversity Filtering)

## Objective
The current vector search mechanism (using purely Cosine Similarity via MongoDB `$vectorSearch`) retrieves the top $N$ closest text chunks. If a document repeats similar concepts across multiple pages, the returned chunks will be highly redundant (e.g., pulling 4 different variations of an age limit rule). This limits the LLM's context size and hides distinct, non-repetitive but crucial rules (like obscure land limits or application steps).

By implementing **Maximal Marginal Relevance (MMR)**, we penalize redundancy and force the retrieval of a highly diverse, unique set of facts that comprehensively cover the scheme.

## Implementation Steps

### 1. Math Utilities (`backend/src/utils/mathUtils.js`)
We need a helper function to compute the Cosine Similarity between two embedding arrays in Node.js.
*   **Action**: Create a utility module containing `cosineSimilarity(vecA, vecB)` to determine the "sameness" of two retrieved chunks strictly from memory.

### 2. Over-fetching in MongoDB (`backend/src/services/vectorSearchService.js`)
To filter down to the best 8 unique chunks, we must start with a larger pool of highly relevant candidates.
*   **Action**: Update the `$vectorSearch` query limit from `8` to `30`.
*   **Action**: Update the `$project` stage in the aggregation pipeline to return the raw `embedding` vectors back to the Node.js server. (Currently, we exclude them to save bandwidth, but MMR needs them).

### 3. The MMR Algorithm Logic (`backend/src/services/vectorSearchService.js`)
Construct the `applyMMR(chunks, targetLimit = 8, lambda = 0.5)` function.
*   **Step 1:** Automatically select the chunk with the highest raw relevance score (provided by MongoDB's `$meta: 'vectorSearchScore'`).
*   **Step 2:** Loop through the remaining unselected chunks. For each chunk, calculate its cosine similarity to the chunks that have *already* been selected.
*   **Step 3:** Score every unselected chunk using the MMR formula:
    `Score = (lambda * Original_Query_Relevance) - ((1 - lambda) * Max_Similarity_To_Already_Selected)`
    *(Lambda `0.5` gives equal weight to query relevance and diversity).*
*   **Step 4:** Pick the highest-scoring candidate, move it to the selected list, and repeat the loop until we reach the `targetLimit` (8 chunks).

### 4. Memory Cleanup
Embeddings are massive arrays of 384 floats. We don't want to pass these 8 vectors into the LLM context or keep them in memory longer than necessary.
*   **Action**: After filtering via MMR, explicitly `delete chunk.embedding` from the 8 selected chunks before returning them to `eligibilityRoutes.js`.

### 5. Future Scope (True Hybrid Search)
Once MMR is functioning and fixing repetition, the next step involves converting the Atlas Vector index to an Atlas Search index to combine `$search` (BM25 keyword search) with `$vectorSearch`. This guarantees that exact acronym matches (e.g., "PMKVY") force specific chunks to the top of the candidate pool before MMR diversifies them.
