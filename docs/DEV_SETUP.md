# Windows & Android Development Setup

This document describes setting up a Windows workstation for developing and testing Epsilon on Android (Android-first platform target).

---

## 1. Prerequisites

1. **Node.js**: Node 22.22.1 (or a compatible newer LTS) and npm 10+.
   React Native 0.88 requires Node 22.13+; locked lint-staged requires 22.22.1+.
   Install the committed dependencies with `npm ci`; do not regenerate the lockfile.
   Git uses LF line endings via `.gitattributes`, including on Windows.
2. **Git**: Installed with Windows Credential Manager.
3. **Java Development Kit**: JDK 17 (Eclipse Temurin 17 or Azul Zulu 17).
   - Set environment variable `JAVA_HOME` to your JDK installation path (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17...`).
   - Add `%JAVA_HOME%\bin` to your system `PATH`.
4. **Android Studio**: Install current stable Android Studio.
   - In Android Studio SDK Manager, install:
     - Android SDK Platform (API 34 or 35).
     - Android SDK Build-Tools.
     - Android SDK Platform-Tools.
     - Android Emulator.
   - Set environment variable `ANDROID_HOME` (typically `%LOCALAPPDATA%\Android\Sdk`).
   - Add to `PATH`:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\emulator`

---

### Recovered laptop runtime (2026-10-31)

This laptop's global Node is older than the locked toolchain. A portable Node
22.22.1 with npm 10.9.3 is installed outside the repository. In a new PowerShell:

```powershell
$env:Path = "$env:LOCALAPPDATA\EpsilonTools\package\bin;$env:Path"
node --version
npm --version
```

Then use `npm ci`, `npm run check` and the Expo commands below normally. On another
laptop, install Node 22.22.1+ normally rather than copying this machine's runtime.
STEP 01 adds native SVG/haptics: rebuild the dev client before opening the gallery.

## 2. Android Virtual Device (Emulator) Setup

1. Open Android Studio -> **Virtual Device Manager**.
2. Click **Create device**.
3. Select a phone hardware profile (e.g. **Pixel 8** or **Pixel 7**).
4. Select a system image with **Google Play** enabled (API 34/35). A Google Play image is required for testing Google Sign-in and Google Play services.
5. In Windows, ensure **Windows Hypervisor Platform** or hardware virtualization (VT-x / AMD-V) is enabled in BIOS.
6. Start the virtual device. Verify via PowerShell:
   ```powershell
   adb devices
   ```

---

## 3. Physical Device Setup (USB Debugging)

1. On your Android device, go to **Settings > About phone**.
2. Tap **Build number** 7 times until developer mode is unlocked.
3. Navigate to **Settings > System > Developer options**.
4. Enable **USB debugging**.
5. Connect your device via USB cable, accept the computer fingerprint prompt on the phone screen.
6. Verify detection:
   ```powershell
   adb devices
   ```

---

## 4. Building the Dev Client (`expo-dev-client`)

Epsilon uses custom native modules (`expo-camera`, `expo-secure-store`, `expo-build-properties`) and requires a custom dev client build instead of standard Expo Go.

### Option A: Cloud EAS Build (Recommended)

Run:

```powershell
npx eas build --profile development --platform android
```

- Download the generated APK link upon completion.
- Install the APK on your emulator or connected device:
  ```powershell
  adb install <path-to-downloaded-build>.apk
  ```

### Option B: Local Android Build

If full Android build tools and CMake are installed locally:

```powershell
npx expo run:android
```

---

## 5. Running the Development Server

1. Ensure the emulator is running or device is connected.
2. Start the Metro bundler in dev-client mode:
   ```powershell
   npx expo start --dev-client
   ```
3. Open the **Epsilon** application icon on your phone/emulator.
4. The dev client will automatically discover and load the local Metro development server.

---

## 6. How and When to Rebuild the Dev Client

### When to rebuild:

- Whenever a native package or version changes in `package.json` (e.g. adding camera, Google sign-in SDK, haptics).
- When native configuration in `app.config.ts` or plugins changes (e.g. Android permissions, edge-to-edge layout, build properties).

### When rebuilding is NOT needed:

- Standard feature development, UI changes, screen layouts, hooks, API services, and tests run inside Metro and update immediately via Fast Refresh without native recompilation.

### Rebuild procedure:

1. Run `npx eas build --profile development --platform android`.
2. Uninstall the previous dev client version or install over it:
   ```powershell
   adb install -r <path-to-new-build>.apk
   ```
3. Restart Metro: `npx expo start --dev-client --clear`.

## Google sign-in and onboarding (STEP 08-10)

Google uses `@react-native-google-signin/google-signin`'s **original native SDK**.
There is no browser OAuth flow, app-managed authorization-code callback or
additional redirect scheme. The existing browser module remains for legal links.
Apple and web sign-in are outside this Android batch.

Before enabling Google, the owner must configure Google Cloud:

1. OAuth consent: Epsilon name, support email and privacy URL; only
   `openid`, `email`, `profile`; publish the consent configuration for production.
2. Create a **Web OAuth client**. Its public ID is
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, also used as the backend token audience.
3. Create **Android OAuth clients** for the actual package (`com.epsilonup.app`
   unless configured otherwise) and each SHA-1: local debug key if used, EAS
   development/preview/production keys, and Google Play App Signing key later.
   Obtain EAS key fingerprints through `eas credentials`; never commit key files.
   Incorrect SHA-1/package/client configuration causes DEVELOPER_ERROR.
4. Set `ENABLE_GOOGLE_SIGNIN=true` with the public web client ID in the intended
   EAS environment, and rebuild. Keep it false until Cloud/backend configuration
   is ready. Do not put provider secrets in the app.

Android autolinks the native SDK without Firebase or `google-services.json`.
The local Expo plugin validates enabled configuration and declares package
visibility only for Play Services. It adds no account/contact/SMS permissions.
The upstream non-Firebase plugin configures an iOS URL scheme; that setup is
deferred until a real iOS OAuth client exists. No placeholder iOS scheme is used.
The SDK configures once, after the first frame, only when enabled with a client
ID. A missing native module produces a recoverable sign-in error, never a fake
successful account. Native Google sign-out participates in auth cleanup.

**Rebuild the Android development client** for Google sign-in, the native date
picker, and the previously added browser module. The existing dev-client APK
does not gain new native modules from a JavaScript update. This session did not
build/install an APK or access Google Cloud credentials.

**MANUAL DEVICE QA PENDING:** real Google sign-in/cancel/use-another-account;
new account profile then phone link; underage rejection; phone already linked
sheet/support; optional skip/reminder; kill/relaunch at each onboarding stage;
SMS autofill/resend; small Android keyboard, TalkBack and 1.3x font scale.
The environment has no available adb/Android SDK, so these are not claimed passed.

Profile updates accept the canonical `{user, nextStep}` response, validating both
fields at the HTTP boundary. Existing APIs returning only `User` are supported
explicitly: routing uses that server user plus `/config` through the established
bootstrap resolver. No cashback or eligibility is computed by this fallback.
Age/date validation uses the HTTP Date-adjusted display clock and server minimum
age; the backend's AGE_RESTRICTED response remains authoritative. No draft profile,
phone challenge or OTP is persisted. Relaunch fetches user/config to resume profile
or phone verification; a lost in-memory SMS challenge resumes at phone entry.

## Home and Restaurants (STEP 11-12)

Rebuild the dev client for the new `expo-image` native module. FlashList 2.3.2
uses the existing New Architecture; both packages are exactly pinned to the
SDK-compatible versions. An Android JavaScript export does not replace this
native rebuild or verify native APK size/performance.

**MANUAL DEVICE QA PENDING:** pull-to-refresh, stale foreground/offline data,
Home count-up/Reduce Motion, TalkBack money/status announcements, 1.3x font
scaling, restaurant title collapse, keyboard/search/clear, long-list pagination
and logo recycling/fallback. Validate the real backend's empty restaurant response
and search/cursor semantics. Rows intentionally have no detail action.

Development mocks are explicitly labeled and use demo restaurant names with no
real partner logos. Production continues to use validated live service responses.
The Scan action now opens the verified-purchase flow described below.

## Verified-purchase feedback (STEP 13-16)

Rebuild the Android dev client for the approved AsyncStorage 2.2.0 native module.
Feedback payloads and stable retry keys live in a bounded, account-scoped local
outbox; tokens remain in SecureStore. Logout removes all feedback outbox keys.
The queue retries on startup, login, foreground and reconnect. It never computes
cashback or changes wallet values locally.

In development mock mode, manual code `DEMO-PURCHASE-01` resolves the explicitly
labeled demo receipt. This is a walkthrough value, not a production token format.
Use the existing dev scenario menu for unsupported/not-found/expired/claimed,
network/validation/duplicate feedback and confirmed (Success), pending or no
cashback. Select a reward scenario before rating the next unreviewed demo dish;
relaunch resets the in-memory mock server. Mock wallet values are fixtures.
Production always uses the validated live service and real server-issued references.

**MANUAL CAMERA/DEVICE QA PENDING:** verify permission explanation and Settings
recovery (including revocation), camera visible within ~400ms, torch, first-frame
locking, background/focus cancellation and manual entry. Verify long item names,
server prices, keyboard/scrolling, TalkBack star/reason/status announcements,
1.3x fonts and Reduce Motion. Submit in airplane mode, kill, reconnect/reopen and
verify the original key is replayed once against an idempotent backend. Confirm
all three reward variants and receipt/home/hardware Back without stale sheets.
This PC has no adb/Android SDK; JavaScript export does not verify native behavior,
APK size, cold-start timing or the deployed backend's financial integrity.
