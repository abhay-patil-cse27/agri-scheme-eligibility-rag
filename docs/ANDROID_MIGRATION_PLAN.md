# Niti-Setu Android Migration Plan (Capacitor)

This document outlines the high-efficiency strategy for wrapping the existing React/Vite web application into a native Android APK using **Ionic Capacitor**. Because the frontend already utilizes a responsive Tailwind/Glassmorphic UI and native HTML5 Media APIs, this approach allows for 100% code reuse with minimal time overhead.

## Phase 1: Installation & Initialization
**Goal:** Setup Capacitor in the frontend repository and generate the native Android project structure.

1. **Install Core Packages:**
   ```bash
   cd frontend
   npm install @capacitor/core
   npm install -D @capacitor/cli
   ```
2. **Initialize Configuration:**
   ```bash
   npx cap init "Niti Setu" com.nitisetu.app --web-dir dist
   ```
   *This creates `capacitor.config.json` targeting the Vite `dist` output.*
3. **Add Android Platform:**
   ```bash
   npm install @capacitor/android
   npx cap add android
   ```

## Phase 2: Native Hardware Permissions
**Goal:** Grant the Android application OS-level permissions required for the WebRTC scanner and Voice Assistant to function inside the WebView.

1. Open `frontend/android/app/src/main/AndroidManifest.xml`.
2. Inject the following permissions directly above the `<application>` tag:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
   ```

## Phase 3: API Routing & Tunneling Fixes
**Goal:** Prevent the app from calling `localhost` from within the phone, which would cause network failures.

1. In the Web App, `/api` is routed to `localhost:3000` via the Vite proxy.
2. In the Android App, the Axios base URL must dynamically target the live cloud backend or an active secure tunnel (e.g., Cloudflare/Localtunnel).
3. **Action:** Update `frontend/src/services/api.js` to rely exclusively on `import.meta.env.VITE_API_BASE_URL` rather than relative paths (`/api/auth/me`).

## Phase 4: Plugin Enhancements (Optional Fallbacks)
**Goal:** Ensure hardware compatibility across all Android devices.

1. **WebRTC Check:** Modern WebViews natively support `getUserMedia()`. The `DocumentScanner.jsx` will be tested natively first.
2. **Native Camera Fallback:** If autofocus is poor on low-end devices, install `@capacitor/camera` to invoke the native OS camera interface.
3. **App Icons & Splash Screen:** Use `@capacitor/assets` to automatically generate all required Android `res` folder icon sizes from a single source image.

## Phase 5: Build Pipeline & Execution
**Goal:** Compile the app and launch it on a device/emulator.

1. **Build Web Assets:** `npm run build`
2. **Sync Native Code:** `npx cap sync android`
3. **Launch IDE:** `npx cap open android`
   *This opens Android Studio where the developer can press "Run" to deploy the APK to a physical device or emulator.*

---

**Estimated Time to Completion:** 1 - 2 Days
**Code Rewrite Required:** 0% (UI is fully retained)
