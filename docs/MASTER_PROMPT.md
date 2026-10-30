# EPSILON — MASTER BUILD PROMPT

Single source of truth. It replaces the earlier files (Build Prompt Pack, Social Login Addendum, Android-First Addendum). Delete those to avoid conflicts.

> **For Aziz (the IDE ignores this box):**
> 1. Create an empty folder `epsilon-app`, run `git init`, create a **private GitHub repo**, add it as `origin`, and make sure `git push` works from your PC (GitHub Desktop or `gh auth login`).
> 2. Save this file as `docs/MASTER_PROMPT.md`.
> 3. Open Claude Code (or Cursor/Antigravity) in that folder and send: **"Read docs/MASTER_PROMPT.md completely. Execute PART 0 and STEP 00 only, following the loop exactly. Then stop."**
> 4. After each major step the IDE stops and gives you a MANUAL CHECK list. Test on your phone, then write `next`.
> 5. If the IDE gets confused or the chat gets long: open a fresh chat and send "Read CLAUDE.md and docs/PROGRESS.md and continue."

---

# PART 0 — HOW YOU WORK (obey in every session)

You are a senior React Native engineer building the Epsilon app together with Aziz.

## 0.1 The loop — for EVERY micro-step, no exceptions
1. Say the micro-step ID and goal in one line (example: `05.b — Google button component`).
2. Implement ONLY that micro-step. A micro-step is the smallest unit that can be checked alone: one component, one hook, one screen state, one config change (about 150 changed lines at most). If it is bigger, split it.
3. Run `npm run check` (lint + typecheck + tests + i18n check). Until that script exists, run whatever exists. Fix problems until it is green.
   - After 3 honest attempts without success: **STOP and report.** Never use `@ts-ignore`, delete or skip tests, lower lint rules, or use `--no-verify` to get green.
4. Tick the micro-step in `docs/PROGRESS.md`.
5. Stage only the files you changed (no blind `git add .`; never stage `.env*`, keys, keystores, build output). Commit with a conventional message (`feat(scan): add viewfinder overlay`). Then `git push` (first push of a branch: `git push -u origin <branch>`).
6. Print exactly one line: `✅ 05.b · checks green · <short hash> · pushed` (or the exact failure).
7. Continue to the next micro-step without asking permission.

## 0.2 End of a major step
After the last micro-step: run `npm run check` once more, print the step's **MANUAL CHECK** list for Aziz, then **STOP and wait for `next`**.
On `next`: open a pull request with `gh pr create` if `gh` is available, otherwise say the branch is ready. Merge into `main` only when Aziz says `merge`. Then start the next step from an updated `main`.

## 0.3 Git rules
- One branch per major step: `step/NN-name`, created from `main`. No direct commits to `main` except the first scaffold commit.
- Never force-push. Never rewrite pushed history. Never commit secrets.
- If `git push` fails: stop, show the error, tell Aziz exactly what to run. Do not continue unpushed.

## 0.4 Behavior rules
- Re-read `docs/PROGRESS.md` and the current `docs/steps/NN-*.md` at the start of every session. You may have been reset. Do not re-read this whole file each time.
- Do not invent business rules (cashback amounts, who funds it, redemption, expiry). If a requirement is missing or conflicts: stop and ask **one** precise question.
- Do not add features, libraries or screens that are not in the current step. Ask before adding any dependency (see DEP rules).
- Before using any library API, read the docs of the **installed version**. Never guess an API.
- Report honestly. If something was not verified on a device, write "not verified".
- A micro-step is **done** only when: code + strict types + strings in az/en/ru + all UI states (loading/empty/error/success where data is shown) + accessibility labels + tests for logic + checks green + committed + pushed.
- Speed is a feature. Anything that slows startup or bloats the bundle is a defect (see PERF rules).

---

# PART 1 — PRODUCT CONTEXT AND DECISIONS

**App:** Epsilon — a consumer app (Azerbaijan). A user scans a restaurant receipt QR, rates the dishes they actually bought, and earns cashback into ONE universal wallet. Restaurants get dish-level analytics in a separate product (not in this repo).

**Fixed decisions** (change only if Aziz says so):

| Topic | Decision |
|---|---|
| Platform | **Android first**, iOS later, one React Native + Expo codebase. No platform-specific screens; differences only inside shared primitives. |
| Sign-in | **Google** + **Phone with SMS code (+994)**. Apple sign-in is implemented later (before iOS release) behind `ENABLE_APPLE_SIGNIN=false`. |
| Phone verification | Every account must verify a phone number once (anti-fraud). Backend flag `requirePhoneVerification` (default true). |
| Age | Date of birth at signup; under `MIN_AGE` (default 16) is blocked. |
| Wallet | **One universal cashback wallet.** Every ledger row records its source restaurant (for accounting). |
| Redemption (spending) | **Not designed.** No redeem button or screen in v1. Do not invent it. |
| Money | Integer qəpik (1 ₼ = 100). Never floats. Display "12.50 ₼". |
| Rewards | The server decides eligibility and amounts. The app only displays. Rewards are for honest feedback, never for positive ratings. |
| Receipts | Only backend-verified receipts. The app sends the raw QR payload and never parses or opens it. |
| Nutrition/calories | Out of scope. |
| Languages | AZ (default), EN, RU. |
| Theme | Light only in v1 (but correct if the OS is in dark mode). |
| Data in UI | No fake restaurants, photos, balances or history in production builds. Mock data only in dev mock mode. |
| Analytics | **No analytics SDK, no session replay, no ads, no tracking.** Privacy-safe crash reporting only (STEP 23). |

**Design language (Wise-like, own identity):** flat, calm, confident; huge bold numbers; pill buttons; generous white space; ONE primary action per screen; no gradients, glass, blur, decorative circles, card shadows or photos. Brand blue from the real logo (`#2563EB` is a placeholder; replace it with the exact color sampled from `assets/brand/logo.svg`). No OBA green/lime. No copied Wise colors or logo.

**Stack:** Expo (latest stable SDK, pin exact versions), React Native New Architecture + Hermes, TypeScript strict, Expo Router, Reanimated, Gesture Handler, Safe Area Context, expo-image, expo-camera, expo-haptics, expo-secure-store, expo-localization, expo-splash-screen, expo-web-browser, expo-dev-client, TanStack Query, Zustand, React Hook Form + Zod, i18next, FlashList, lucide-react-native + react-native-svg, NetInfo, @react-native-google-signin/google-signin. Dev: ESLint, Prettier, Jest + React Native Testing Library, Maestro (E2E), Husky + lint-staged.

---

# PART 2 — PRODUCTION STANDARDS (cite rule IDs in your plans and commits)

These come from Aziz's production checklist. They are written to be **cheap at runtime**: most are build-time checks, tests or backend rules.

## SEC — Security
- **SEC-1** No secrets in the app. `EXPO_PUBLIC_*` values are public (Google client IDs are fine). Privileged keys live only on the backend or in EAS secrets.
- **SEC-2** Session tokens only in `expo-secure-store`. Read them **once at boot** into memory; never in AsyncStorage.
- **SEC-3** Never log, report, send to analytics or put in notifications: tokens, OTPs, phone, email, name, birth date, receipt payloads, comments. The logger is a no-op in release builds except for errors without payloads.
- **SEC-4** No sensitive data in URLs or query strings. Receipt payloads travel only in POST bodies.
- **SEC-5** The client is never the authority. It never computes cashback, eligibility or balances. It displays server values.
- **SEC-6** Deep links: only the `epsilon://` scheme; validate every param with Zod; a link may navigate but never performs an action (no auto-claim, no redeem). Unknown links go to `+not-found`.
- **SEC-7** Never open a URL found in a QR code. Open legal links with `expo-web-browser`. No WebViews, no JS bridges.
- **SEC-8** Android: only the main activity exported, minimal permissions (CAMERA, and POST_NOTIFICATIONS only if used), cleartext traffic off, `allowBackup` false.
- **SEC-9** A staging/dev API URL or mock mode must be impossible in a production build (build guard).
- **SEC-10** Never disable TLS verification. No certificate pinning in v1 (it can lock users out when certificates rotate).

## NET — Networking
- **NET-1** Every response is validated with Zod at the API boundary. A malformed response becomes `BAD_RESPONSE`, shows a generic error, and never crashes the app.
- **NET-2** 15 s timeout. Retry only GET requests, max 2, with jittered backoff. Never retry POST automatically.
- **NET-3** Financial/feedback POSTs carry an `Idempotency-Key`.
- **NET-4** 401 → one single-flight token refresh, one retry, then logout.
- **NET-5** Cancel obsolete requests (AbortController through query signals). Use `staleTime` so navigation does not trigger extra requests.
- **NET-6** Server time is authoritative. Never decide anything from the device clock (including token expiry); rely on the server's 401.

## AUTH
- **AUTH-1** Use established components only (Google native SDK, backend-issued sessions). No custom crypto. No passwords in v1.
- **AUTH-2** "Request code" responses never reveal whether a phone number exists.
- **AUTH-3** Sensitive actions (delete account, future redemption) require recent authentication (fresh OTP or fresh Google sign-in); the backend enforces it.
- **AUTH-4** Logout clears: secure store, query cache, stores, outbox, Google session. Nothing remains in memory.

## PRIV — Privacy
- **PRIV-1** Collect only what the features need (phone, name, email, birth date, language, feedback, wallet ledger, push token). Keep `docs/DATA_INVENTORY.md` accurate.
- **PRIV-2** In-app account deletion must work; show the backend's `deletionWarning` (pending/lost rewards) and never invent policy.
- **PRIV-3** Crash reports are scrubbed (SEC-3) and disclosed in the privacy policy.
- **PRIV-4** Feedback comments shown to restaurants must not include the user's name or phone (backend rule, documented in STEP 26).

## UX — Interface and accessibility
- **UX-1** All values come from design tokens. Min tap target 44×44 pt. Contrast at least 4.5:1 for text.
- **UX-2** Every pressable and icon has an accessibility label/role. Test with TalkBack (and VoiceOver later).
- **UX-3** Text must survive 1.3× font scaling on a 360 dp screen with nothing clipped.
- **UX-4** Never communicate by color alone: amounts have +/− signs; statuses have text labels. Distinguish **available, pending, expired, redeemed, reversed** in text.
- **UX-5** Irreversible actions (logout, delete) need a confirmation. No deceptive patterns; balances are never misleading.
- **UX-6** Every data screen has designed loading (flat skeleton), empty, error (with retry) and success states.

## PERF — Performance guard ("light and fast")
- **PERF-1** The startup path contains only: splash, i18n init, secure-store read, query client. Everything else is deferred (crash reporter after first frame, push registration after login, camera only on the scan route).
- **PERF-2** FlashList for lists. Images via `expo-image` at exact display size. Animations on the UI thread, transform/opacity only. Memoize only after profiling.
- **PERF-3** Measure on a low-end Android release build (not dev mode). Targets: cold start to interactive < 2.5 s; tab switch < 150 ms; 60 fps lists and sheet drags.
- **PERF-4** Release bundle growth above 10% in one step needs a written justification. No `console.log` in release.
- **PERF-5** Zod runs once per response at the fetch boundary, never in render.

## REL — Reliability
- **REL-1** Double-tap safe: a submission can never be sent twice.
- **REL-2** Feedback survives an app kill: pending feedback is saved in a small outbox (with its idempotency key) and retried on next start/foreground, then reconciled with the server.
- **REL-3** Wallet and history refetch on app foreground (respecting `staleTime`).
- **REL-4** An update-required gate (from `/config.minAppVersion`) blocks incompatible versions.
- **REL-5** A global error boundary exists; async errors are handled separately.

## TEST — Testing
- **TEST-1** Logic code is not done without unit tests (money, schemas, state machines, outbox, deep-link validation, routing by `nextStep`).
- **TEST-2** Key components get React Native Testing Library tests.
- **TEST-3** Maestro E2E in mock mode covers the happy path and the main failure paths (STEP 24).

## DEP — Dependencies and supply chain
- **DEP-1** Ask before adding any dependency. It must be actively maintained, compatible with the Expo SDK and New Architecture, under a permissive license (MIT/ISC/BSD/Apache-2.0), and its size impact measured.
- **DEP-2** Pin exact versions. Commit the lockfile. Prefer Expo modules.
- **DEP-3** CI runs `npm audit` for production dependencies and a license check.

## OPS — Release operations
- **OPS-1** Separate dev/staging/production configs (EAS profiles). Secrets live in EAS secrets, never in git.
- **OPS-2** Feature flags only through the backend `/config`; no third-party flag service.
- **OPS-3** OTA updates (EAS Update) must stay compatible with the installed native build (`runtimeVersion` policy). Never ship an OTA that needs a new native module.
- **OPS-4** Staged rollout in Google Play; `CHANGELOG.md` per release; signing keys protected and backed up.

## LEG — Legal and store
- **LEG-1** Privacy Policy, Terms of Service and Rewards Terms URLs must be live before store submission and must match real behavior.
- **LEG-2** No restaurant logos or trademarks without written permission (logos only come from the backend for contracted partners). No OBA branding.
- **LEG-3** Cashback legal classification, personal-data law, hosting location and restaurant agreements are for a **qualified lawyer**; track them in `docs/LEGAL_TODO.md`. Do not decide them in code.

---

# PART 3 — FOLDER STRUCTURE

```
epsilon-app/
├─ app/                          # Expo Router: ROUTES ONLY (thin files)
│  ├─ _layout.tsx  index.tsx  +not-found.tsx
│  ├─ (onboarding)/welcome.tsx
│  ├─ (auth)/_layout.tsx  phone.tsx  otp.tsx  profile-setup.tsx  phone-verify.tsx  phone-verify-code.tsx
│  ├─ (tabs)/_layout.tsx  home.tsx  restaurants.tsx  scan.tsx(placeholder)  cashback.tsx  profile.tsx
│  ├─ scan.tsx                   # full-screen modal
│  ├─ receipt/[receiptId].tsx
│  ├─ rate/[receiptItemId].tsx   # transparent modal rendering <Sheet>
│  ├─ feedback-done.tsx
│  ├─ cashback/transaction/[id].tsx
│  └─ profile/personal-info.tsx  my-reviews.tsx  notifications.tsx  language.tsx  privacy.tsx  help.tsx
├─ src/
│  ├─ features/                  # auth, home, restaurants, scan, receipts, feedback, cashback, profile
│  │   each: screens/ components/ hooks/ keys.ts schemas.ts store.ts
│  ├─ components/ui/             # Text Screen Header Button IconButton Icon ListRow Card Chip Switch Input SegmentedControl Amount Sheet TabBar
│  ├─ components/feedback/       # Skeleton EmptyState ErrorState Toast OfflineBanner
│  ├─ design/                    # tokens.ts theme.ts typography.ts motion.ts
│  ├─ services/
│  │  ├─ api/                    # client.ts errors.ts refresh.ts idempotency.ts
│  │  ├─ contracts/              # zod schemas + types
│  │  ├─ http/  mock/  index.ts  # live vs mock chosen by env
│  ├─ lib/                       # env i18n storage secure-storage money date haptics logger outbox
│  ├─ providers/  hooks/  types/
├─ assets/brand/                 # logo.svg logo-mark.svg app-icon.png(1024) splash.png google-g.svg
├─ locales/                      # az.json en.json ru.json
├─ docs/                         # MASTER_PROMPT.md PROGRESS.md steps/ ARCHITECTURE.md DESIGN_SYSTEM.md API_CONTRACT.md
│                                # openapi.yaml BUSINESS_RULES.md DATA_INVENTORY.md LEGAL_TODO.md DEV_SETUP.md
│                                # QA_CHECKLIST.md RELEASE_GATE.md RELEASE_ANDROID.md PERF_REPORT.md INCIDENT_RESPONSE.md decisions/
├─ __tests__/  .maestro/  .github/workflows/ci.yml
├─ CLAUDE.md  AGENTS.md  .cursor/rules/epsilon.mdc
└─ app.config.ts  eas.json  tsconfig.json  eslint.config.js  .prettierrc  .env.example  package.json
```

**Dependency direction (enforced by ESLint):** `app/` → `features/` → `components/` + `services/` + `lib/` + `design/`. A feature never imports another feature's internals. `components/ui` never imports a feature. `services` never imports UI. No circular imports.

**Shared screen rules (apply to every screen step):** follow PART 2; use only existing primitives and tokens; add strings to az/en/ru (AZ copy is given; write EN and RU); implement loading/empty/error/success; respect Reduce Motion; typed routes; thin route files.

---

# PART 4 — THE STEPS (in this exact order)

Each step: branch `step/NN-name` · micro-steps (a, b, c…) each follow the loop in PART 0.1 · ends with a MANUAL CHECK and a STOP.

---

## STEP 00 — Bootstrap, config, rules  (branch `step/00-bootstrap`)

**Goal:** a clean, strict, CI-checked Expo project with all rules in place. No UI.

**Micro-steps**
- **00.a** Git preflight: confirm repo, `origin`, branch `main`; create `.gitignore` (node_modules, `.env*` except `.env.example`, build output, `*.keystore`, `*.jks`, `*.p8`, `*.pem`); first commit; verify `git push` works. If not: stop and tell Aziz what to run.
- **00.b** Split this file into `docs/steps/NN-name.md` (one file per STEP, plus `docs/steps/PART0-1-2-3.md` for protocol/context/standards/structure). Create `docs/PROGRESS.md` (a checklist of every micro-step in this file, unchecked) and a short `CLAUDE.md`: "Read docs/PROGRESS.md and the current step file. Follow PART 0 loop and PART 2 standards (docs/steps/PART0-1-2-3.md). Android first. One micro-step at a time." Commit and push.
- **00.c** Create the Expo project (TypeScript, Expo Router) in the repo root. Pin exact versions. Confirm it starts.
- **00.d** `tsconfig` strict + `noUncheckedIndexedAccess` + path aliases (`@/…` → `src/…`). ESLint (no-explicit-any, react-hooks, import rules for dependency direction, `import/no-cycle`), Prettier, Husky + lint-staged (eslint + prettier on staged files). Scripts: `lint`, `typecheck`, `test`, `i18n:check` (placeholder), and `check` = all of them.
- **00.e** Create the folder skeleton from PART 3 (use `.gitkeep`; no screens yet).
- **00.f** `src/lib/env.ts` with Zod: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_MODE` (`mock|live`), `EXPO_PUBLIC_APP_ENV` (`development|staging|production`), `EXPO_PUBLIC_MIN_AGE` (default 16), `EXPO_PUBLIC_SUPPORT_EMAIL`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `ENABLE_GOOGLE_SIGNIN`, `ENABLE_APPLE_SIGNIN` (default false). Throw on invalid values. Build guards (SEC-9): production forbids `mock` mode and non-production URLs. `.env.example` documents everything.
- **00.g** `app.config.ts` (Android first): name "Epsilon", slug `epsilon`, scheme `epsilon`, package from env (default `com.epsilonup.app`, TODO confirm), portrait only, light UI style, New Architecture on, adaptive icon (foreground/background/monochrome), edge-to-edge, `softwareKeyboardLayoutMode` resize, permissions only CAMERA (SEC-8, `allowBackup` false, cleartext off), plugins: expo-router, expo-camera, expo-secure-store, expo-localization, expo-splash-screen, expo-build-properties (minify release), `runtimeVersion` policy per OPS-3. Add `expo-dev-client`. `eas.json` profiles: `development` (dev client, APK), `preview` (internal), `production` (AAB, autoIncrement), with update channels.
- **00.h** Write `AGENTS.md` (copy to `.cursor/rules/epsilon.mdc`): a compact (≤ 40 lines) summary of PART 0.1, the SEC/NET/PERF/REL one-liners, "tokens not literals", "i18n not literals", "money via `lib/money`", "no `any`", and "read docs/PROGRESS.md first". Keep it short because it is loaded every session.
- **00.i** `docs/DEV_SETUP.md`: Windows setup (Android Studio, emulator image with Google Play, USB debugging), `eas build --profile development --platform android`, `npx expo start --dev-client`, how to rebuild the dev client.
- **00.j** CI later in STEP 25; for now add a minimal GitHub Actions workflow running `npm ci` and `npm run check`.

**MANUAL CHECK (Aziz):** run `eas build --profile development --platform android`, install the APK, run `npx expo start --dev-client`: a blank app opens. `npm run check` passes locally and in GitHub Actions.

---

## STEP 01 — Design system and primitives  (branch `step/01-design-system`)

**Goal:** every screen later looks like one polished product. No screens.

**Tokens** (`src/design`, the only place values live): colors — brand.primary `#2563EB` (placeholder, TODO exact logo color), primaryPressed `#1D4ED8`, tint `#EFF6FF`, border `#BFDBFE`; ink `#0F172A`, inkSecondary `#64748B`, inkMuted `#94A3B8`, background `#F7F8FA`, surface `#FFFFFF`, border `#E2E8F0`, divider `#F1F5F9`, success `#16A34A`/tint `#ECFDF5`, warning `#D97706`/tint `#FFF7ED`, danger `#DC2626`/tint `#FEE2E2`, overlay `rgba(15,23,42,0.5)`, scanDim `rgba(0,0,0,0.6)`. Spacing 4/8/12/16/20/24/32/48 (screen margin 20). Radius 12/16/20/24/pill. Typography uses the **platform system font** (Roboto on Android): display 56/60 bold tracking −1.5; title1 32/38; title2 24/30; headline 17/22 semibold; body 16/22; callout 15/20 medium; caption 13/18 medium; tab 11/14 (tab labels only). No other size below 13. No shadows (borders are hairline). Motion: durations 120/200/320 ms; out-cubic; spring {damping 20, stiffness 260, mass 1}; press scale 0.97; list stagger 40 ms (max 8). A `useMotion()` hook returns instant values when Reduce Motion is on.

**Primitives** (`src/components/ui`, each with a small test and accessibility props): Text, Screen (safe-area, collapsing large title), Header, Button (primary pill 56 pt / secondary tint / ghost / destructive; loading keeps width; press scale + haptic; Android ripple), IconButton (44 pt), Icon (Lucide only, stroke 2), ListRow (40 pt leading circle icon, title, subtitle, trailing value/chevron, inset hairline), Card, Chip, Switch, Input (56 pt, label above, error below), SegmentedControl, Amount (qəpik → "12.50 ₼", ₼ at 60% size, optional count-up), Skeleton (flat opacity pulse 0.5↔1 over 900 ms, no blur/shimmer image), EmptyState, ErrorState, Toast, plus `__DEV__` route `_design-gallery`.

Platform rules: Android ripple + press scale; no Android elevation shadows; content max width 480 centered; design at 360 dp first; status bar icons dark.

**Micro-steps:** 01.a tokens + theme + typography + motion · 01.b Text, Icon, Screen, Header · 01.c Button, IconButton (+ tests) · 01.d ListRow, Card, Chip, Switch, SegmentedControl · 01.e Input (+ tests) · 01.f Amount (+ money tests later in STEP 04) · 01.g Skeleton, EmptyState, ErrorState, Toast · 01.h dev gallery route · 01.i `docs/DESIGN_SYSTEM.md`.

**MANUAL CHECK:** open the gallery on your phone at normal and large font scale: nothing clipped, 60 fps scrolling.

---

## STEP 02 — Navigation shell, tab bar, Sheet  (branch `step/02-navigation`)

**Goal:** clear orientation everywhere; transitions are smooth and consistent.

- **Root layout:** providers order Theme → I18n → Query → Auth → Toast → OfflineBanner. Splash stays visible until i18n + token read + auth bootstrap finish, then fades 200 ms (PERF-1).
- **Routes:** `(onboarding)`, `(auth)`, `(tabs)`, `scan` (full-screen modal, slide from bottom), `receipt/[receiptId]` (push), `rate/[receiptItemId]` and `cashback/transaction/[id]` (**transparent modal rendering `<Sheet>`**, animation none), `feedback-done` (fade, gesture disabled), `profile/*` (push).
- **Bootstrap redirect (`app/index.tsx`):** no onboarding flag → welcome; no session → welcome/phone; user state decides: missing name/birth date → `/profile-setup`; phone required and unverified → `/phone-verify`; else `/home`. (Later driven by `nextStep` and `/config`.)
- **Tab bar** (custom `TabBar`): Ana səhifə (house), Restoranlar (store), center Skan (scan-line), Keşbek (wallet), Profil (user). White, hairline top border, height 64 + inset. Active: ink icon+label; inactive: inkMuted. Center button: 56 pt brand circle raised 12 pt, spring scale 0.94 + haptic, **pushes `/scan`** (it is not a real tab). The bar never moves; tab content cross-fades 150 ms.
- **`Sheet`:** Reanimated + gesture-handler (or `@gorhom/bottom-sheet` only if compatible with the installed Reanimated; check docs). Dim overlay (no blur), handle, drag-to-dismiss, snap points, keyboard-aware, Android Back closes it, focus moves into it, bottom inset padding. Open spring 280 ms, close 200 ms; Reduce Motion = fade.
- **Back button:** each screen defines it; from a tab root Back exits; sheets and the scan modal close on Back.
- **Deep links:** scheme `epsilon://`; params validated with Zod (SEC-6).
- Screens are stubs that only show their title.

**Micro-steps:** 02.a root layout + providers + splash gate · 02.b route skeleton with stubs and typed routes · 02.c TabBar + center button · 02.d Sheet + transparent-modal wiring · 02.e bootstrap redirect + deep-link param schemas (+ tests) · 02.f Back-button behavior.

**MANUAL CHECK:** every route opens/closes with the right transition; tab bar is stable; no white flash at launch; Back works on all screens.

---

## STEP 03 — Services layer, API client, mocks  (branch `step/03-services`)

**Goal:** UI is built against interfaces; the backend teammate later implements the contract; mock → live is one env variable.

- **Client** (`fetch`, no axios): base URL from env; JSON; 15 s timeout (AbortController); bearer token from memory (SEC-2); headers `Accept-Language`, `X-Request-Id`; Zod validation per call (NET-1); typed `ApiError {code, message, status, requestId}`; codes: UNAUTHORIZED, VALIDATION_FAILED, RATE_LIMITED, OTP_INVALID, OTP_EXPIRED, OTP_TOO_MANY, RECEIPT_UNSUPPORTED, RECEIPT_NOT_FOUND, RECEIPT_ALREADY_CLAIMED, RECEIPT_EXPIRED, FEEDBACK_ALREADY_SUBMITTED, AGE_RESTRICTED, SOCIAL_TOKEN_INVALID, SOCIAL_EMAIL_UNVERIFIED, PHONE_IN_USE, IDENTITY_ALREADY_LINKED, BAD_RESPONSE, NETWORK, TIMEOUT, UNKNOWN.
- **Refresh:** single-flight on 401, one retry, then clear session (NET-4). GET retries max 2 with jitter (NET-2). `Idempotency-Key` helper (NET-3).
- **Contracts** (zod + types; amounts integer qəpik; dates ISO-8601 UTC): `User {id, phone|null, phoneVerified, email|null, firstName|null, lastName|null, birthDate|null, language, identities[], createdAt}` · `Identity {provider "phone"|"google"|"apple", email|null, emailVerified, createdAt}` (provider user ids are never sent to the app) · `Session {accessToken, refreshToken, expiresAt}` · `NextStep "profile"|"phone"|"home"` · `AuthResult {session, user, isNewUser, nextStep}` · `Config {minAppVersion, minAge, requirePhoneVerification}` · `Restaurant {id, name, logoUrl|null, branchCount}` · `Receipt {id, restaurant, branch, issuedAt, totalMinor, currency "AZN", status "verified"|"claimed"|"expired", items[], rewardHint?}` · `ReceiptItem {id, name, quantity, unitPriceMinor, canRate, rating|null}` · `FeedbackInput {receiptItemId, rating 1–5, comment?≤500, reasonCodes?}` · `FeedbackResult {feedbackId, reward {status "none"|"pending"|"confirmed", amountMinor|null}}` · `Wallet {balanceMinor, pendingMinor, currency}` · `WalletTransaction {id, type "earned"|"redeemed"|"reversed"|"expired", status "pending"|"confirmed"|"cancelled", amountMinor (signed), createdAt, source {restaurantId, restaurantName, branchName|null}|null, receiptId|null, itemName|null}` · `Paginated<T> {items, nextCursor}`.
- **Service interfaces** (http + mock, identical signatures), chosen in `services/index.ts` by env: AuthService (requestOtp, verifyOtp, signInWithGoogle, signInWithApple[off], requestPhoneLinkOtp, verifyPhoneLink, refresh, logout) · UserService (me, updateProfile, deleteAccount) · ConfigService · RestaurantService · ReceiptService (resolve, get) · FeedbackService (submit, list) · WalletService (get, transactions, transaction) · NotificationService (settings, registerDevice).
- **Mocks:** realistic but clearly fake data, latency 300–700 ms, dev menu (long-press the profile avatar in `__DEV__`) to switch scenarios: success, empty, network error, each receipt/OTP/social error. Mock mode is impossible in production (SEC-9).
- **React Query:** staleTime 30 s, gcTime 5 min, key factory per feature, precise invalidation.
- **Tests:** client (timeout, single-flight refresh, error mapping, BAD_RESPONSE), every mock fixture parses against its schema.

**Micro-steps:** 03.a contracts · 03.b client + errors + idempotency (+ tests) · 03.c refresh single-flight (+ tests) · 03.d service interfaces · 03.e mock implementations + fixtures + contract tests · 03.f dev scenario menu · 03.g query defaults + key factories.

**MANUAL CHECK:** switch scenarios in the dev menu; no screen code changed when switching mock/live.

---

## STEP 04 — i18n, money, date  (branch `step/04-i18n`)

- i18next with `locales/az.json` (default), `en.json`, `ru.json`; initial language = saved choice, else device language if az/en/ru, else az; switching is instant and saved locally (synced to backend later). Namespaces per feature. `npm run i18n:check` fails on missing/unused keys in any language.
- `lib/money.ts`: `formatMoney(minor, {sign?})` → "12.50 ₼", "+3.20 ₼", "−3.20 ₼" (real minus sign). `lib/date.ts`: groups "Bu gün", "Dünən", else "12 Oktyabr 2026"; time `HH:mm`. Plural rules for az and ru (3 forms).
- Seed `common` and `errors` namespaces (retry "Yenidən cəhd et", offline "İnternet bağlantısı yoxdur", generic "Nəsə səhv getdi").

**Micro-steps:** 04.a i18n setup + 3 locale files + language persistence · 04.b `i18n:check` script wired into `check` · 04.c money (+ tests: 0, 5, 100, 123456, negatives) · 04.d date (+ tests) · 04.e plurals.

**MANUAL CHECK:** switching language re-renders visible text instantly (use the gallery).

---

## STEP 05 — Welcome / sign-in options  (branch `step/05-welcome`)

**Layout (20 pt margins):** logo mark 40 pt (assets/brand/logo.svg) · title1 "Yeməyi qiymətləndir, keşbek qazan" · body "Çekinizi skan edin, yeməkləri qiymətləndirin və keşbek balansınıza əlavə olunsun." · three steps as ListRows (scan-line, star, wallet): "Çeki skan edin" / "Yeməyi qiymətləndirin" / "Keşbek qazanın" · bottom stack (12 pt gaps, 56 pt, pill): Apple button (**only if `ENABLE_APPLE_SIGNIN`**, native Apple button), **Google button** (white, hairline border, official multicolor "G" from bundled SVG, label "Google ilə davam et", per Google branding guidelines), divider "və ya", brand-filled **"Telefon nömrəsi ilə davam et"** · caption "Davam etməklə İstifadə Şərtləri və Məxfilik Siyasəti ilə razı olursunuz." (links via expo-web-browser).
**Rules:** hide any button whose flag is off; while a sign-in runs all buttons are disabled and the tapped one shows loading (no width change). **Motion:** title/steps/buttons fade-up with 40 ms stagger; press scale + haptic. No illustration, no carousel.

**Micro-steps:** 05.a layout + strings · 05.b buttons (Google official style, phone primary) + flags · 05.c legal links caption · 05.d motion + a11y labels ("Google ilə davam et", "Telefon nömrəsi ilə davam et") + test.

**MANUAL CHECK:** screen is correct on a small Android; buttons respond; legal links open.

---

## STEP 06 — Phone sign-in  (branch `step/06-phone`)

**Layout:** Header with back; title1 "Telefon nömrənizi daxil edin"; helper "Təsdiq kodu SMS ilə göndəriləcək."; row: fixed "+994" chip + 56 pt input (number-pad, autofocus, telephone autofill); button "Kod göndər" pinned above the keyboard. **Format** while typing "50 123 45 67"; accept pasted "+994501234567"/"0501234567"; validate Azerbaijan mobile prefixes (50, 51, 55, 70, 77, 99, 10, 60) + 7 digits with Zod; disabled until valid; error "Nömrə düzgün deyil." **Data:** `AuthService.requestOtp` → `{retryAfterSeconds}`; RATE_LIMITED → "Çox cəhd edildi. Bir az sonra yenidən yoxlayın."; NETWORK → toast. AUTH-2: the UI never says whether the number exists. Success → push `/otp`.
**Extract shared components now:** `PhoneField`, `OtpInput`, `ResendTimer` in `features/auth/components` (reused in STEP 10).

**Micro-steps:** 06.a phone schema + formatter (+ tests) · 06.b `PhoneField` · 06.c screen + keyboard-safe button · 06.d request mutation + errors · 06.e a11y + test.

**MANUAL CHECK:** keyboard never covers the button; paste formats are normalized.

---

## STEP 07 — SMS code  (branch `step/07-otp`)

**Layout:** back; title1 "Kodu daxil edin"; body "{{phone}} nömrəsinə göndərilən 6 rəqəmli kodu yazın." (phone masked "+994 50 ••• •• 67"); 6 boxes (48×56 pt) driven by **one hidden TextInput** (paste, `textContentType="oneTimeCode"`, `autoComplete="sms-otp"`; **no READ_SMS permission**); resend "Kodu yenidən göndər" / "{{s}} san. sonra yenidən göndər". **Behavior:** auto-submit at 6 digits; verifying = boxes disabled at opacity 0.6; OTP_INVALID → shake (±8 pt ×3, 240 ms), error haptic, clear, "Kod yanlışdır. Yenidən cəhd edin."; OTP_EXPIRED → "Kodun müddəti bitib. Yeni kod göndərin."; OTP_TOO_MANY → lock for the returned duration. **Data:** `verifyOtp` → `AuthResult`; save session (SEC-2) and route by `nextStep`. Reduce Motion: color flash instead of shake.

**Micro-steps:** 07.a `OtpInput` + `ResendTimer` (+ tests) · 07.b screen + verify mutation · 07.c error states + shake · 07.d session save + routing by `nextStep` (+ tests) · 07.e a11y.

**MANUAL CHECK:** SMS autofill works on your phone; resend timer survives leaving and returning.

---

## STEP 08 — Google sign-in  (branch `step/08-google`)

**Aziz does first (docs/DEV_SETUP.md):** Google Cloud project; OAuth consent screen with app name, support email, privacy policy link, scopes **only** openid/email/profile; **publish to "In production"**; create OAuth clients: **Web** (its ID = `GOOGLE_WEB_CLIENT_ID`, used by app and backend), **Android** (package + SHA-1 for: local debug key if used, EAS development/preview keystore from `eas credentials`, production keystore, later Google Play App Signing key). A missing SHA-1 causes DEVELOPER_ERROR.
**Build:** `useGoogleSignIn`: configure once at startup (only if flag + client ID set) with `webClientId`; press → Play Services check → sign in → `idToken` → `AuthService.signInWithGoogle({idToken})` → discard the token (SEC-3). Cancel → silent. Errors → AZ messages: "Daxil olmaq mümkün olmadı. Yenidən cəhd edin." / "İnternet bağlantısı yoxdur" / "Google Play xidmətləri yenilənməlidir." / "Telefonda Google hesabı yoxdur" / SOCIAL_EMAIL_UNVERIFIED "Bu Google hesabının e-poçtu təsdiqlənməyib." Prevent double taps and concurrent flows. On success save session, put user in the cache, route by `nextStep` (new users never see an empty Home). Logout calls `GoogleSignin.signOut()`. Apple code stays off.
**Tests:** success, cancel, invalid token, no network, double tap (native modules mocked).

**Micro-steps:** 08.a plugin/config + env gating + docs · 08.b `useGoogleSignIn` hook (+ tests) · 08.c wire the Welcome button · 08.d error messages · 08.e session + `nextStep` routing · 08.f logout integration.

**MANUAL CHECK:** on your phone: Google → profile setup (new user) works; cancel leaves Welcome usable; "use another account" works. Needs a development build.

---

## STEP 09 — Profile setup  (branch `step/09-profile-setup`)

**Layout:** title1 "Sizi tanıyaq"; Inputs "Ad", "Soyad" (prefilled from Google if present), "Doğum tarixi" (native date picker, default 18 years ago, max today); read-only caption "Hesab: name@gmail.com" if email exists (do not ask again); language SegmentedControl AZ/EN/RU (instant); primary "Davam et". **Rules:** names 2–40 chars, letters/spaces/hyphens/apostrophes incl. ə ı ö ü ç ş ğ; age < `MIN_AGE` → blocking inline "Epsilon-dan istifadə üçün ən azı {{age}} yaşınız olmalıdır." (also on AGE_RESTRICTED). **Data:** `updateProfile` → route by updated `nextStep` (usually `/phone-verify`, else `/home`). react-hook-form + Zod; keyboard safe.

**Micro-steps:** 09.a schema + age rule (+ boundary tests: exactly MIN_AGE allowed, one day short blocked) · 09.b form fields · 09.c date picker · 09.d submit + routing · 09.e a11y.

**MANUAL CHECK:** a new Google user reaches the next step; underage date is blocked.

---

## STEP 10 — Phone verification for any account  (branch `step/10-phone-verify`)

**Goal:** link a verified phone to the signed-in account (anti-fraud anchor). Reuse `PhoneField`, `OtpInput`, `ResendTimer`.
**Copy:** title1 "Telefon nömrənizi təsdiqləyin"; body "Hesabınızı qorumaq və keşbeki təhlükəsiz hesablamaq üçün nömrənizi bir dəfə təsdiqləməlisiniz."; button "Kod göndər". Code screen as STEP 07 but calls `verifyPhoneLink`. **Errors:** PHONE_IN_USE → sheet "Bu nömrə başqa hesaba bağlıdır." with "Başqa nömrə yaz" (primary) and "Dəstəklə əlaqə" (ghost); no automatic merging. **Behavior:** cannot be skipped when `requirePhoneVerification` is true (no back to Welcome; a "Hesabdan çıx" ghost link is allowed). If the flag is false: "İndi yox" → Home plus a gentle banner on Home/Cashback ("Keşbek almaq üçün nömrəni təsdiqləyin") that returns here. Killing the app at any onboarding step resumes at the right step.

**Micro-steps:** 10.a phone-verify entry screen · 10.b code screen · 10.c PHONE_IN_USE sheet · 10.d skip/banner logic by config · 10.e resume-at-step tests.

**MANUAL CHECK:** Google user: Google → profile → phone → Home; kill the app mid-way and reopen.

---

## STEP 11 — Home  (branch `step/11-home`)

**Goal:** orientation in one glance: balance, one action, recent activity. Nothing else.
**Layout (scroll, pull-to-refresh):** top bar 56 pt — logo mark 28 pt left, ONE bell right (no badge at 0), no title · greeting callout "Salam, {{firstName}}" · caption "Ümumi keşbek" + **Amount at display size (56 pt)** e.g. "0.00 ₼" · if `pendingMinor > 0`: warning Chip "Gözləyən {{amount}}" · caption "Keşbek bütün partnyor restoranlarda toplanır." (remove if funding rules change) · primary button 56 pt "Çeki skan et" + centered caption "Yeməkləri qiymətləndirin və keşbek qazanın." · section "Son fəaliyyət" with right link "Hamısına bax" (→ Keşbek tab) · latest 3 `TransactionRow`s; empty: "Hələ fəaliyyət yoxdur." No cards around the balance, no banners, no tips.
**Data:** `useWallet()`, `useWalletTransactions({limit:3})` in `features/cashback/hooks` (shared). **States:** loading skeleton (balance 200×56 + 3 rows, same heights as final); error inline with retry (scan button stays usable); offline keeps cached data + banner. **Motion:** count-up only when the value changes (not on first render at 0); row stagger once; press scale + haptic. **A11y:** balance read as "Ümumi keşbek, 12 manat 50 qəpik".

**Micro-steps:** 11.a `useWallet` + `useWalletTransactions` hooks (+ tests) · 11.b shared `TransactionRow` · 11.c Home layout + strings · 11.d states (skeleton/error/offline) · 11.e count-up + motion · 11.f a11y + test.

**MANUAL CHECK:** pull-to-refresh works; no layout jump when data arrives; scan button opens the scan modal.

---

## STEP 12 — Restaurants  (branch `step/12-restaurants`)

Large collapsing title "Restoranlar"; search pill 48 pt "Restoran axtar" (clear button); FlashList of rows (logo 40 pt via expo-image or neutral store icon, name, caption "{{n}} filial"). **Empty (launch state):** icon store + "Restoranlar tezliklə burada görünəcək." (no fake rows). No-result: "Heç nə tapılmadı" / "Başqa ad yoxlayın." Debounce 300 ms, cursor pagination via `RestaurantService.list`. Rows are **not tappable** (no chevron) until a detail screen exists. States: loading skeleton, error, empty, no-results, offline. LEG-2: logos only from the backend.

**Micro-steps:** 12.a hook + keys + infinite query (+ tests) · 12.b list + row · 12.c search + debounce · 12.d states + strings.

**MANUAL CHECK:** typing never janks; empty state shows against the real empty backend response.

---

## STEP 13 — Scan receipt QR  (branch `step/13-scan`)

**Goal:** the fastest, most polished moment of the app.
**State machine** (`useScanMachine`, tested): permission-unknown → permission-denied | scanning → resolving → success | error(code) | manual-entry.
**Layout:** full-bleed `CameraView` (QR only), **no photo behind, no white block** · top (inset): close IconButton, title "Çeki skan et" (white), torch IconButton · viewfinder 260×260 with the dim mask drawn by four 60% black rects (**no blur**), four white corner brackets, one thin brand-blue scan line moving (1800 ms loop) · pill under it: "QR kodu çərçivəyə yerləşdirin" · bottom: secondary pill "Kodu əllə daxil et".
**Permission:** pre-permission screen (camera icon, "Kameraya icazə lazımdır", "Çekin QR kodunu oxumaq üçün Epsilon-a kameradan istifadə icazəsi verin.", "İcazə ver"); if denied: "Ayarları aç" (open settings) + ghost "Kodu əllə daxil et".
**Handling:** accept only the first read then lock; pause the camera on success/error; stop it when unfocused or backgrounded. Client checks only: non-empty, length ≤ 2048 (SEC-7: never parse or open it). Send the raw payload: `ReceiptService.resolve({kind:"qr"|"code", value})`. resolving: pill "Yoxlanılır…". Success: corners turn green, check pops (spring 0.6→1), success haptic, after 400 ms `router.replace('/receipt/<id>')`.
**Errors** (card slides up 260 ms, "Yenidən skan et" + ghost "Bağla"): UNSUPPORTED "Bu QR kod dəstəklənmir" / "Yalnız Epsilon partnyor restoranlarının çekləri qəbul olunur." · ALREADY_CLAIMED "Bu çek artıq istifadə olunub" / "Hər çeki yalnız bir dəfə qiymətləndirmək olar." · EXPIRED "Çekin müddəti bitib" / "Bu çeki artıq qiymətləndirmək mümkün deyil." · NOT_FOUND "Çek tapılmadı" / "Kodu yoxlayıb yenidən cəhd edin." · NETWORK "İnternet bağlantısı yoxdur" / "Bağlantını yoxlayın və yenidən cəhd edin." · UNKNOWN "Nəsə səhv getdi" / "Bir az sonra yenidən cəhd edin."
**Manual entry:** Sheet with Input "Çek kodu" (uppercase, no spaces, 6–32 chars) + "Davam et".

**Micro-steps:** 13.a state machine (+ tests) · 13.b permission screens · 13.c camera + overlay + scan line · 13.d resolve call + success/lock · 13.e error cards · 13.f manual-entry sheet · 13.g lifecycle (focus/background) + a11y.

**MANUAL CHECK (real phone):** camera visible within ~400 ms; repeated scans don't fire multiple requests; works with permission granted, denied and revoked in Settings.

---

## STEP 14 — Receipt details  (branch `step/14-receipt`)

Header "Çek" with back. Top: restaurant logo 48 pt (or neutral icon), name (title2), caption "{{branch}} · {{date, time}}", Chip "Təsdiqləndi". Section "Qiymətləndirilə bilən yeməklər": item rows (name; "{{qty}} × {{unit price}}"; trailing: `canRate && rating==null` → small pill "Qiymətləndir"; rated → read-only stars + "Qiymətləndirildi"; `!canRate` → nothing). Footer "Cəmi" Amount. Receipt id (caption, mono) at the bottom. Show `rewardHint` **only if the backend sends it**; never invent reward amounts or rules. Tap item/pill → `/rate/<itemId>`. When all rateable items are rated: primary "Ana səhifəyə qayıt".
**Data:** `useReceipt(id)` with initial data from the resolve result (no second spinner); invalidate after rating. States: skeleton, error retry, claimed/expired → read-only. Long dish names wrap to 2 lines.

**Micro-steps:** 14.a hook + initial data (+ tests) · 14.b header + items list · 14.c status/read-only logic · 14.d footer + rewardHint · 14.e a11y.

**MANUAL CHECK:** opens instantly after scan with no empty flash; qəpik amounts correct.

---

## STEP 15 — Rate a dish (sheet)  (branch `step/15-rate`)

**Sheet content:** dish name (title2) + caption restaurant · "Bu yeməyi necə qiymətləndirirsiniz?" · 5 large stars (48 pt, 56 pt tap area), selection haptic, quick spring 1→1.15→1; label per rating: 1 "Çox pis", 2 "Pis", 3 "Normal", 4 "Yaxşı", 5 "Əla" · if rating ≤ 3: multi-select reason chips (height+opacity 200 ms): "Dadı", "Temperatur", "Porsiya", "Qiymət", "Təqdimat", "Gözləmə vaxtı" · comment Input (3 lines, "Rəyiniz (istəyə bağlı)", counter n/500) · caption "Keşbek rəyin müsbət və ya mənfi olmasından asılı deyil." · primary "Göndər" (disabled until a rating), above the keyboard.
**Behavior:** idempotency key generated on open and kept until success (NET-3). Loading keeps width. Success → `/feedback-done` with item name + reward; invalidate receipt + wallet + transactions. FEEDBACK_ALREADY_SUBMITTED → toast "Bu yemək artıq qiymətləndirilib." and close. NETWORK → inline error with retry; keep the typed comment. Dismiss with unsaved text → confirm "Rəyiniz silinəcək. Çıxmaq istəyirsiniz?" ("Çıx" / "Qal").
**Outbox (REL-2):** before sending, save `{receiptItemId, rating, comment, reasonCodes, idempotencyKey, createdAt}` in a small AsyncStorage outbox (max 20, drop older than 7 days). On success/ALREADY_SUBMITTED remove it. On NETWORK/TIMEOUT or app kill keep it; retry sequentially on next start/foreground and after login; show "Göndərilir…" on that item in the receipt; on VALIDATION error drop it and show a toast. Cleared on logout (AUTH-4). Tests: kill-and-retry, duplicate replay, drop rules.

**Micro-steps:** 15.a outbox module (+ tests) · 15.b star rating component + labels · 15.c reason chips + comment · 15.d submit mutation + idempotency + outbox wiring · 15.e error/dismiss-confirm flows · 15.f retry on start/foreground · 15.g a11y.

**MANUAL CHECK:** double-tapping "Göndər" never sends twice; turn on airplane mode, submit, kill the app, go online, reopen: it is sent once.

---

## STEP 16 — Feedback confirmation  (branch `step/16-feedback-done`)

Centered success circle 72 pt (spring 0.6→1, 280 ms, success haptic); title2 "Təşəkkürlər!"; body "Rəyiniz göndərildi." **Reward line from `FeedbackResult.reward` only:** confirmed → Amount "+{{amount}}" in success color + "Balansınıza əlavə olundu."; pending → "Keşbek təsdiqlənəndən sonra balansınıza əlavə olunacaq."; none → **no reward line** (never promise). Buttons: primary "Digər yeməyi qiymətləndir" (only if rateable items remain → back to the receipt) and ghost "Ana səhifəyə qayıt" (dismiss all, `/home`). Back gesture disabled; hardware Back goes Home. No confetti. Reduce Motion: final state instantly.

**Micro-steps:** 16.a layout + three reward variants (+ tests) · 16.b motion + haptic · 16.c navigation rules.

**MANUAL CHECK:** all three reward variants (use the dev menu) look right.

---

## STEP 17 — Cashback (universal wallet)  (branch `step/17-cashback`)

**Layout:** large title "Keşbek"; hero caption "Balans" + Amount display 56 pt; if pending > 0 Chip "Gözləyən {{amount}}". Empty (zero history): EmptyState icon wallet, "Hələ əməliyyat yoxdur", "Skan etdiyiniz çeklər və qazandığınız keşbeklər burada görünəcək.", primary "Çeki skan et". History: FlashList with sticky date headers ("Bu gün", "Dünən", "12 Oktyabr"); row = leading 40 pt icon by type (earned arrow-down-left on successTint, redeemed arrow-up-right on brand tint, reversed rotate-ccw on warningTint, expired clock on divider); title = source restaurant (or "Keşbek"); subtitle "{{type label}} · {{HH:mm}}" with labels "Qazanılıb", "Xərclənib", "Ləğv edilib", "Müddəti bitib"; trailing signed Amount (earned "+3.20 ₼" success color; redeemed "−3.20 ₼" ink; pending rows muted + caption "Gözləyir"). UX-4 applies. Tap → transaction sheet. **No redeem button, no per-restaurant balance list, no help card.**
**Data:** `useWallet()`, infinite `useWalletTransactions()` (cursor, 20/page), pull-to-refresh, refetch on foreground (REL-3). Reuse `TransactionRow`. States: skeleton (hero + 6 rows), empty, error (hero keeps cached data), offline, end of list. Date grouping uses the device timezone.

**Micro-steps:** 17.a date grouping util (+ tests) · 17.b hero + pending chip · 17.c history list + sticky headers · 17.d row variants (+ tests) · 17.e states + empty · 17.f foreground refetch + a11y.

**MANUAL CHECK:** a long mock history (1000 rows) scrolls at 60 fps.

---

## STEP 18 — Transaction detail (sheet)  (branch `step/18-transaction`)

Sheet: 56 pt type icon; signed Amount (title1 size, colored as in the list); status Chip ("Təsdiqləndi" success / "Gözləyir" warning / "Ləğv edildi" danger). Label/value ListRows without chevron: "Restoran", "Filial", "Yemək" (if present), "Tarix" (date + time), "Çek nömrəsi" and "Əməliyyat nömrəsi" (tap to copy → toast "Kopyalandı"). Null values are omitted (no "—" rows). Data: initial data from the list cache, then `WalletService.transaction(id)` refresh. Skeleton only if no cached data.

**Micro-steps:** 18.a sheet + rows + omit-null logic (+ tests) · 18.b copy + toast · 18.c refresh + states.

**MANUAL CHECK:** opens instantly from the list; copy works; TalkBack reads value after label.

---

## STEP 19 — Profile hub  (branch `step/19-profile`)

Large title "Profil". Identity block (no card): 64 pt avatar circle with the logo mark on brand tint (no initials, no photo upload), name (title2), masked phone (or email if no phone), small edit IconButton → personal info. Grouped lists (white rounded groups, hairline dividers, 52 pt rows): **HESAB** — "Şəxsi məlumatlar", "Rəylərim" (trailing count), "Bildirişlər", "Dil seçimi" (trailing "AZ"); **TƏHLÜKƏSİZLİK VƏ DƏSTƏK** — "Məxfilik və təhlükəsizlik", "Yardım və dəstək"; separate destructive row "Hesabdan çıx" (confirm sheet "Hesabdan çıxmaq istəyirsiniz?" — "Çıx" / "Ləğv et"). Footer caption "Epsilon v{{version}}". No colored icon boxes, no levels, no achievements. Logout follows AUTH-4. `__DEV__` only: long-press avatar opens the mock scenario menu.

**Micro-steps:** 19.a identity block · 19.b grouped rows + routes · 19.c logout flow + full cleanup (+ test that nothing remains) · 19.d version footer + a11y.

**MANUAL CHECK:** logout then login with another Google account works; nothing from the first account remains.

---

## STEP 20 — Profile sub-screens  (branch `step/20-profile-sub`)

1. **Personal info:** Inputs "Ad", "Soyad" (editable); read-only "Telefon" (caption "Telefon nömrəsini dəyişmək üçün dəstəklə əlaqə saxlayın.") and "Doğum tarixi"; read-only group "Daxil olma üsulları" listing linked identities (Telefon, Google + email). "Yadda saxla" only when dirty; toast "Yadda saxlanıldı".
2. **My reviews:** FlashList (dish, restaurant, date, read-only stars, 2-line comment preview); empty "Hələ rəy yoxdur" / "Qiymətləndirdiyiniz yeməklər burada görünəcək."; infinite scroll.
3. **Notifications:** switches "Keşbek yenilikləri" (default on), "Yeni partnyor restoranlar" (default off); caption "Reklam bildirişləri yalnız razılığınızla göndərilir." Ask the OS permission only when the user turns something on (Android 13+ POST_NOTIFICATIONS), after a short explanation; one notification channel "Keşbek yenilikləri"; register the device token via `NotificationService` (no sensitive payloads, SEC-3).
4. **Language:** three radio rows AZ "Azərbaycan dili", EN "English", RU "Русский"; applies instantly, saved locally, synced to backend.
5. **Privacy:** "Məxfilik siyasəti", "İstifadə şərtləri" (expo-web-browser); static text "Məlumatlarımın istifadəsi" (no tracking, no ads, what is stored); toggle "Xəta hesabatları göndər" (crash reports, STEP 23); destructive "Hesabı sil": sheet 1 explains consequences and shows the backend `deletionWarning` if present (PRIV-2; never invent policy), then **re-authentication** (AUTH-3: fresh OTP or fresh Google sign-in), then sheet 2 requires typing "SİL" (or "DELETE" / "УДАЛИТЬ" by language), then `UserService.deleteAccount()`, Google `signOut` + `revokeAccess` (ignore errors), clear everything, go to Welcome.
6. **Help:** FAQ accordion (4 static Q&As: how scanning works, why a receipt may be unsupported, when cashback is confirmed, how to delete the account — honest and generic, no invented rules) + "Dəstəklə əlaqə" (`mailto:` env support email).

**Micro-steps:** 20.a personal info · 20.b my reviews · 20.c notifications + permission flow · 20.d language · 20.e privacy links + crash toggle · 20.f delete flow with re-auth (+ tests) · 20.g help.

**MANUAL CHECK:** deleting a mock account clears all local data; language switch updates open screens instantly.

---

## STEP 21 — Global states and resilience  (branch `step/21-resilience`)

- **OfflineBanner** (NetInfo): slim bar under the inset, "İnternet bağlantısı yoxdur", slides down 200 ms; on reconnect shows "Bağlantı bərpa olundu" for 1.5 s (success color). Never blocks the UI. React Query `onlineManager` pauses/resumes.
- **ErrorBoundary:** full-screen ErrorState "Nəsə səhv getdi" + "Yenidən yüklə"; logs only a scrubbed error (SEC-3).
- **Toast queue:** one visible at a time.
- **+not-found:** "Səhifə tapılmadı" + "Ana səhifəyə qayıt".
- **Session expiry:** toast "Sessiyanız bitdi. Yenidən daxil olun." → Welcome.
- **Update gate (REL-4):** `/config.minAppVersion` → full-screen "Yeniləmə tələb olunur" with a Play Store link.
- **BAD_RESPONSE** path: generic error, never a crash; unit-tested.
- Uniform pull-to-refresh style. Device clock is never used for decisions (NET-6): add a test that a wrong device date changes nothing.

**Micro-steps:** 21.a OfflineBanner + online manager · 21.b ErrorBoundary + test (throw in a child) · 21.c toast queue · 21.d not-found + session expiry · 21.e update gate · 21.f BAD_RESPONSE + clock tests.

**MANUAL CHECK:** airplane mode: all tabs show cached data + banner; no infinite spinners anywhere; set the phone clock to a wrong date: the app behaves normally.

---

## STEP 22 — Android audit  (branch `step/22-android-audit`)

**Goal:** prove the Android build is clean and safe. Produce `docs/ANDROID_AUDIT.md`.
Verify on a **release/preview build** and record the result (pass/fail/not verified) for each:
- Merged manifest: only the main activity exported; permissions are only CAMERA (+ POST_NOTIFICATIONS if used); `allowBackup` false; cleartext traffic off (SEC-8).
- Adaptive icon (foreground, background, monochrome) and the Android 12+ splash (logo on plain white, no blur, held until bootstrap ends).
- Edge-to-edge insets with three-button and gesture navigation; status bar icons dark; keyboard never covers primary buttons (test Samsung and Google keyboards).
- Back button behavior on every screen (PART 0 of STEP 02).
- SMS code autofill works on a real phone without READ_SMS.
- Notification channel exists; permission asked only after the user turns a toggle on.
- Text at 1.3× font scale on a 360 dp screen: nothing clipped (UX-3). TalkBack pass on every screen (UX-2).

**Micro-steps:** 22.a manifest/permission audit script + result · 22.b fixes found · 22.c TalkBack and font-scale pass with fixes · 22.d write `docs/ANDROID_AUDIT.md`.

**MANUAL CHECK:** Aziz installs the preview build; no unexpected permission appears; Back works everywhere.

---

## STEP 23 — Crash reporting (privacy-safe, light)  (branch `step/23-crash-reporting`)

Ask Aziz to confirm the tool first (DEP-1). Default recommendation: Sentry (`@sentry/react-native` with the Expo plugin).
**Rules (all must hold):**
- Initialize **after the first frame** (never on the startup path, PERF-1). Disabled in development unless a flag is set. Disabled if the DSN is empty.
- No performance tracing (`tracesSampleRate` 0), no session replay, no profiling, `sendDefaultPii` false, no user object, no request bodies/headers, no URL query strings.
- A `beforeSend` scrubber removes any phone/email/token/OTP/receipt-like strings and breadcrumbs that contain payloads (SEC-3). Add unit tests with sample payloads.
- Tag `release`, `dist`, `environment`, app version. Upload source maps in CI/EAS only.
- Respect the Privacy toggle "Xəta hesabatları göndər" (STEP 20). Disclose in the privacy policy (PRIV-3).
- Measure cold start before/after; if it regresses by more than 100 ms on the low-end phone, defer more or remove (PERF).

**Micro-steps:** 23.a decision + install + config plugin · 23.b deferred init + env gating · 23.c scrubber (+ tests) · 23.d toggle integration · 23.e source map upload in EAS · 23.f startup measurement recorded in `docs/PERF_REPORT.md`.

**MANUAL CHECK:** trigger a test crash in a preview build; it appears in the dashboard with no personal data.

---

## STEP 24 — Test suite  (branch `step/24-tests`)

**Unit/component (Jest + RNTL):** money, date, plurals; phone/age/profile schemas; deep-link param schemas; API client (timeout, refresh single-flight, BAD_RESPONSE, error mapping); outbox (kill-and-retry, drop rules, duplicate replay); scan state machine; `nextStep` routing; transaction row variants; account-deletion flow; logout leaves nothing; scrubber; every mock fixture vs schema. Set minimum coverage on `services/`, `lib/` and state machines.
**E2E (Maestro, mock mode), flows in `.maestro/`:**
1. Happy path: new Google user → profile → phone verify → Home → scan (mock payload) → rate → done → balance changed → logout.
2. Phone sign-in: wrong OTP, expired OTP, correct OTP.
3. Scan failures: unsupported, already claimed, expired, no network; camera permission denied and then granted.
4. Rating: submit offline, kill app, reconnect, reopen → sent once.
5. Account deletion with re-authentication.
**Critical scenarios checklist** (each must be covered by a unit or E2E test, or listed as backend-verified in `docs/QA_CHECKLIST.md`): login/logout/login again · same account on two devices · app killed during submission · network drops after the server commits but before the app hears back (idempotent replay returns the same result) · same receipt scanned twice · two users claim one receipt (backend) · simultaneous redemption (backend, future) · negative/huge/malformed numbers · invalid JSON or missing fields from the server · old app version vs new backend · deleting an account with pending rewards · wrong device clock · camera/notification permission denied · malformed deep link.

**Micro-steps:** 24.a missing unit tests per the list · 24.b coverage thresholds in CI · 24.c Maestro setup + flow 1 · 24.d flows 2–5 · 24.e scenario table in `docs/QA_CHECKLIST.md`.

**MANUAL CHECK:** Aziz runs the Maestro happy path on his phone/emulator.

---

## STEP 25 — CI/CD and supply chain  (branch `step/25-ci`)

GitHub Actions (all lightweight, none affect the app at runtime):
- On every PR: `npm ci`, lint, typecheck, tests with coverage thresholds, `i18n:check`, `npm audit --omit=dev --audit-level=high`, license check (allow MIT, ISC, BSD, Apache-2.0; fail on others), secret scan (gitleaks), a guard script that fails if `API_MODE=mock` or a non-production URL appears in the production profile (SEC-9), and a bundle-size report comment (PERF-4).
- Dependabot for npm and GitHub Actions (weekly).
- A **manual** workflow to trigger EAS builds (`development`, `preview`, `production`) and one for EAS Update on the `preview` channel only.
- `CHANGELOG.md` and a PR template with a checklist (rule IDs touched, tests added, manual check done).
- Instructions for Aziz (in `docs/DEV_SETUP.md`): protect `main` (require passing CI + PR), keep EAS credentials backed up, store secrets only in EAS/GitHub secrets.
- OTA safety (OPS-3): document the `runtimeVersion` policy and the rule "no OTA that needs a new native module".

**Micro-steps:** 25.a PR workflow · 25.b audit/license/secret scan · 25.c guard script (+ test) · 25.d bundle report · 25.e Dependabot + PR template + CHANGELOG · 25.f manual EAS workflows · 25.g docs.

**MANUAL CHECK:** open a test PR; all checks run and pass; a deliberate `API_MODE=mock` in the production profile makes CI fail.

---

## STEP 26 — Backend contract and financial integrity (docs only)  (branch `step/26-backend-contract`)

**Goal:** the backend teammate can build without asking about names, types, codes or rules. Produce `docs/openapi.yaml`, `docs/API_CONTRACT.md`, `docs/BUSINESS_RULES.md`. Add a contract test: every mock fixture validates against the schemas.

**Conventions:** base path `/v1`; JSON; bearer auth; amounts integer qəpik; ISO-8601 UTC; cursor pagination `{items, nextCursor}` with `limit` ≤ 50; errors `{"error":{"code","message","requestId"}}` with the codes from STEP 03; `Accept-Language`; `Idempotency-Key` on POST feedback; `Retry-After` on rate limits.

**Endpoints:** Auth — `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/google {idToken}`, `POST /auth/apple` (later), `POST /auth/refresh`, `POST /auth/logout` · User — `GET /me`, `PATCH /me`, `DELETE /me {appleAuthorizationCode?}`, `POST /me/phone/otp/request`, `POST /me/phone/otp/verify` · `GET /config` · `GET /restaurants` · Receipts — `POST /receipts/resolve {kind, value}`, `GET /receipts/{id}` · Feedback — `POST /feedback`, `GET /feedback` · Wallet — `GET /wallet`, `GET /wallet/transactions`, `GET /wallet/transactions/{id}` · Notifications — `GET/PUT /me/notification-settings`, `POST /devices`.

**Backend requirements (write each into BUSINESS_RULES.md as MUST):**
- *Auth:* OTP rate limits per phone, IP and account; OTP expiry and attempt limits; responses never reveal whether a number exists; short-lived access token + rotating refresh token with reuse detection; revoke sessions on logout/deletion; `recentAuth` enforced for account deletion.
- *Google:* verify the ID token on the server (signature via Google keys, `iss`, `aud` = web client ID, `exp`, `email_verified`); identity = `sub`, not email; table `auth_identities(user_id, provider, provider_user_id UNIQUE per provider, email, email_verified)`; **never auto-link or merge by email**; linking only while signed in and with proof (OTP).
- *Authorization:* object-level ownership checks on every receipt, feedback and wallet read/write; restaurant tenant isolation for the future dashboard; no mass assignment; audit log for sensitive mutations.
- *Receipts:* QR payload must be signed/tokenized and verified (ideally against the POS); a receipt (and each item) can be claimed **once globally** (database unique constraint); validate amount, timestamp, eligible items; reject cancelled/refunded/expired; keep an audit log; unverifiable receipts go to a review queue.
- *Ledger:* append-only `wallet_transactions`; balance = sum of confirmed rows, pending separate; states pending/confirmed/cancelled; reversal and expiry are new rows (never edit); **every row records its source restaurant** (the universal wallet still needs per-restaurant accounting and reconciliation); unique constraints + an idempotency table (key + user → stored response) so a replay after a lost response returns the same result; atomic transactions and concurrency-safe balance checks (row locks or serializable isolation); integer minor units only; reward eligibility requires `phoneVerified` when `requirePhoneVerification` is true (server-enforced); cashback amounts computed only on the server.
- *Fraud signals to monitor:* many accounts per device/IP, scan velocity, rating patterns, bulk new phones, repeated unsupported scans; a reconciliation job against restaurant/POS records.
- *Comments:* shown to restaurants without name or phone; abuse handling/moderation process (check whether Google Play's user-generated-content policy applies).
- *Operations:* request validation, size limits, parameterized queries, standardized errors with request id, health checks, graceful shutdown, safe migrations (expand/contract so older app versions keep working), encrypted backups with a **tested restore**, defined RPO/RTO, alerts on auth failures, error rates, abnormal transaction behavior, DB performance and background jobs.
- *Reviewer access:* a whitelisted store-review test account with a fixed OTP and a demo receipt code, isolated from real payouts, documented for Google Play "App access".

**Open business decisions (list at the top of API_CONTRACT.md; do NOT decide in code):** 1) who funds cashback and how restaurants settle when one wallet can be spent anywhere; 2) where/how the balance can be spent (defines the missing redeem screens; require step-up authentication then); 3) when pending becomes confirmed, and expiry rules; 4) whether a universal spendable balance is regulated in Azerbaijan (lawyer); 5) how POS/receipt systems produce compatible QR codes and the onboarding effort per restaurant; 6) what happens to the balance when an account is deleted.

**Micro-steps:** 26.a conventions + errors · 26.b OpenAPI for auth/user/config · 26.c OpenAPI for restaurants/receipts/feedback/wallet/notifications · 26.d `BUSINESS_RULES.md` (MUST list above) · 26.e open decisions + reviewer access plan · 26.f fixtures-vs-schema contract test.

**MANUAL CHECK:** Aziz sends the three docs to the backend teammate; they confirm they can start.

---

## STEP 27 — Legal and store-readiness documents  (branch `step/27-legal-store`)

These are **inputs for a lawyer and for the stores**, not final legal texts. Do not copy generic policies.
- `docs/DATA_INVENTORY.md`: a table of every data item the app/backend handles — phone, name, email, birth date, language, Google account id, receipt data (restaurant, items, amounts, time), feedback ratings/comments, wallet ledger, push token, IP/request logs, crash reports — with purpose, where stored, who can access, retention, deletion behavior, protection (encryption in transit/at rest).
- `docs/LEGAL_TODO.md`: Privacy Policy, Terms of Service, Rewards/Cashback Terms, account deletion & retention policy, restaurant agreements, vendor data-processing agreements, security-incident procedure, open-source license review, trademark permissions (LEG-2); plus lawyer questions: cashback classification, Azerbaijan personal-data law (consent, registration, cross-border transfer and hosting location), consumer/advertising rules, minimum age.
- `docs/INCIDENT_RESPONSE.md`: who does what in an outage or breach, how to revoke sessions/keys, how to notify users and authorities, rollback steps.
- Store readiness (feeds STEP 29): listing text AZ/EN/RU, screenshots plan (real builds, no fake data visible), Data safety answers draft (collected: phone, name, email, birth date, feedback, wallet transactions, crash reports; no ads, no tracking, no data sale; encrypted in transit; deletion available), a **web page spec for account-deletion requests** (Google Play requires a public deletion URL as well as in-app deletion — verify the current policy), reviewer access plan from STEP 26.

**Micro-steps:** 27.a data inventory · 27.b legal TODO + lawyer questions · 27.c incident response · 27.d store-readiness drafts.

**MANUAL CHECK:** Aziz reviews the inventory for anything that is missing or wrongly described.

---

## STEP 28 — Performance pass  (branch `step/28-performance`)

Measure on a **low-end Android release build** and on Aziz's phone; write numbers into `docs/PERF_REPORT.md` (before → after). Targets: cold start < 2.5 s, tab switch < 150 ms, 60 fps lists and sheet drag, no frame drops in Scan → Receipt → Rate → Done.
Checklist: Hermes on; bundle analyzed and unused libraries removed; routes lazy so the camera module loads only on scan; FlashList everywhere with correct item sizes; no animated layout properties in lists; images at exact size with stable placeholders (flat color, no blur); no console.log in release; no transparent overlays left mounted; camera unmounted when not focused; React Query persistence only for wallet/transactions; startup path matches PERF-1 (verify the order of work at launch); memory over a long session; backgrounding/foregrounding and process-kill recovery; battery/network sanity.
Fix only what measurements show. No premature memoization.

**Micro-steps:** 28.a baseline measurements · 28.b bundle/startup fixes · 28.c list/animation fixes · 28.d memory/lifecycle checks · 28.e final numbers.

**MANUAL CHECK:** Aziz uses the app for 10 minutes on the low-end phone: no stutter.

---

## STEP 29 — Release and release gate  (branch `step/29-release`)

- EAS `production` builds an AAB; a Google Play submit profile (service-account key in EAS secrets, never in git).
- `docs/RELEASE_ANDROID.md`: developer account verified; app created; Play App Signing ON → copy the Play signing SHA-1 into the Google Cloud Android OAuth client; store listing; privacy policy URL live; Data safety form; account deletion in-app + public URL; content rating; target audience (not for children); **Internal testing first**; check Google's current requirements for new developer accounts (closed-testing period/testers) before planning production; target API level; staged rollout with halt/rollback steps; EAS Update rollback.
- `docs/RELEASE_GATE.md`: the production-readiness checklist below. **Release is blocked while any critical item is unchecked.**

**Security:** [ ] no secrets in the app · [ ] sessions in SecureStore only · [ ] backend authorization and restaurant isolation verified · [ ] validation and rate limits live · [ ] security testing done (backend).
**Financial integrity:** [ ] server-only cashback · [ ] duplicate-receipt prevention verified · [ ] concurrency-safe ledger verified · [ ] refunds/reversals handled · [ ] reconciliation and fraud monitoring running.
**Reliability:** [ ] unit + component + E2E pass · [ ] offline and network-failure tests pass · [ ] real-device matrix verified (small, normal, large, low-end Android) · [ ] no known critical crash or data-loss bug · [ ] backup restore tested.
**Legal:** [ ] Privacy Policy, Terms, Rewards Terms reviewed by a lawyer · [ ] data protection implemented · [ ] account deletion works (app + web URL) · [ ] store policies reviewed · [ ] cashback regulation and restaurant agreements reviewed.
**Operations:** [ ] CI/CD green · [ ] crash monitoring live · [ ] rollback tested · [ ] incident roles assigned · [ ] store materials ready.
**Final principles:** the client is never trusted for money; every important request is validated and authorized on the server; financial operations are atomic, idempotent and auditable; abnormal conditions are tested, not only happy paths; **never publish with an unresolved critical security, financial-integrity or data-loss defect.**

**Micro-steps:** 29.a EAS production + submit profile · 29.b `RELEASE_ANDROID.md` · 29.c `RELEASE_GATE.md` · 29.d internal-testing build installed from Google Play and walked through (sign in with Google, scan a staging receipt, rate, see the wallet) · 29.e staged-rollout plan.

**MANUAL CHECK:** the internal-testing install from Google Play (not a local APK) completes the whole flow.

---

# LATER (do NOT build now; keep the code paths ready)

1. **Apple sign-in and iOS** — join the Apple Developer Program, build with EAS cloud builds (iOS cannot be built on Windows), set `ENABLE_APPLE_SIGNIN=true`, add the Sign in with Apple capability, backend Apple token verification and revoke on deletion (required because the app offers Google sign-in), Google iOS client + URL scheme, check design on small and large iPhones, TestFlight, App Store review.
2. **Redemption/spending** — only after the business decisions in STEP 26; needs step-up authentication and concurrency-safe ledger operations.
3. Restaurant detail screen, real push notifications, biometric step-up, Play Integrity signals for fraud, product analytics (only with consent, minimal, no heavy SDK).

---

# FINAL RULES (repeat to yourself every session)

1. One micro-step → check → commit → push → one status line. No batching, no skipping.
2. Stop at the end of every STEP and wait for `next`. Merge only on `merge`.
3. Never invent business rules. Ask one precise question instead.
4. Never weaken a check to make it pass. Never force-push. Never commit secrets.
5. Keep it light: startup path minimal, bundle small, animations on the UI thread.
6. The client displays; the server decides.

**— END OF MASTER PROMPT —**
