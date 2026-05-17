# Niti Setu: Data Privacy & Security Policy

Niti Setu is committed to the highest standards of data protection, fully aligning with the **Digital Personal Data Protection (DPDP) Act, 2023** of India and the **IT Act 2000**.

## 1. Data Minimization & Collection

We collect only data strictly necessary for determining agricultural scheme eligibility.

- **Government IDs:** We **never** store Aadhaar numbers, PAN numbers, or identity document images.
- **Agri-Data:** We store land holding size (in Acres), state, crop types, and declared annual income strictly for eligibility evaluation.
- **Camera/Mic Data:** All hardware interactions are explicitly consent-gated and processed in-memory only.

## 2. Explicit Per-Click Consent (Hardware Interactions)

Before any camera or microphone access, a **Privacy & Data Sovereignty Consent Modal** is displayed — rendered via React Portal on `document.body` to ensure full-screen visibility. This consent is:

- **Transient:** Never written to `localStorage` or `sessionStorage`.
- **Per-Click:** Requested fresh on every single hardware interaction — you always know when AI is processing your data.
- **Granular:** Decline aborts the action completely. No data is collected.

## 3. Ephemeral Processing (Zero-Storage Policy)

Our Vision AI scanning engine uses a strict ephemeral binary stream protocol:

1. User triggers upload (Gallery, Live Camera, or Native Cam).
2. Dual-layer file validation (MIME type + extension) rejects any unsupported or spoofed files before they reach the server.
3. Accepted file is streamed to a secure temporary directory (`/tmp`).
4. Vision AI (Groq Llama 3.2) extracts only non-PII attributes (Name, State, Land Size, Age).
5. **File is immediately and permanently deleted** (`fs.unlink`) in the `finally` block — even if an error occurs.
6. No permanent copy of your identity document ever remains on our servers.

**Accepted Formats:** JPG, PNG, WebP, HEIC/HEIF, PDF — max 15 MB

## 4. Hardened File Security

Both the frontend (browser) and backend (server) enforce **dual-layer validation**:
- **MIME Type Check:** Must be in the approved allowlist.
- **File Extension Check:** Must be in the approved allowlist.
- **Cross-Group Check:** Extension and MIME type must belong to the same category (image vs. document). A `.pdf` file with `image/jpeg` MIME is rejected.

This prevents file-spoofing attacks (e.g., malware disguised as a document scan).

## 5. Transit & Authentication Security

- **Encryption:** All data transmitted over bank-grade **TLS/SSL (HTTPS)**.
- **JWT Authentication:** All private data access is gated by JSON Web Tokens with 30-day expiration.
- **Rate Limiting:** Protects against automated scrapers and brute-force attacks.
- **Audit Logging:** Admin actions (uploading/deleting schemes, user management) are logged for accountability.

## 6. WhatsApp Bridge Protocol

Our WhatsApp integration adheres to strict transient processing:

- **Voice Notes:** Downloaded to a transient memory buffer, transcribed via Groq Whisper-v3, and **instantly deleted**.
- **Zero-Storage Audio:** We **never** store raw audio files or voice recordings.
- **Linked Data:** Only the WhatsApp contact number is used to sync your Niti Setu profile — no other chat metadata is harvested.

## 7. AI Ethics & Transparency

- **No Hallucinations:** Our RAG engine is restricted to official government scheme documents only.
- **Verifiable Proof:** Every AI decision includes a direct verbatim quote and page reference from the official PDF.
- **Human-in-the-Loop:** AI helps identify eligible schemes, but final applications are processed exclusively on official `gov.in` portals.
- **No Third-Party RAG:** We use zero LangChain/LlamaIndex wrappers — no hidden telemetry or third-party data handlers in our AI pipeline.

## 8. Your Rights (DPDP Act, 2023)

- **Right to Erasure:** Delete your farmer profile and all associated eligibility history at any time from the "Settings" page.
- **Right to Access:** View all data stored about you in the "Settings" page.
- **Right to Correction:** Update your profile data directly through the dashboard.
- **Right to Withdraw Consent:** Simply decline the Privacy Modal — no hardware access, no data processing.

---

*For privacy concerns, contact: [abhay.patil214@gmail.com](mailto:abhay.patil214@gmail.com)*

