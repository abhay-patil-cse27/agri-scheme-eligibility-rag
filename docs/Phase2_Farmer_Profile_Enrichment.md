# Phase 2: Farmer Profile Context Enrichment

## Objective
The LLM evaluates a farmer's eligibility strictly based on the provided profile details explicitly checked against the retrieved document chunks. If crucial demographics (e.g., gender, poverty line status, tenancy) are missing, the LLM will fall back on "medium confidence" mode and frequently approve an ineligible farmer due to imperfect information. 

By adding six high-value fields to the user profile—derived from the most common exclusion criteria in Indian Government Schemes—we arm the RAG engine with the strict deterministic facts needed to properly accept or reject nuanced claims without guessing.

## Implementation Steps

### 1. Database Schema Update (`backend/src/models/FarmerProfile.js`)
We must store specific exclusion criteria permanently with the user's data.
*   **Action**: Append the following attributes to the main Mongoose Schema:
    *   `gender`: `String` Enum (`Male`, `Female`, `Other`)
    *   `hasBPLCard`: `Boolean` (Below Poverty Line indicator)
    *   `ownershipType`: `String` Enum (`Owner`, `Tenant/Sharecropper`, `Co-owner`)
    *   `hasKcc`: `Boolean` (Kisan Credit Card check)
    *   `isDifferentlyAbled`: `Boolean` (Divyangjan status)
    *   `hasAadharSeededBank`: `Boolean` (Essential for Direct Benefit Transfers)

### 2. Frontend Form Upgrades (`frontend/src/pages/`)
Any new user onboarding must securely capture these fields.
*   **Action (`Settings.jsx`)**: Add dynamic dropdowns for `Gender` and `Ownership Type`. Add clean, glassmorphic toggle switches or grouped radio buttons for the four boolean fields.
*   **Action (`Farmers.jsx`)**: Admin/Agent UI must be capable of directly editing these fields when managing rural farmers' profiles on their behalf.
*   **Action (`EligibilityCheck.jsx`)**: Update the public interface form to require or optionalize these inputs safely so that quick-checks via the public route work.

### 3. LLM Prompt Tuning (`backend/src/services/llmService.js`)
The language model prompt must be updated to explicitly evaluate these boolean/enum values when relevant scheme documents apply filters based on them.
*   **Action**: Modify `ELIGIBILITY_SYSTEM_PROMPT` to aggressively utilize `hasBPLCard`, restricting or permitting entry when documents mention BPL.
*   **Action**: Add strict fallback logic to verify the `ownershipType` (Owner vs. Tenant) when land ownership is highly regulated (e.g., PM-KISAN, heavily citing Section 3.1 excludes Tenants). 
*   **Action**: Check `isDifferentlyAbled` and `gender` for relaxed quotas or separate subsidies inside chunks.

### 4. Voice Processing / AI Extraction Update (`frontend/src/hooks/useVoice.js` & Backend)
The "Speak to Input" experience must intelligently detect these demographics through natural speech.
*   **Action**: Update the system prompt responsible for converting raw transcriptions into the structured JSON profile object. Specifically instruct it to map *"I rent the land"* to `ownershipType: Tenant`, and *"I have a BPL card"* to `hasBPLCard: true`. 
*   **Result**: The automated voice system will safely construct enriched profiles without any physical typing.
