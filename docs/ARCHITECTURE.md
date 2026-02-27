# Niti Setu: System Architecture

[![Status](https://img.shields.io/badge/Status-Architecture%20Design-yellow)](#status)
[![Stack](https://img.shields.io/badge/Stack-RAG%20%7C%20Groq%20%7C%20MongoDB-blue)](#stack)
[![License](https://img.shields.io/badge/License-MIT-orange)](#license)
[![DPDP Compliant](https://img.shields.io/badge/Security-DPDP%20Compliant-shield)](#security)

Niti Setu is a high-performance, multilingual RAG (Retrieval-Augmented
Generation) ecosystem designed to bridge the accessibility gap in Indian
agricultural schemes. It combines state-of-the-art AI with a privacy-first,
voice-centric UX.

## 🏗️ High-Level System Architecture (HLD)

The platform is built on a modular, decoupled architecture that ensures
scalability and security.

![System Architecture](architecture/system-architecture.png)

### Key Layers

1. **Frontend (React 19 + Vite):** A modern, responsive dashboard with a custom
   **Glassmorphic Design System**. Features advanced UI components: `Aurora`,
   `Plasma`, `Silk`, and `FluidGlass` for high-end aesthetics.
2. **API Gateway (Express.js):** Handles security (JWT, Google OAuth 2.0),
   performance (**GZIP compression**, `apicache`), and request routing.
3. **Intelligence Orchestrators:**
   * **Pro RAG Engine:** Custom implementation featuring **Reciprocal Rank
     Fusion (RRF)** to combine Vector and Keyword results.
   * **Llama 3.2 Vision:** Ephemeral document analysis for PII-safe profile
     extraction.
   * **Whisper V3 & Web Speech API:** Dual transcription layer for
     high-accuracy regional voice input.
   * **Neo4j Engine:** Graph-based conflict detection (via `EXCLUSIVE_OF`
     relationships) and scheme recommendation.
4. **Data Persistence:**
   * **MongoDB Atlas:** Vector-indexed storage with `$vectorSearch`. Includes a
     **PublicCheckCache** for deterministic demographic queries.
   * **Neo4j Aura:** Knowledge graph for taxonomic relationships and
     multi-scheme complementary modeling.
   * **Groq Cloud:** Ultra-fast Llama 3.3 70B inference for core reasoning.

---

## 🔬 Master RAG & Intelligence Sequence

The eligibility determination follows a strict, citation-backed intelligence
pipeline.

![RAG Sequence](architecture/master-rag-sequence.png)

### The Two-Phase Pipeline

1. **Ingestion Phase (Admin):**
   * PDFs are parsed and split into **Recursive Character Chunks** (1000 char
     with 200 char overlap).
   * Embeddings are generated **locally** using `Transformers.js`
     (all-MiniLM-L6-v2) to avoid cloud costs and latency.
   * Chunks are stored with metadata in MongoDB; Category taxonomy is mirrored
     in Neo4j (via `BELONGS_TO`).

2. **Reasoning Phase (Farmer):**
   * The user's query is vectorized.
   * **Hybrid Search:** Combines semantic vector similarity with keyword-based
     BM25 matching.
   * **Maximal Marginal Relevance (MMR):** Diversifies search results to ensure
     the LLM sees diverse criteria (e.g., age vs. land vs. income).
   * **Graph Conflict Injection:** Neo4j ensures the farmer isn't already in an
     exclusive scheme.
   * Groq Llama 3.3 evaluates the context and generates a structured JSON
     response with **verbatim citations**.

---

## 🛡️ Ephemeral Privacy-First Data Flow

Privacy is baked into the protocol. We follow a **Zero-Storage** policy for
sensitive documents like Aadhaar or land records.

![Privacy Data Flow](architecture/privacy-data-flow.png)

### Zero-Storage Protocol (Multer Implementation)

1. **Ephemeral Uploads:** Using Multer disk-storage, documents are stored in a
   local `tmp` directory.
2. **Stream-Only Processing:** Files are read as a buffer, sent as a base64
   binary stream to the Vision model, and **never stored in a database**.
3. **PII Stripping:** Logic specifically extracts land/demographic data while
   ignoring identity-specific numbers.
4. **Secure Wipe:** The `finally` block in `scanRoutes.js` executes `fs.unlink`
   to permanently purge the file within milliseconds of analysis.

---

## ⚡ Performance & Optimization

### Multi-Layer Caching

To ensure sub-second interaction and reduce AI costs, Niti Setu implements
four distinct caching layers:

1. **Model Cache (Local):** `Transformers.js` caches the 80MB embedding model
   locally.
2. **In-Memory LRU Cache:**
   * `embeddingCache`: Stores vectors for repeated queries.
   * `translationCache`: Stores LLM translation results.
3. **Database-Level Result Cache:**
   * **Private:** Recent results (24h) for same profile/scheme pair bypass AI.
   * **Public:** Deterministic profile hash instantly returns results for
     common demographic queries.
4. **HTTP Middleware Cache:** Uses `apicache` for scheme catalog delivery.

### Business & UI Details

* **Freemium Model:** Implements a **1-free public check** limit for anonymous
  users, tracked via `localStorage` and profile hashes.
* **Government Branding:** System-generated emails feature a **Government of
  India styled HTML template** with tricolor bars.
* **Audit Logger:** Centralized `auditLogger.js` records all administrative
  actions for transparency.

---

## 📂 Backend Component Architecture (LLD)

Our code is structured into clear pillars to support production-scale
maintenance.

![Backend Component Map](architecture/backend-component-map.png)

* **Routes (`/routes`):** Clean API surface (Auth, Eligibility, Voice, Scan,
  Analytics, Graph).
* **Services (`/services`):** The "Brains" where LLM logic, Graph traversal,
  and Embeddings live.
* **Models (`/models`):** MongoDB schemas for Users, Profiles, Schemes, Chunks,
  and Logs.
* **Middleware (`/middleware`):** Rate limiters, Joi-based validators, and
  high-security Auth checks.
