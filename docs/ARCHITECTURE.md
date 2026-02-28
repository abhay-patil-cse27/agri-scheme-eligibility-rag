# Niti Setu: System Architecture

[![Status](https://img.shields.io/badge/Status-Architecture%20Design-yellow)](#high-level-system-architecture-hld)
[![Stack](https://img.shields.io/badge/Stack-RAG%20%7C%20Groq%20%7C%20MongoDB-blue)](#technology-stack)
[![License](https://img.shields.io/badge/License-MIT-orange)](#ephemeral-privacy-first-data-flow)
[![DPDP Compliant](https://img.shields.io/badge/Security-DPDP%20Compliant-shield)](#ephemeral-privacy-first-data-flow)

Niti Setu is a high-performance, multilingual RAG (Retrieval-Augmented
Generation) ecosystem designed to bridge the accessibility gap in Indian
agricultural schemes. It combines state-of-the-art AI with a privacy-first,
independent, voice-centric UX.

## High-Level System Architecture (HLD)

The platform is built on a modular, decoupled architecture that ensures
scalability and security.

![System Architecture](architecture/system-architecture.png)

### Key Layers

1.  **Frontend (React 19 + Vite):** A modern, responsive dashboard with a custom
    **Glassmorphic Design System**. Features advanced UI components: `Aurora`,
    `Plasma`, `Silk`, and `FluidGlass` for high-end aesthetics.
2.  **API Gateway (Express.js):** Handles security (JWT, Google OAuth 2.0),
    **Identity Verification Gates** (account existence checks for resets),
    **Strict Password Strategy** (regex-based complexity), and request routing.
3.  **Intelligence Orchestrators:**
    *   **Pro RAG Engine:** Custom implementation featuring **Reciprocal Rank
        Fusion (RRF)** to combine Vector and Keyword results.
    *   **Llama 3.2 Vision:** Ephemeral document analysis for PII-safe profile
        extraction.
    *   **Whisper V3 & Web Speech API:** Dual transcription layer for
        high-accuracy regional voice input.
    *   **Neo4j Engine:** Graph-based conflict detection (via `EXCLUSIVE_OF`
        relationships) and scheme recommendation.
4.  **Data Persistence:**
    *   **MongoDB Atlas:** Vector-indexed storage with `$vectorSearch`. Includes a
        **PublicCheckCache** for deterministic demographic queries and persists 
        **Multi-session Chat History** with rich metadata.
    *   **Neo4j Aura:** Knowledge graph for taxonomic relationships and
        multi-scheme complementary modeling.
    *   **Groq Cloud:** Ultra-fast Llama 3.3 70B inference for core reasoning.

---

## Technical Deep Dive: Native Hybrid RAG Engine

Niti Setu employs a custom-built, native RAG pipeline specifically optimized for
legal and policy documentation.

### 1. Advanced Ingestion & Chunking Strategy

Unlike standard splitters, we use a **Recursive Character Chunking** strategy:
*   **Chunk Size:** 1000 characters.
*   **Overlap:** 200 characters (20%).
*   **Logic:** The system recursively attempts to split at logical boundaries
    (paragraphs, sentences, then spaces) to maintain context "glue."
*   **Uniqueness:** Every chunk is assigned a unique SHA-256 hash to prevent
    duplicate indices even across multiple document versions.

### 2. Hybrid Search & Retrieval

We implement a dual-path retrieval strategy to capture both semantic meaning and
specific keyword terms (like scheme codes or state names):
*   **Vector Path:** Uses `all-MiniLM-L6-v2` (via Transformers.js running
    locally) for 384-dimensional semantic similarity.
*   **Keyword Path:** Uses MongoDB Atlas Text Search (BM25) for literal matches.
*   **Fusion Mixer:** We use **Reciprocal Rank Fusion (RRF)** to combine these
    results, ensuring that if a chunk is relevant in both paths, it is boosted
    to the top.

### 3. Diversity Filtering (MMR)

To prevent the LLM from seeing redundant information, we apply **Maximal
Marginal Relevance (MMR)**:
*   It penalizes chunks that are too similar to already selected chunks.
*   This ensures the context window contains a diverse range of criteria (e.g.,
    one chunk about age, one about land size, one about crop type).

---

## The Knowledge Base: Source of Truth

The "Brain" of Niti Setu is a multi-layered Knowledge Base (KB) designed to
transform static government policies into actionable intelligence.

### 1. Ground Truth (The PDF Layer)

The KB is seeded with a curated collection of **35+ verified Agricultural
Policy PDFs** spanning **9 priority categories**. These documents serve as the
absolute "Ground Truth." To ensure maximum factual integrity:
*   **Direct Ingestion:** Documents are parsed directly from source PDFs to
    prevent manual transcription errors.
*   **Version Control:** The system tracks `uploadDates` to ensure farmers are
    checked against the most recent policy revisions.

### 2. Multilingual Facility

Niti Setu is a **Native Multilingual** application, not just translated text:
*   **Core Languages:** Hindi, Marathi, Malayalam, Punjabi, Bengali, and
    English.
*   **Processing:** Query translation happens at the service layer before
    retrieval, ensuring the RAG engine understands the intent regardless of the
    user's input language.
*   **Output:** The LLM generates the eligibility verdict in the user's selected
    language while citing the English/Local source document.

### 3. Factuality & Verifiability

Unlike standard chatbots, Niti Setu follows a **"No Citation, No Answer"** rule.
Every eligibility response is backed by:
*   **Verbatim Quotes:** Snippets directly from the KB.
*   **Page References:** Exact page numbers from the source PDF.
*   **Verified Mirrors:** Links to the primary source file for verification.

---

## Master RAG & Intelligence Sequence

The eligibility determination follows a strict, citation-backed intelligence
pipeline.

![RAG Sequence](architecture/master-rag-sequence.png)

### The Two-Phase Pipeline

1.  **Ingestion Phase (Admin):**
    *   PDFs are parsed and split into **Recursive Character Chunks**.
    *   Embeddings are generated **locally** using `Transformers.js` to avoid
        cloud costs and latency.
    *   Chunks are stored with metadata in MongoDB; Category taxonomy is mirrored
        in Neo4j.

2.  **Reasoning Phase (Farmer):**
    *   The user's query is vectorized.
    *   **Hybrid Search:** Vector similarity + Keyword matching.
    *   **MMR Diversification:** Ensures a broad set of criteria is evaluated.
    *   **Graph Conflict Injection:** Neo4j checks for scheme incompatibilities.
    *   **LLM Synthesis:** Groq Llama 3.3 generates the verdict with citations.

---

## Ephemeral Privacy-First Data Flow

Privacy is baked into the protocol. We follow a **Zero-Storage** policy for
sensitive documents like Aadhaar or land records.

![Privacy Data Flow](architecture/privacy-data-flow.png)

### Zero-Storage Protocol (Multer Implementation)

1.  **Ephemeral Uploads:** Using Multer disk-storage, documents are stored in a
    local `tmp` directory.
2.  **Stream-Only Processing:** Files are read as a buffer, sent as a base64
    binary stream to the Vision model, and **never stored in a database**.
3.  **PII Stripping:** Logic specifically extracts land/demographic data while
    ignoring identity-specific numbers.
4.  **Secure Wipe:** The `finally` block in `scanRoutes.js` executes `fs.unlink`
    to permanently purge the file within milliseconds of analysis.

---

## Performance & Optimization

### Multi-Layer Caching

To ensure sub-second interaction and reduce AI costs, Niti Setu implements
four distinct caching layers:

1.  **Model Cache (Local):** `Transformers.js` caches the 80MB embedding model
    locally.
2.  **In-Memory LRU Cache:**
    *   `embeddingCache`: Stores vectors for repeated queries.
    *   `translationCache`: Stores LLM translation results.
3.  **Database-Level Result Cache:**
    *   **Private:** Recent results (24h) for same profile/scheme pair bypass AI.
    *   **Public:** Deterministic profile hash instantly returns results for
        common demographic queries.
4.  **HTTP Middleware Cache:** Uses `apicache` for scheme catalog delivery.

### Business & UI Details

*   **Freemium Model:** Implements a **1-free public check** limit for anonymous
    users, tracked via `localStorage` and profile hashes.
*   **Premium Branding:** System-generated emails feature a **premium,
    independent styled HTML template** with modern tricolor accents.
*   **Audit Logger:** Centralized `auditLogger.js` records all administrative
    actions for transparency.

---

## Backend Component Architecture (LLD)

Our code is structured into clear pillars to support production-scale
maintenance.

![Backend Component Map](architecture/backend-component-map.png)

*   **Routes (`/routes`):** Clean API surface (Auth, Eligibility, Voice, Scan,
    Analytics, Graph).
*   **Services (`/services`):** The "Brains" where LLM logic, Graph traversal,
    and Embeddings live.
*   **Models (`/models`):** MongoDB schemas for Users, Profiles, Schemes, Chunks,
    **OTPs**, **ChatSessions**, **ChatMessages**, and Logs.
*   **Middleware (`/middleware`):** Rate limiters, Joi-based validators, and
    high-security Auth checks.
