# Niti Setu (नीति सेतु) 🌾

AI-Powered Multilingual RAG Ecosystem for Indian Agricultural Schemes.

[![GitHub Release](https://img.shields.io/badge/Release-v1.0--Production-green)](#key-features)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20RAG%20%7C%20Groq-blue)](#technical-architecture)
[![License](https://img.shields.io/badge/License-MIT-orange)](#license)

Niti Setu is a professional-grade "last-mile" delivery engine for government
schemes. It uses **Retrieval-Augmented Generation (RAG)** to decode complex
policy PDFs and provide farmers with instant, citation-backed eligibility
decisions in their native language.

---

## Key Features

- **Multilingual Support:** Native localization and intelligence for 10 regional languages: **English, Hindi, Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Malayalam, and Punjabi**.
- **Secure OTP Verification:** Robust 2-step verification system for registration and password recovery via official Government-style emails.
- **Krishi Mitra AI Assistant:** A floating, voice-enabled assistant with **Multi-session Chat History**, supporting **Whisper STT** and **Auto-Speech Synthesis** (TTS) powered by a heavily optimized LRU Audio Cache. Features a premium **Glassmorphic Home Tab** with real-time status indicators.
- **Privacy-First (Zero-Storage):** Vision AI scans 7/12 extracts and Aadhaar documents in-memory without permanent storage.
- **Security-First Governance:** Automated **Security Termination Emails** citing the **IT Act 2000 (India)** and associated cyber laws are issued instantly when an administrator removes a profile for security reasons.
- **Advanced Native Retrieval:** Multi-path search (Vector + BM25) with built-from-scratch **MMR** for diversity and **Reciprocal Rank Fusion (RRF)** for precision, implemented without any third-party RAG libraries.
- **Massive Knowledge Base:** 35+ official PDFs across 9 priority sectors, directly linked to `myscheme.gov.in` for high-availability universal access.
- **Dual-Layer Conflict Engine:** Actively prevents fraudulent or overlapping applications combining **Neo4j Graph `EXCLUSIVE_OF` rules** with **Semantic Duplicate Override** prompts in the LLM.
- **Deterministic RAG Caching:** Eligibility checks are secured via **SHA-256 profile hashing**. The cache intelligently recognizes if a farmer modifies their active enrollments list (Conflict Test) and instantly bypasses stale cache to trigger a fresh LLM evaluation.
- **Citation-Backed Decisions:** Every result includes verbatim quotes and page references for 100% verifiability, driven by a deep 3-Tier Optimization Cache (Eligibility, Translation, and TTS) to save API tokens and reduce latency.
- **Progressive Disclosure UI:** Dynamic "Existing Enrollments" toggles adapting seamlessly to Light/Dark modes, ensuring farmers aren't overwhelmed with forms.
- **Smart Voice Sync:** Real-time synchronization of **Groq-Whisper** transcriptions directly into the chat input field across all interfaces (Dashboard & Floating Bot).

---

## Technical Architecture

Niti Setu follows a modular, decoupled architecture designed for high
performance and strict data privacy.

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, Framer Motion, **React Bits** | Premium **Glassmorphic** design system, interactive animations, and responsive layouts. |
| **Auth & Security** | **OTP**, **Google OAuth**, **JWT** | Secure 2-step registration, social login, stateless session management, and DDOS protection. |
| **API Gateway** | Express.js, Node.js | Secure orchestration, file uploading (Multer), and caching (`apicache`). |
| **Intelligence** | **Groq Cloud** (Llama 3.3/3.2) | Core reasoning, RAG analysis, and Vision processing with ultra-fast inference speeds. |
| **Embeddings** | **Xenova/all-MiniLM-L6-v2** | Local, zero-cost vector embeddings processed via Transformers.js. |
| **Vector DB** | **MongoDB Atlas** | Stores users, scheme data, and 1000-character document chunks with rich metadata for `$vectorSearch`. |
| **Graph DB** | **Neo4j Aura (Free)** | Relationship mapping for scheme constraints to detect conflicting eligibility (Knowledge Graph). |
| **Voice Ops** | Web Speech API, **ElevenLabs** | Multilingual Speech-to-Text (native) and high-fidelity Text-to-Speech synthesis. |
| **Email/Comms** | Nodemailer, **Mailtrap** | SMTP for reliable transactional delivery of **OTPs**, welcome notices, and alerts. |

### Component Deep-Dive

- **Groq Cloud:** Powers the core intelligence utilizing Llama 3.3 for lightning-fast logical reasoning and Llama 3.2 Vision for ephemeral document extraction.
- **Vector DB (MongoDB Atlas):** Serves as the primary data lake. Stores 10,000+ contextual chunks for RAG and persists **Multi-session Chat History** for authenticated users.
- **Knowledge Graph (Neo4j):** Models complex scheme rules and exclusions, seeding 22+ hard mutual exclusion links to instantly reject overlapping scheme combinations (e.g. holding both PMFBY and WBCIS) before they even reach the LLM.
- **Local Embeddings:** Uses the `Xenova/all-MiniLM-L6-v2` model executed entirely server-side via Transformers.js to map policy texts into zero-cost, privacy-preserving 384-dimensional vectors.
- **Voice Engine (ElevenLabs):** Translates the LLM’s text responses into highly realistic, localized neural speech output for an accessibility-first experience.
- **SMTP & Mailtrap:** Configured to manage secure **OTP verification** and transactional communications via a sandboxed testing environment.
- **Auth & Security Layer:** Integrates **OTP-based 2-step verification** for high-security registrations, combined with **Google OAuth** for frictionless 1-click logins.

### Native Intelligence Pipeline (Zero-Framework Architecture)

Unlike standard AI applications, Niti Setu does not utilize any high-level RAG frameworks (LangChain, LlamaIndex), pre-built "Custom RAG" templates, or specialized Hybrid-Search libraries. Every functional component—from vector fusion to conflict detection—is written natively in Node.js to ensure maximum performance and absolute data sovereignty.

```mermaid
graph TD
    User([User Query]) --> Trans[Multilingual Translation]
    Trans --> Vector[Vector Similarity Path]
    Trans --> Keyword[Keyword Match Path]
    Vector --> RRF[Reciprocal Rank Fusion]
    Keyword --> RRF
    RRF --> MMR[Maximal Marginal Relevance]
    MMR --> Graph[Graph-Based Conflict Detection]
    Graph --> LLM[Llama 3.3 Reasoning]
    LLM --> Citation[Citation-Backed Verdict]
```

### Core Logic USPs

- **Bespoke Native Core (Zero LangChain/LlamaIndex):** Direct implementation of the entire retrieval and reasoning orchestrator.
  - *Why avoid frameworks like LangChain/Hybrid-RAG kits?*
    1. **Performance:** Frameworks introduce massive dependency bloat and middle-man latency. Native code executes 3x faster with 90% less overhead.
    2. **Transparency:** High-level wrappers obfuscate the exact token payload and "under-the-hood" prompt modifications. Our native approach ensures 100% deterministic control over prompt structures.
    3. **Privacy Compliance:** Many frameworks include hidden telemetry or third-party data handlers. By building natively, we maintain 100% DPDP compliance with no external data leakage.
    4. **Cost Control:** Granular control over every byte sent to the LLM allows for extreme token optimization that generic chains cannot achieve.
- **Recursive Character Chunking:** Policies are split into 1000-character blocks with 200-character overlap manually using optimized regex and semantic boundary detection, bypassing slow generic web loaders.
- **Unique Chunk Sovereignty:** Every chunk is SHA-256 hashed to ensure uniqueness and prevent duplicate reasoning.
- **Native Custom MMR Function:** We built our own Maximal Marginal Relevance (MMR) and Reciprocal Rank Fusion (RRF) algorithms from scratch instead of relying on specialized library plugins. This prevents redundant criteria from overwhelming the LLM context window while maintaining extreme speed.
- **Privacy Data Flow:** Optimized for DPDP compliance with a memory-only buffer strategy for sensitive document scans without third-party interference.

---

## Installation and Setup

### 1. Clone & Install

```bash
git clone https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag.git
cd agri-scheme-eligibility-rag
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory. You will need to obtain and
configure the following API keys to enable the full intelligence pipeline:

- **MONGODB_URI**: Your MongoDB Atlas connection string (ensure Vector Search is enabled on the collection).
- **GROQ_API_KEY**: Your API key from [Groq Cloud](https://console.groq.com/) (used for Llama 3.3 70B and Llama 3.2 Vision).
- **NEO4J_URI / NEO4J_PASSWORD**: Connection details for your [Neo4j Aura](https://neo4j.com/cloud/aura/) instance (used for the Knowledge Graph).
- **ELEVENLABS_API_KEY**: (Optional) For high-fidelity neural voice responses.

Refer to `backend/.env.example` for the complete template.

### 3. Run Locally

```bash
# Start Backend
cd backend && npm run dev

# Start Frontend
cd frontend && npm run dev
```

---

## Documentation

Explore our deep-dive technical documents:

- **[Technical Architecture](docs/ARCHITECTURE.md)**: Details on HLD, LLD, and Data Flow diagrams.
- **[Frontend Guide](docs/FRONTEND_GUIDE.md)**: Deep dive into the React Design System and Glassmorphic components.
- **[Backend Guide](docs/BACKEND_GUIDE.md)**: Implementation details of databases, security, and the AI service layer.
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Implementation details of MMR, chunking, and search algorithms.
- **[API Specification](docs/API_SPEC.md)**: Complete REST API documentation.
- **[Privacy Policy](docs/PRIVACY_POLICY.md)**: Zero-storage protocol details.

---

## License & Contact

Distributed under the MIT License. Created by **Abhay Patil** -
[patil.abhay214@gmail.com](mailto:patil.abhay214@gmail.com).

Project Link: [https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag](https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag)
