# Backend Documentation: Niti Setu

The Niti Setu backend is a robust Node.js/Express.js service designed to
orchestrate complex AI pipelines and secure data persistence.

## 🧠 AI Orchestration (RAG & Vision)

The core value of the backend lies in its **Custom Native RAG Engine**.

### RAG Pipeline Logic
1.  **Hybrid Retrieval:** Merges Vector similarity scores and Keyword match scores.
2.  **MMR Re-ranking:** Diversifies the top-k chunks to maximize the LLM's
    context coverage.
3.  **Vision Analysis:** Uses Llama 3.2 Vision to extract text from user-uploaded
    documents (Aadhaar/7-12) as an ephemeral stream.

## 📊 Database Architecture

*   **MongoDB Atlas:** 
    *   Primary storage for user profiles and scheme metadata.
    *   **Vector Search Index:** Handles the `$vectorSearch` queries using 
        cosine similarity.
*   **Neo4j Aura:** 
    *   Stores the **Scholarship/Scheme Taxonomy**.
    *   Enforces **Mutual Exclusion** logic (e.g., preventing a user from 
        getting Scheme B if they already have Scheme A).

## 🛡️ Security & Scalability

*   **JWT Authentication:** Secure token-based access for all profile routes.
*   **GZIP & Caching:** Uses `apicache` and GZIP compression for high-speed API
    delivery.
*   **Rate Limiting:** Multi-level limiters to prevent API abuse (DDOS
    protection).
*   **Zero-Storage Protocol:** Temporary file storage via Multer with mandatory
    deletion in `finally` blocks.

---

## 📂 Directory Structure

*   `/src/routes`: API endpoints (eligibility, scan, voice, auth)
*   `/src/services`: Business logic (RAG engine, graph traversal, AI calls)
*   `/src/models`: Mongoose schemas for MongoDB
*   `/src/middleware`: Auth, rate-limiting, and error-handling logic
