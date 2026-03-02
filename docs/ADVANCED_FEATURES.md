# Niti Setu: Advanced Features & "Industry-Grade" Enhancements

This guide documents the high-end features added during the Phase 3 optimization.

## 1. WhatsApp "Setu" (Bridge) 📱

A voice-note-centric gateway for farmers who prefer messaging apps over web browsers.


### Interaction Flow

```mermaid
sequenceDiagram
    participant F as Farmer
    participant T as Twilio Cloud
    participant W as WhatsAppService
    participant STT as Groq Whisper
    participant K as Krishi Mitra Engine
    
    F->>T: Sends Voice Note (.ogg)
    T->>W: POST /api/whatsapp/webhook (MediaURL)
    W->>T: Download file stream (secure auth)
    W->>STT: POST /v1/audio/transcriptions
    STT-->>W: Transcribed Marathi/Hindi text
    W->>K: chatWithKrishiMitra(text, profile)
    K-->>W: AI text reply (Dialect tuned)
    W->>T: POST /Messages (To: Farmer WhatsApp)
    T-->>F: Reply received as text
```

### Profile Linking
Users are identified by their WhatsApp contact number (linked in `FarmerProfile`). If no profile exists, the AI provides general guidance and encourages registration.

---

## 2. Offline-First (PWA) 📶

Enables native-like application behavior and resilience on poor networks.


### Service Worker Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Registering
    Registering --> Installing
    Installing --> Installed
    Installed --> Activating
    Activating --> Activated
    Activated --> Idle
    
    Idle --> Fetch: Intercept Request
    Fetch --> Cache: Resource in Cache?
    Cache --> [*]: Return Asset (Offline)
    Cache --> Network: Fetch from Server
    Network --> Cache: Update Cache
    Network --> [*]: Return Asset
```


### Caching Strategy

- **Core Assets:** Pre-cached on install (JS, CSS, localized images).
- **Google Fonts:** Cached via Workbox `CacheFirst` strategy.
- **Scheme Documents:** Cached via `NetworkFirst` to ensure farmers see valid PDFs even if disconnected temporarily.

---

## 3. Hyper-Local Dialect Tuning 🗣️

Adapts the AI's persona to sound like a "Local Brother" rather than a computer.

```mermaid
graph LR
    P[User Profile] -- "Sub-Region: Kolhapur" --> Prompt[Prompt Builder]
    Prompt -- "System Instruction" --> LLM[Llama 3.3]
    LLM -- "Greeting: Namaskar Dada!" --> User[Farmer]
    
    style LLM fill:#6366f1,color:white
```


### Translation Architecture

1. **Tier 1 (Literal):** Transcribing regional voice (Whisper).
2. **Tier 2 (Semantic):** LLM understands intent (Satbara, Loan, etc.).
3. **Tier 3 (Transcreation):** Converting robotic English into warm, local Marathi/Hindi "Agricultural Tone".

---

## 4. OCR Unit-Conversion Bridge 🔍

Ensures precise land extraction regardless of the document's regional unit.

```mermaid
graph TD
    UI[Unit Toggle: Hectares] -- "User Input" --> Form[scanDocument API]
    Form -- "landUnit: Hectares" --> API[Scan Route]
    API -- "Vision Prompt Injection" --> Groq[Groq 3.2 Vision]
    
    subgraph "AI Extraction Logic"
        Groq -- "Detect Value: 2.0" --> Calc{Conversion Needed?}
        Calc -- "Yes (Hectares)" --> Mult[Value * 2.47]
        Calc -- "No (Acres)" --> Final[Value]
    end
    
    Mult --> JSON[landHolding: 4.94 Acres]
    Final --> JSON
```
