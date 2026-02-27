# Niti Setu (नीति सेतु) 🌾

AI-Powered Multilingual RAG Ecosystem for Indian Agricultural Schemes.

[![GitHub Release](https://img.shields.io/badge/Release-v1.0--Production-green)](#key-features)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20RAG%20%7C%20Groq-blue)](#technology-stack)
[![License](https://img.shields.io/badge/License-MIT-orange)](#license)

Niti Setu is a professional-grade "last-mile" delivery engine for government
schemes. It uses **Retrieval-Augmented Generation (RAG)** to decode complex
policy PDFs and provide farmers with instant, citation-backed eligibility
decisions in their native language.

---

## Key Features

*   **Multilingual Support:** Native localization for 6 core languages:
    **Hindi, Marathi, Malayalam, Punjabi, Bengali, and English**.
*   **Krishi Mitra AI Assistant:** A floating, voice-enabled assistant
    supporting **Voice Dictation** (STT) and **Auto-Speech Synthesis** (TTS).
*   **Privacy-First (Zero-Storage):** Vision AI scans 7/12 extracts and Aadhaar
    documents in-memory without permanent storage.
*   **Advanced RAG Engine:** Hybrid search (Vector + BM25) with **MMR** for
    diversity and **Reciprocal Rank Fusion (RRF)** for precision.
*   **Professional Analytics:** Dashboard featuring **Recharts** for
    eligibility trends and system health monitoring.
*   **Massive Knowledge Base:** 35+ official PDFs across 9 sectors.
*   **Citation-Backed Decisions:** Every result includes verbatim quotes and
    page references for 100% verifiability.

---

## Technical Architecture

Niti Setu follows a modular, decoupled architecture designed for high
performance and strict data privacy.

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Framer Motion | Premium Glassmorphic UI/UX |
| **API Gateway** | Express.js, JWT, Helmet | Secure Orchestration & Rate Limiting |
| **Intelligence** | Groq (Llama 3.3/3.2), RRF | Core RAG & Vision Reasoning |
| **Storage** | MongoDB Atlas, Neo4j Aura | Vector Data & Knowledge Graph |
| **Voice** | Web Speech API, ElevenLabs | Multilingual STT/TTS |

### RAG Sequence Flow

```mermaid
graph LR
    User([Farmer Query]) --> Trans[Translation]
    Trans --> Hybrid{Hybrid Search}
    Hybrid --> Vector[Vector Search]
    Hybrid --> Keyword[Keyword Match]
    Vector --> RRF[RRF Fusion]
    Keyword --> RRF
    RRF --> MMR[MMR Diversity]
    MMR --> Graph[Graph Conflict Check]
    Graph --> LLM[Llama 3.3 Reasoning]
    LLM --> Verdict([Eligibility Verdict])
```

---

## Installation and Setup

### 1. Clone & Install
```bash
git clone https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag.git
cd agri-scheme-eligibility-rag
npm install
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory based on the architecture
requirements:
*   `MONGODB_URI`: Atlas Vector Search URI.
*   `GROQ_API_KEY`: Groq Cloud API Key.
*   `NEO4J_URI`: Neo4j Aura Instance.

### 3. Run Locally
```bash
# Start Backend
cd backend && npm run dev

# Start Frontend
cd frontend && npm run dev
```

---

## Detailed Documentation

Explore our deep-dive technical documents:

*   **[Technical Architecture](docs/ARCHITECTURE.md)**: Details on HLD, LLD, and
    Data Flow.
*   **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Deep dive into MMR,
    recursive chunking, and search algorithms.
*   **[API Specification](docs/API_SPEC.md)**: Complete REST API documentation.
*   **[Privacy Policy](docs/PRIVACY_POLICY.md)**: Zero-storage protocol and
    DPDP compliance.

---

## Contributing

1.  Fork the repo.
2.  Create your branch (`git checkout -b feature/AmazingFeature`).
3.  Commit changes (`git commit -m 'Add AmazingFeature'`).
4.  Push to branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## License & Contact

Distributed under the MIT License. Created by **Abhay Patil** -
[patil.abhay214@gmail.com](mailto:patil.abhay214@gmail.com).

Project Link: [https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag](https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag)