# Windows & Android Development Setup

This document describes setting up a Windows workstation for developing and testing Epsilon on Android (Android-first platform target).

---

## 1. Prerequisites

1. **Node.js**: Node 20+ LTS and npm 10+.
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
