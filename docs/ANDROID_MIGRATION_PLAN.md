# Niti-Setu Android Migration Plan (Capacitor)

This document outlines the high-efficiency strategy for wrapping the existing React/Vite web application into a native Android APK using **Ionic Capacitor**. Because the frontend already utilizes a responsive Tailwind/Glassmorphic UI and native HTML5 Media APIs, this approach allows for 100% code reuse with minimal time overhead.

## 🌟 Core Philosophy: Single Codebase, Dual Output
It is critical to understand that **Capacitor is an additive, non-destructive layer.** 
- **The Web App remains 100% intact:** Your standard web deployment (e.g., Vercel) continues to host the `dist` folder exactly as it always has.
- **The Android App:** Takes that *exact same* `dist` folder, wraps it in a native Android WebView container, and outputs a Play Store-ready `.apk`.
- **The Benefit:** You write code once in React. The Web App gets the feature immediately, and a quick `npx cap sync android` passes that exact same feature to the mobile app.

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

## Phase 5: Build Pipeline & Execution (Completed ✅)
**Goal:** Compile the app into an `.apk` file.

We have configured two distinct ways to build the Android application, catering to both local developers and non-technical stakeholders.

### Option A: Cloud Build via GitHub Actions (Zero Setup)
We have implemented a CI/CD pipeline (`.github/workflows/android-build.yml`) that automatically compiles the Android app in the cloud.
1. Navigate to the **Actions** tab in the GitHub repository.
2. Select **"Build Android APK (Capacitor)"**.
3. (Optional) Click **Run workflow** to manually trigger a fresh build.
4. Once the build finishes (✅), scroll to the **Artifacts** section and download `NitiSetu-Android-Debug-APK`.
5. Extract the `.zip` and transfer the `.apk` to any Android device.

### Option B: Local Compile via Gradle (Requires JDK & Android SDK)
For developers with local toolchains:
1. Navigate to the native directory: `cd frontend/android`
2. Run the Gradle build: `./gradlew assembleDebug`
3. The APK will be generated at: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

*(Note: Developers can still run `npx cap open android` in the `frontend` folder to launch the project directly in Android Studio).*
