# Frontend Documentation: Niti Setu

Niti Setu's frontend is a high-performance, responsive React application built with
Vite. It follows a **Glassmorphic Design System** for a premium, modern aesthetic.

## 🎨 Design System & UI Components

The UI is built using a custom "Glass" framework, utilizing **Tailwind CSS** and
**Framer Motion** combined with **React Bits** components for high-end micro-interactions
and complex animations.

* **Registration Wizard:** High-security 3-step verification flow featuring
  OTP entry, **Real-time Password Complexity Validation**, **Confirm Password Match Indicators**, and identity safeguards.
* **Identity Violation Alerts:** Prominent red toast notifications for unauthorized
  access attempts (e.g., password reset for non-existent accounts).
* **Dynamic Enrollment Opt-In:** An intelligent progressive disclosure UI ("Yes/No" toggle) that dynamically swaps colors based on the Light/Dark mode Tailwind variables (`var(--bg-glass)`, `var(--bg-primary)`) allowing bulk auto-selection of specific category schemes without overwhelming the user.
* **Google OAuth 2.0:** Secure, one-click login via a customized callback flow.

## 🏗️ State Management & Data Flow

* **Authentication:** Dual-flow support for secure OTP-based registration and
  Google OAuth 2.0 via a customized secure callback flow. Includes real-time matching
  engines for password confirmation.
* **Chat Sessions:** Persistent conversation state managed via session IDs,
  allowing users to resume previous interactions with Krishi Mitra.
* **RAG Interface:** Communicates with the backend via axios with local
  caching (localStorage) for public eligibility checks.
* **Audio Pipeline:** Integrates the **Web Speech API** for real-time dictation
  and **ElevenLabs** for neural speech synthesis.

## ⚡ Performance Optimizations

* **Vite Execution:** Ultra-fast HMR and optimized production bundling.
* **Local Caching:** Profiles and recent eligibility results are stored
  locally to reduce redundant API calls.
* **Lazy Loading:** Dynamic imports for heavy analytics components (Recharts)
  to minimize initial bundle size.

---

## 📂 Directory Structure

* `/src/components`: UI building blocks (GlassCard, CustomButton, etc.)
* `/src/pages`: Main application views (Dashboard, EligibilityChecker, Auth)
* `/src/services`: API interaction logic and voice processing
* `/src/locales`: JSON-based translation files for regional support
