# Niti Setu (नीति सेतु) 🌾

**AI-Powered Multilingual RAG Ecosystem for Indian Agricultural Schemes.**

[![GitHub Release](https://img.shields.io/badge/Release-v1.0--Production-green)](#release)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20RAG%20%7C%20Groq-blue)](#stack)
[![License](https://img.shields.io/badge/License-MIT-orange)](#license)
[![DPDP Compliant](https://img.shields.io/badge/Security-DPDP%20Compliant-shield)](#security)

Niti Setu is a professional-grade "last-mile" delivery engine for government schemes. It uses **Retrieval-Augmented Generation (RAG)** to decode complex policy PDFs and provide farmers with instant, citation-backed eligibility decisions in their native language.

---

## 🚀 Key Features

*   🌍 **Multilingual support:** Full localization for 6 core languages: **Hindi, Marathi, Malayalam, Punjabi, Bengali, and English**.
*   🎤 **Krishi Mitra AI Assistant:** A floating, voice-enabled guide that supports both **Voice Dictation** (STT) and **Auto-Speech Synthesis** (TTS).
*   🛡️ **Privacy-First (Zero-Storage):** Vision AI scans documents (7/12 extract, Aadhaar) and extracts data without storing sensitive IDs.
*   🧠 **Advanced RAG Engine:** Hybrid search (Vector + BM25) with **MMR (Maximal Marginal Relevance)** for diversity and **Reciprocal Rank Fusion (RRF)** for relevance.
*   📊 **Professional Analytics:** Admin dashboard featuring **Recharts** visualizations for eligibility trends, demographic splits, and system health.
*   📄 **Citation-Backed:** Every "Yes/No" result includes an exact verbatim quote and page reference from the official government PDF.
*   💰 **Freemium Access:** Integrated **1-free-check policy** for public users before requiring secure registration.

---

## 🏗️ Architecture

Niti Setu follows a modern, decoupled architecture designed for high performance and strict data privacy.

### System Overview

![System Architecture](docs/architecture/system-architecture.png)

### RAG Logic Flow

![RAG Pipeline](docs/architecture/master-rag-sequence.png)

> **[View Full Architecture Documentation ➔](docs/ARCHITECTURE.md)**

---

## 🛠️ Technology Stack

*   **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Recharts.
*   **Rich UI Components:** Aurora, FluidGlass, Plasma, and Silk effects for a premium glassmorphic aesthetic.
*   **Backend:** Node.js, Express, Multer, Helmet, GZIP Compression, Nodemailer (Mailtrap).
*   **AI/ML:**
    *   **LLM:** Groq (Llama 3.3 70B & 3.2 11B Vision).
    *   **Embeddings:** Transformers.js (Local execution via `all-MiniLM-L6-v2`).
    *   **STT/TTS:** Web Speech API & ElevenLabs.
*   **Database:** MongoDB Atlas (Vector Search) & Neo4j Aura (Knowledge Graph).
*   **Security:** JWT, Google OAuth 2.0, DPDP-aligned data minimization, and Multi-Level Rate Limiting.

---

## 📦 Installation & Setup

### Prerequisites

*   Node.js (v18+)
*   MongoDB Atlas Account
*   Groq API Key
*   Neo4j Aura Instance

### 1. Clone & Install

```bash
git clone https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag.git
cd agri-scheme-eligibility-rag
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory (see `backend/.env.example`).

```env
MONGODB_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_key
NEO4J_URI=your_neo4j_uri
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 3. Run Locally

```bash
# Start Backend
cd backend
npm run dev

# Start Frontend
cd frontend
npm run dev
```

---

## 📄 Documentation

*   **[Technical Architecture](docs/ARCHITECTURE.md)**: Deep dive into RAG, MMR, and Graph logic.
*   **[API Specification](docs/API_SPEC.md)**: Complete REST API documentation.
*   **[Privacy Policy](docs/PRIVACY_POLICY.md)**: Details on zero-storage and data security.
*   **[Developer Guide](docs/Phase1_MMR_Architecture.md)**: Implementation details of the MMR diversity filter.

---

## 🤝 Contributing

We welcome contributions to help Indian farmers!

1.  Fork the repo.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

**Abhay Patil** - [patil.abhay214@gmail.com](mailto:patil.abhay214@gmail.com)  
Project Link: [https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag](https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag)