# Frontend Documentation: Niti Setu

Niti Setu's frontend is a high-performance, responsive React application built with
Vite. It follows a **Glassmorphic Design System** for a premium, modern aesthetic.

## 🎨 Design System & UI Components

The UI is built using a custom "Glass" framework, utilizing **Tailwind CSS** and
**Framer Motion** for micro-interactions.

### Signature Components
*   **Krishi Mitra Assistant:** A persistent, floating AI assistant that handles
    voice interaction (STT/TTS).
*   **Aurora & Glass Cards:** High-transparency containers with backdrop-blur
    filters for a cohesive glass effect.
*   **Multilingual Dashboard:** Supports 6 regional languages with instant context
    switching via i18next logic.

## 🏗️ State Management & Data Flow

*   **Authentication:** Uses Google OAuth 2.0 via a customized secure callback
    flow.
*   **RAG Interface:** Communicates with the backend via axios with local
    caching (localStorage) for public eligibility checks.
*   **Audio Pipeline:** Integrates the **Web Speech API** for real-time dictation
    and **ElevenLabs** for neural speech synthesis.

## ⚡ Performance Optimizations

*   **Vite Execution:** Ultra-fast HMR and optimized production bundling.
*   **Local Caching:** Profiles and recent eligibility results are stored
    locally to reduce redundant API calls.
*   **Lazy Loading:** Dynamic imports for heavy analytics components (Recharts)
    to minimize initial bundle size.

---

## 📂 Directory Structure

*   `/src/components`: UI building blocks (GlassCard, CustomButton, etc.)
*   `/src/pages`: Main application views (Dashboard, EligibilityChecker, Auth)
*   `/src/services`: API interaction logic and voice processing
*   `/src/locales`: JSON-based translation files for regional support
