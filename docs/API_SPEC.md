# Niti Setu: API Documentation (v1.0)

This document provides a comprehensive guide to the Niti Setu REST API.

## 🔐 Authentication

Most endpoints require a JWT Bearer token.
Header: `Authorization: Bearer <token>`

### Auth Endpoints
*   `POST /api/auth/register` - Create a new farmer account.
*   `POST /api/auth/login` - Authenticate and receive JWT.
*   `POST /api/auth/google` - Seamless Google OAuth login.
*   `GET /api/auth/me` - Get current user profile.
*   `POST /api/auth/forgotpassword` - Trigger password reset email.

---

## 🌾 Eligibility Engine (RAG)

The core of Niti Setu. Uses semantic search and LLM reasoning.

### Check Eligibility (Authenticated)
`POST /api/eligibility/check`
*   **Body:** `{ "profileId": "...", "schemeName": "...", "language": "hi" }`
*   **Result:** Detailed JSON with `eligible` (boolean), `reason`, `citation`, `benefitAmount`, and `requiredDocuments`.

### Public Check (Freemium)
`POST /api/eligibility/public-check`
*   **Body:** `{ "profileData": { "name": "...", "state": "...", ... }, "schemeName": "..." }`
*   **Note:** Does not save history to the database.

---

## 📷 Vision & Voice AI

Specialized endpoints for high-accessibility feature extraction.

### Document Scan (Vision AI)
`POST /api/scan/document`
*   **Body:** `Multipart/form-data` with `document` (Image) and `documentType`.
*   **Privacy:** Binary stream only. Zero permanent storage.

### Voice Transcription & Extraction
`POST /api/voice/transcribe`
*   **Body:** `Multipart/form-data` with `audio` (WebM/WAV) and `language`.
*   **Result:** Transcribed text + automatically extracted profile fields.

### Text-to-Speech (Multilingual)
`POST /api/voice/tts`
*   **Body:** `{ "text": "...", "language": "hi" }`
*   **Response:** MP3 Audio stream from ElevenLabs.

---

## 📁 Scheme Management

*   `GET /api/schemes` - List all active agricultural schemes.
*   `GET /api/schemes/:id` - Get deep details and chunk count for a scheme.
*   `POST /api/schemes/upload` (Admin Only) - Upload PDF and trigger RAG ingestion.

---

## 📊 Analytics & Health

*   `GET /api/analytics` - Dashboard statistics (Total checks, Success rates, Demographic splits).
*   `GET /api/analytics/system-health` - Cache hit rates and AI response latency.
*   `GET /api/graph/explorer` - Full Neo4j graph data for taxonomic visualization.

---

## 🗺️ Chat (Krishi Mitra)

*   `POST /api/chat` - Chat with the agricultural assistant.
*   **Body:** `{ "query": "...", "history": [...], "language": "mr" }`
