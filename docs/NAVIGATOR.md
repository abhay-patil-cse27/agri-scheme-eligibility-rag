# 📚 Niti Setu: Documentation Roadmap

Welcome to the Niti Setu documentation hub. To help you navigate our "Industry-Grade" RAG ecosystem, use this guide to find exactly what you need.

## 🗺️ Choose Your Path

| If you are... | Recommended Starting Point |
| :--- | :--- |
| **A New Developer** | [🚀 Developer Guide](DEVELOPER_GUIDE.md) |
| **An Architect** | [🏗️ System Architecture](ARCHITECTURE.md) |
| **A Privacy Auditor** | [🛡️ Privacy Policy](PRIVACY_POLICY.md) |
| **A Frontend Engineer** | [✨ Frontend Guide](FRONTEND_GUIDE.md) |
| **An API Consumer** | [🔌 API Specification](API_SPEC.md) |

---

## 🛠️ Feature Deep-Dives

Dive into the technical implementation of our most powerful features:

### 📱 WhatsApp "Setu" (Bridge)

* **What:** Voice-note-centric gateway for rural accessibility.
* **Tech:** Twilio Webhooks + Groq Whisper STT + Llama 3.3.
* **Guide:** [Advanced Features > WhatsApp](docs/ADVANCED_FEATURES.md#1-whatsapp-setu-bridge-)

### 📶 Offline-First (PWA)

* **What:** Native-like app experience on patchy farm networks.
* **Tech:** Vite PWA + Workbox Caching Strategy.
* **Guide:** [Advanced Features > PWA](docs/ADVANCED_FEATURES.md#2-offline-first-pwa-)

### 🗣️ Hyper-Local Dialect Tuning

* **What:** Adapting AI persona to regional Marathi/Hindi nuances.
* **Tech:** Context-Injected System Prompts.
* **Guide:** [Advanced Features > Dialect Tuning](docs/ADVANCED_FEATURES.md#3-hyper-local-dialect-tuning-)

---

## ⚙️ Backend & Infrastructure

* **[Backend Guide](BACKEND_GUIDE.md)**: Deep dive into Node.js, Express, and AI service orchestration.
* **[Performance & Optimization](ARCHITECTURE.md#performance--optimization)**: Details on our 4-layer caching strategy and resource tracking.
* **[Mobile Optimization](MOBILE_OPTIMIZATION.md)**: How we scale high-fidelity visuals for mid-range smartphones.

---

## 🏗️ The Tech Stack at a Glance

* **AI Engine:** Groq (Llama 3.3, 3.2, Whisper)
* **Vector DB:** MongoDB Atlas ($vectorSearch)
* **Knowledge Graph:** Neo4j Aura (Conflict Rules)
* **Frontend:** React 19 + Vite + Framer Motion
* **Voice:** ElevenLabs TTS + Web Speech API
