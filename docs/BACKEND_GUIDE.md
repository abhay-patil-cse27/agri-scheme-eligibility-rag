# Backend Documentation: Niti Setu

The Niti Setu backend is a robust Node.js/Express.js service designed to
orchestrate complex AI pipelines and secure data persistence.

## 🧠 AI Orchestration (RAG & Vision)

The core value of the backend lies in its **Custom Native RAG Engine**.

### RAG Pipeline Logic
1.  **Groq Cloud (Llama 3.3/3.2):** We utilize Groq for ultra-fast, low-latency AI inference
    for reasoning and extracting text from user-uploaded documents (Aadhaar/7-12) as an
    ephemeral vision stream.
2.  **Embedding Process:** Raw scheme PDFs are parsed and split into overlapping segments
    (1000 characters, 200 character overlap). We use the `Xenova/all-MiniLM-L6-v2` model
    via Transformers.js locally to generate 384-dimensional vector embeddings at zero cost.
3.  **Hybrid Retrieval:** Merges Vector similarity scores and Keyword match scores.
4.  **MMR Re-ranking:** Diversifies the top-k chunks to maximize the LLM's context coverage.

![Vector Search Logic](architecture/vector-search-logic.png)

## 📊 Database Architecture

*   **MongoDB Atlas:** 
    *   Primary storage for user profiles and scheme data.
    *   **Vector Database:** Stores the 1000-character document chunks alongside rich metadata.
    *   **Vector Search Index:** Handles the `$vectorSearch` queries using cosine similarity.
*   **Neo4j Aura (Free):** 
    *   Stores the **Scholarship/Scheme Taxonomy** as a Knowledge Graph.
    *   Enforces **Mutual Exclusion** logic (e.g., preventing a user from getting Scheme B
        if they already have Scheme A).

## 🛡️ Security, Auth & Comms

*   **Google OAuth 2.0:** Secure, one-click social login via Passport.js configuration.
*   **JWT Authentication:** JSON Web Tokens are used for stateless, secure session management
    post-login.
*   **Rate Limiting:** `express-rate-limit` acts as DDOS protection to prevent API abuse and
    guard AI processing routes.
*   **SMTP & Mailtrap:** We use `nodemailer` configured with a Mailtrap sandbox for secure
    transactional email delivery (like OTPs and notifications) without exposing live email
    credentials during development.
*   **Zero-Storage Protocol:** Temporary file storage via Multer with mandatory deletion in
    `finally` blocks.

---

## 📂 Directory Structure

*   `/src/routes`: API endpoints (eligibility, scan, voice, auth)
*   `/src/services`: Business logic (RAG engine, graph traversal, AI calls)
*   `/src/models`: Mongoose schemas for MongoDB
*   `/src/middleware`: Auth, rate-limiting, and error-handling logic

![Backend Component Map](architecture/backend-component-map.png)
