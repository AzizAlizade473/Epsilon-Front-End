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

## Wallet and Profile (STEP 17-20)

Rebuild the Android dev client for expo-clipboard 58.0.4 and expo-notifications
58.1.7. CAMERA and POST_NOTIFICATIONS are the only requested feature permissions;
unused boot/exact-alarm permissions are blocked. Verify the merged manifest on a
native build; JavaScript export does not prove manifest or device behavior.

Notification setup needs the real EAS project ID and Android push credentials.
No credential or project identifier is fabricated. The client defers the SDK to
Notifications, asks OS permission only after opt-in/explanation, creates one
`cashback-updates` channel and sends the Expo push token in authenticated
`POST /devices`. Missing configuration and failed registration show an error;
preferences are not falsely marked saved. Backend logout/deletion must unlink
account/device associations and all push payloads must exclude sensitive data.
STEP 21 notification routing/foreground UX is deliberately not implemented.

Live backend contracts to verify (not claimed deployed):

- `GET/PATCH/DELETE /me`: validated User/profile envelope; optional User
  `deletionWarning`; DELETE requires backend-enforced recent authentication.
  The client accepts a schema-valid empty 204 deletion response.
- `GET /feedback`: cursor pages of review records with `feedbackId`,
  `dishName`, `restaurantName`, `rating`, nullable `comment`, `createdAt`.
  Reward mutation results cannot supply review content and fail validation here.
- `GET/PUT /me/notification-settings`: `cashbackUpdates` and `partnerUpdates`
  booleans; PUT must return the saved settings. Device registration uses the
  existing `{token}` POST body. No fake local server-write success.

**MANUAL DEVICE QA PENDING:** test pull-to-refresh, signed statuses, cached-detail
refresh/copy and TalkBack label/value order; select the development long-history
scenario for the 1000-row/60fps check. Test profile name-save failures, all language
choices/relaunch, notifications denied/granted/revoked in Settings, crash-consent
persistence and account switches. Test deletion warnings, wrong Google account,
fresh OTP/Google, typed confirmation, backend rejection and successful cleanup.
Verify real backend rewards/ledger/retention and push association removal.

Crash reporting is implemented in STEP 23 as opt-in, scrubbed JavaScript error
reporting. Consent remains account-scoped and is cleared on logout/deletion.
The profile avatar uses a text epsilon placeholder while production branding
assets remain pending. No postponed logo/splash motion was added.

## STEP 21–23 verification and crash configuration

See `ANDROID_AUDIT.md` and `PERF_REPORT.md` for source/test results and explicit
native/device/startup checks still NOT VERIFIED. Rebuild the native client after
adding Sentry and changing icon/splash plugins. Use `npm run export:android --
--output-dir dist/preview --max-workers 2` for the release compiler settings;
preview/production EAS profiles use the same experimental Expo optimizer flags.

Sentry is pinned to Expo SDK 58's supported **8.28.0**, correcting the initially
approved 8.33.0 after the compatibility check. The SDK is MIT. The owner approved
an explicit DEP-1 build-tool license exception for transitive Sentry CLIs under
FSL-1.1-MIT (installed versions 3.8.0 and 2.58.6; initial 8.33.0 used 3.8.2).
No source-map upload has been run locally.

Set the public `EXPO_PUBLIC_SENTRY_DSN` only for the intended project. Empty DSN
disables reporting. Development also requires `ENABLE_CRASH_REPORTING_DEV=true`;
account consent is always required. SDK import starts after the first frame.
Only allowlisted error type, normalized bundle frames/debug IDs and release,
dist, environment and app-version metadata survive the scrubber. Messages,
user data, requests, breadcrumbs and arbitrary payloads are discarded. Native
fatal crashes/caching are disabled because they bypass the JavaScript consent
and scrubber boundary. Tracing, replay, profiling and screenshots are disabled.

Configure **private** `SENTRY_AUTH_TOKEN` in CI/EAS secrets, with `SENTRY_ORG` and
`SENTRY_PROJECT` build variables. Never use an EXPO_PUBLIC upload token. The Expo
plugin handles native-build source maps only in CI/EAS when configured. The
manual `Upload crash source maps` workflow requires owner-provided secrets and
public production configuration, exports maps using the release compiler and
runs the guarded `npm run crash:sourcemaps -- dist/sentry` command. Do not upload
an unrelated export as proof that an installed release is symbolicated.

Owner must update the hosted privacy policy before enabling production reports,
confirm vendor retention/access settings, build preview, opt in, trigger a test
JavaScript error and verify symbolication and payloads in the actual dashboard.
Then opt out and verify no further events; measure low-end cold starts before
and after. No real event, upload, dashboard verification or device result is
claimed from this PC. Opt-out disables the client immediately but cannot unsend
an already permitted in-flight request.

## STEP 24–25 quality and CI

`npm run check` now enforces coverage for services, lib and state machines,
production-profile checks, exact production licenses/approved exceptions,
lockfile registry integrity, Android configuration and workflow security checks,
as well as lint, strict types, Jest, i18n and formatting. `npm run secrets:check`
uses checksum-pinned MIT gitleaks 8.30.1 against all fetched history with full
redaction; `npm run secrets:check -- --staged` checks pending staged changes.
CI separately runs the production high/critical vulnerability gate and Expo
compatibility check. Known low/moderate advisories remain documented; do not
force an incompatible Expo downgrade to eliminate their count.

The owner approved eas-cli 27.2.0 (MIT) as an ephemeral CI-only tool, plus exact
existing lockfile license exceptions. `scripts/license-exceptions.json` records
individual paths, versions and licenses. Sentry's FSL-1.1-MIT CLI/platform binaries
remain a separate approved build-tool exception. Existing exceptions include
BlueOak-1.0.0, Python-2.0, Unlicense, CC0-1.0, CC-BY-4.0 browser data and MPL-2.0
Lightning CSS tooling; none are represented as MIT. Any changed or new disallowed
license fails the gate. OR expressions pass only with an allowed alternative.
The app has no new npm dependency from STEP 24–25.

PR CI uses read-only permissions, credential-free fixture Android exports and
immutable action SHAs. Bundle comparison uses the recorded no-map Hermes
baseline in `docs/bundle-baseline.json`, not the smaller source-map export.
Only the numeric report is uploaded, with seven-day retention; no bundles,
source maps, env dumps or signing files are artifacts. A separate workflow_run
commenter has PR-comment permission and no checkout/PR-code execution. It accepts
one bounded numeric artifact from that run and checks the originating PR SHA.
It becomes active after its workflow reaches the default branch; no test PR or
remote run is implied by local workflow/YAML validation.

Owner repository setup: protect `main` with PR review and required **Quality and
supply chain** and **Android export and bundle budget** checks; disallow force
pushes/deletions and bypasses. Keep signing credentials backed up securely and
access limited. Store secrets only in GitHub protected environments/EAS, never
in git or EXPO_PUBLIC variables. Protect environments `eas-development`,
`eas-preview`, `eas-production` and `sentry` with main-only deployment branches
and appropriate required reviewers. Configure the EXPO_TOKEN secret only there.
These server settings have NOT been changed from this PC.

Manual EAS build accepts only development/preview/production from reviewed main,
uses --freeze-credentials and never submits to a store. Owner must link the real
EAS project and provide existing signing/build settings. Production explicitly
uses the production environment/channel and live mode; the post-install EAS hook
validates the actual API environment with the app's shared SEC-9 URL validator.
The PR profile guard validates configured values; it does not claim unknown EAS
server variables are safe. Missing real production API configuration fails the
build-time guard. No backend domain or project ID is fabricated.

Manual OTA is restricted to **preview** and requires explicit native-compatibility
attestation. It fails closed until expo-updates and the real project/update URL
have been configured in a separately approved native build; that package is not
currently installed. No deployment or native package addition is performed just
to test this workflow. Existing `runtimeVersion: { policy: 'appVersion' }` means
all native changes require a new app version and rebuilt installed binary.
**Never ship an OTA requiring a new native module or native configuration.**
JS-only preview updates must target the installed runtime; production OTA/store
release remains outside this batch (STEP 29 gate).

Maestro setup and the five authored mock journeys are in `.maestro/README.md`.
Device execution, offline dev-client startup, accessibility, native manifests,
cold starts, backend/Google/push integration and live Sentry ingestion remain
NOT VERIFIED. `QA_CHECKLIST.md` maps critical scenarios to automated evidence
and pending backend/device responsibilities. No customer-facing layout changed;
Epsilon + Unslop remains the standing design requirement.

## STEP 26–27 backend and legal handoff

The backend handoff is `API_CONTRACT.md`, generated `openapi.yaml` and
`BUSINESS_RULES.md`. Run `npm run contract:generate` after intentional schema/
operation changes, review the result, then `npm run contract:check` (included in
`npm run check`). It compares actual Zod schemas and HTTP-adapter path inventory;
backend business/authorization/ledger enforcement still requires staging proof.
Canonical phone linking uses `/me/phone/otp/request` and `/me/phone/otp/verify`.
Errors prefer the canonical nested envelope; flat legacy errors remain decoded,
and unknown/client-only response codes safely fall back by HTTP status.

`LEGAL_TODO.md` is the single owner/legal input checklist. `DATA_INVENTORY.md`,
`PRIVACY_POLICY_DRAFT.md`, `TERMS_DRAFT.md`, `REWARDS_TERMS_DRAFT.md`,
`INCIDENT_RESPONSE.md` and `STORE_READINESS.md` are review inputs, not approved
legal texts, hosted resources, store submissions or backend acceptance. Do not
publish drafts or configure example URLs as if ownership/content were verified.
Privacy/Terms URLs must be configured HTTPS resources without credentials/query/
fragment; missing or invalid configuration fails validation rather than opening
an unsafe fallback. Existing browser-failure handling remains localized.

Owner must review the inventory, resolve the six business decisions, send the
handoff to the backend teammate, obtain legal/translation approval, host verified
legal/deletion resources and prove recentAuth/deletion/retention in staging.
Review credentials/fixed OTP/demo purchase values belong only in restricted
store-review configuration, never this repository. No live credentials, provider
configuration, publishing or external messages were used for this handoff.
Existing Android/native/device/cold-start/Google/push/Sentry/OTA prerequisites
remain unchanged; STEP 28–29 optimization/release work is not started here.
