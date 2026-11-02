# Epsilon progress

## Auth entry completion — 2026-11-02

Scope: Welcome, dedicated Login/Sign Up, existing Phone/OTP/Google connections,
and the shared offline banner. Completed roadmap history remains preserved.
Branch: `design/auth-completion`, recovered from remote
`step/28-29-final-release` at `f7999c6` (newer than `a25d1f0`).
The clean local main was behind; no local work was overwritten or reset.
Owner workflow: targeted checks per unit, full unchanged quality gate at completion.

- [x] auth.1 — Recovery, contract review and localized entry copy. Baseline lint/strict TypeScript and 20 targeted phone/component tests pass; source CI green.
- [x] auth.2 — Dedicated Login/Sign Up connected to existing auth operations.
  - [x] auth.2.1 — Reuse the existing phone entry logic; 14 auth journey tests pass.
  - [x] auth.2.2 — Guarded entry routes, shared Google/link controls and auth surface support; strict TypeScript and 11 Screen/Google tests pass. Browser uses system typography.
  - [x] auth.2.3 — Distinct entry screens and fail-closed email state; strict TypeScript and 22 existing auth/Google tests pass. Remote push retry pending transient connectivity.
  - [x] auth.2.4 — Nine new entry tests cover both intents, phone/Google routing, cross-links, disabled Google, direct Back and fail-closed email.
  - [x] auth.2.5 — Owner's attached reference: centered blue headings, rounded controls, deliberate form spacing; unsupported email controls removed. Phone/OTP/Google unchanged; 23 targeted tests and strict TypeScript pass.
- [x] auth.3 — Open-canvas Welcome and entry navigation tests.
  - [x] auth.3.1 — Removed enclosing Welcome card and generic feature rows; real logo and concise localized headline. Three Welcome tests pass.
  - [x] auth.3.2 — Welcome Login/Sign Up choices, blue headline and rounded primary/neutral secondary controls; nine Welcome/Button tests pass.
  - [x] auth.3.3 — Real-router Welcome/Login/Sign Up/Back and legacy phone redirect tests pass (4 tests); new entry links are scheme-validated.
- [x] auth.4 — Restrained offline banner and reconnect verification. Three tests pass, including unknown connectivity, online manager recovery and timed dismissal.
- [ ] auth.5 — Visual/accessibility audit, full gate, Android export and remote verification.

Email: **EMAIL AUTH BACKEND SUPPORT REQUIRED**. The canonical OpenAPI and
`AuthService` expose phone OTP and Google, with no email authentication operation.
Login and Sign Up express intent; account identity/provisioning and `nextStep`
remain server-owned. No invented endpoint, password or client account creation.

- [x] web.svg.1 (2026-11-01) — fixed native SVG accessibility props leaking into
      browser DOM across shared icons, rating/review stars and Google artwork.
      Browser uses `aria-hidden`; native hidden/focus semantics remain unchanged.
      Actual React DOM regression passes without console warnings; complete quality
      gate: 94 suites / 563 tests. Local web bundle resolves the browser adapter.

Scope: **30 / 30 STEPS IMPLEMENTED — 100% engineering implementation.** STEP 00-27 are merged into `main`; STEP 28-29 repository work and whole-app audit are complete on the final branch. External/manual verification is separate and remains honestly unchecked below.
Branch: `step/28-29-final-release`, based on verified `main` merge `08c734fc3513df1c05680e474b7afa42156b1968`.
Release readiness/public launch approval: **NO-GO**; ten P0 evidence groups remain unresolved. See `FINAL_AUDIT.md`, `QA_MATRIX.md`, `RELEASE_GATE.md` and `release-evidence.json`.

A checked item is complete only after its commit reaches GitHub.

Earlier STEP 05-07 recovery (2026-10-31): fetched/pruned all remote branches and verified their tips.
No remote STEP 05-07 branch existed; `origin/main` (`8bdf92e`) contains the furthest
pushed implementation (STEP 04 complete). Local `main` was fast-forwarded to that
commit before creating this batch branch. Older uncommitted STEP 01 work on this
PC was inspected and preserved, including untracked files, in the named stash
`main-pc-preservation-step01-before-github-recovery-2026-10-31`. It was not merged.

Current authorization completed: recover GitHub, merge STEP 26-27 into main, implement STEP 28-29 and audit STEP 00-29 on the final branch. Keep this branch separate from main; STOP after the pushed final recovery point and hosted CI verification. No public submission, publishing, OTA, deployment, credential creation or new phase is authorized.
Animated logo/splash work is explicitly postponed.
Manual Android/device checks remain pending and do not block implementation.

## STEP 00

- [x] 00.a — Git preflight: confirm repo, `origin`, branch `main`; create `.gitignore` (node_modules, `.env*` except `.env.example`, build output, `*.keystore`, `*.jks`, `*.p8`, `*.pem`); first commit; verify `git push` works. If not: stop and tell Aziz what to run.
- [x] 00.b — Split this file into `docs/steps/NN-name.md` (one file per STEP, plus `docs/steps/PART0-1-2-3.md` for protocol/context/standards/structure). Create `docs/PROGRESS.md` (a checklist of every micro-step in this file, unchecked) and a short `CLAUDE.md`: "Read docs/PROGRESS.md and the current step file. Follow PART 0 loop and PART 2 standards (docs/steps/PART0-1-2-3.md). Android first. One micro-step at a time." Commit and push.
- [x] 00.c — Create the Expo project (TypeScript, Expo Router) in the repo root. Pin exact versions. Confirm it starts.
- [x] 00.d — `tsconfig` strict + `noUncheckedIndexedAccess` + path aliases (`@/…` → `src/…`). ESLint (no-explicit-any, react-hooks, import rules for dependency direction, `import/no-cycle`), Prettier, Husky + lint-staged (eslint + prettier on staged files). Scripts: `lint`, `typecheck`, `test`, `i18n:check` (placeholder), and `check` = all of them.
- [x] 00.e — Create the folder skeleton from PART 3 (use `.gitkeep`; no screens yet).
- [x] 00.f — `src/lib/env.ts` with Zod: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_MODE` (`mock|live`), `EXPO_PUBLIC_APP_ENV` (`development|staging|production`), `EXPO_PUBLIC_MIN_AGE` (default 16), `EXPO_PUBLIC_SUPPORT_EMAIL`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `ENABLE_GOOGLE_SIGNIN`, `ENABLE_APPLE_SIGNIN` (default false). Throw on invalid values. Build guards (SEC-9): production forbids `mock` mode and non-production URLs. `.env.example` documents everything.
- [x] 00.g — `app.config.ts` (Android first): name "Epsilon", slug `epsilon`, scheme `epsilon`, package from env (default `com.epsilonup.app`, TODO confirm), portrait only, light UI style, New Architecture on, adaptive icon (foreground/background/monochrome), edge-to-edge, `softwareKeyboardLayoutMode` resize, permissions only CAMERA (SEC-8, `allowBackup` false, cleartext off), plugins: expo-router, expo-camera, expo-secure-store, expo-localization, expo-splash-screen, expo-build-properties (minify release), `runtimeVersion` policy per OPS-3. Add `expo-dev-client`. `eas.json` profiles: `development` (dev client, APK), `preview` (internal), `production` (AAB, autoIncrement), with update channels.
- [x] 00.h — Write `AGENTS.md` (copy to `.cursor/rules/epsilon.mdc`): a compact (≤ 40 lines) summary of PART 0.1, the SEC/NET/PERF/REL one-liners, "tokens not literals", "i18n not literals", "money via `lib/money`", "no `any`", and "read docs/PROGRESS.md first". Keep it short because it is loaded every session.
- [x] 00.i — `docs/DEV_SETUP.md`: Windows setup (Android Studio, emulator image with Google Play, USB debugging), `eas build --profile development --platform android`, `npx expo start --dev-client`, how to rebuild the dev client.
- [x] 00.j — CI later in STEP 25; for now add a minimal GitHub Actions workflow running `npm ci` and `npm run check`.

## STEP 01

- [x] 01.recovery — Recover pushed branch; align Node prerequisites/CI and enforce LF on Windows.
- [x] 01.a — tokens + theme + typography + motion
- [x] 01.b — Text, Icon, Screen, Header
  - [x] 01.b.1 — Text: system typography, token tones, unrestricted font scaling and native accessibility props.
  - [x] 01.b.2 — Approved pinned icon/haptics/component-test dependencies; Android VIBRATE blocked (SEC-8).
  - [x] 01.b.3 — Lucide Icon: labeled/decorative modes, stroke 2, modular imports; RNTL 14 tests.
  - [x] 01.b.4 — Header: wrapping heading and caller-owned action slots; accessibility/navigation tests.
  - [x] 01.b.5 — Screen: safe area, dark status bar, centered 480pt column, keyboard handling and fixed footer.
  - [x] 01.b.6 — Measured large-title collapse/restore with a single accessible heading; 01.b complete.
- [x] 01.c — Button, IconButton (+ tests)
  - [x] 01.c.1 — Shared press surface: native scale, Reduce Motion, Android ripple/permission-free haptics and blocked states.
  - [x] 01.c.2 — Button: primary/secondary/ghost/destructive, wrapping labels, stable loading width and busy-state repeat-press test.
  - [x] 01.c.3 — 44pt IconButton with named action, decorative glyph and blocked loading state; 01.c complete.
- [x] 01.d — ListRow, Card, Chip, Switch, SegmentedControl
  - [x] 01.d.1 — Flat hairline Card and static/interactive Chip with text labels and visible selection marks.
  - [x] 01.d.2 — Controlled Switch with checked/disabled states and change tests.
  - [x] 01.d.3 — SegmentedControl: radio semantics, visible selection mark, no callback when reselecting the current option.
  - [x] 01.d.4 — ListRow: 40pt leading circle, wrapping details/value, optional action chevron and inset hairline; 01.d complete.
- [x] 01.e — Input (+ tests): wrapping labels/errors, native input/ref props, 56pt minimum, font scaling, focus/disabled styles and draft-preservation tests.
- [x] 01.f — Amount and integer-only lib/money formatter, signed values, 60% currency glyph and spoken-label override; basic money tests included, STEP 04 integration remains pending.
- [x] 01.g — Skeleton, EmptyState, ErrorState, Toast
  - [x] 01.g.1 — Flat native-driver Skeleton pulse; Reduce Motion defaults to still until the OS preference resolves.
  - [x] 01.g.2 — EmptyState and ErrorState: wrapping copy, decorative icon, optional action and accessible retry alert.
  - [x] 01.g.3 — Toast: polite alert, named dismissal, native opacity/Reduce Motion; queue/provider remains STEP 21; 01.g complete.
- [x] 01.h — dev gallery route
  - [x] 01.h.1 — Matching AZ/EN/RU gallery copy and typed, AZ-default preview resources; production i18next remains STEP 04.
  - [x] 01.h.2 — Gallery control samples: interactive selections/input, button states, rows and icons.
  - [x] 01.h.3 — Gallery amounts, loading/empty/error states and interactive retry/Toast samples; no network/product data.
  - [x] 01.h.4 — Dev-only gallery route/startup, safe-area preview, typography and instant AZ/EN/RU switching; production redirect test.
  - [x] 01.h.5 — Android development export and Expo dependency validation; block template storage/overlay permissions and verify generated manifest removal rules (SEC-8).

01.h.4 verification: 133 tests pass; Android Hermes release export 2,477,897 bytes
versus 2,477,278-byte bootstrap baseline (+0.025%). English gallery copy/sample
markers are absent from bytecode. Device rendering/performance remains not verified.

01.h.5: Development Android export compiles all gallery samples (1,447 modules).
Expo dependency validation passes. Introspection confirms allowBackup/cleartext
false, CAMERA plus required INTERNET, and removal rules for VIBRATE, storage and
overlay permissions. This is generated app-manifest validation; a compiled APK's
merged manifest/device behavior remains STEP 22/manual verification.

- [x] 01.i — `docs/DESIGN_SYSTEM.md`, component contracts, Windows runtime commands, verification evidence and pending manual gate.

- [x] 01.review.1 — Contrast review: use ink for helpers/subtitles on gray; secondary gray remains white-surface-only (4.76:1). Added WCAG text-pair guards without changing the prescribed palette.

## STEP 02

- [x] 02.a — root layout + providers + splash gate
  - [x] 02.a.1 — Merge STEP 01 (`8771325`), create this branch, and pin owner-approved navigation dependencies; generated lockfile is outside the handwritten line budget.
  - [x] 02.a.2 — Single-flight SecureStore boot reader; strict stored-session validation, retry and cache-release tests; server owns expiry.
  - [x] 02.a.3 — Navigation and bootstrap copy in AZ/EN/RU; matching-key tests.
  - [x] 02.a.4 — AZ-default i18n boot plus Theme/I18n/Query/Auth foundation; server profile hydration remains the later service/auth integration.
  - [x] 02.a.5 — Global Toast host after Auth; safe-area positioning, localized dismissal and provider integration test.
  - [x] 02.a.6 — Deferred native connectivity banner/Query online manager, safe-area placement and no HTTP reachability probes; full reconnect choreography remains STEP 21.
  - [x] 02.a.7 — Splash gate waits for i18n/local auth restoration, reveals only after layout, and recovers from boot errors; tests cover both paths.
  - [x] 02.a.8 — Root safe-area/bootstrap wiring, global native splash retention and 200ms fade; failed i18n initialization can retry. 02.a complete.
- [x] 02.b — route skeleton with stubs and typed routes
  - [x] 02.b.1 — All specified title-only route stubs and auth/onboarding layouts; localized accessible headings, tab-owned bottom insets.
  - [x] 02.b.2 — Native stack presentations, transparent Sheet modals and 150ms tab fades with Reduce Motion; scan remains an external modal.
  - [x] 02.b.3 — Expo-generated route types on every typecheck, including fresh CI; compile-time unknown-route/missing-ID guards. 02.b complete.
- [x] 02.c — TabBar + center button
  - [x] 02.c.1 — Center Scan action: native-driver 0.94 spring, haptics, focus-reset repeat-press guard and modal-push test.
  - [x] 02.c.2 — Accessible tab items: selected state, decorative glyphs and 64pt minimum; inactive labels use secondary on white for UX-1 contrast, icons retain inkMuted.
  - [x] 02.c.3 — Fixed white/hairline tab bar, raised Scan target, safe-area/font-scale height handling and real-router modal/return integration test. 02.c complete.
- [x] 02.d — Sheet + transparent-modal wiring
- [x] 02.e — bootstrap redirect + deep-link param schemas (+ tests)
- [x] 02.f — Back-button behavior. STEP 02 complete.

## STEP 03

- [x] 03.a — contracts
- [x] 03.b — client + errors + idempotency (+ tests)
- [x] 03.c — refresh single-flight (+ tests)
- [x] 03.d — service interfaces
- [x] 03.e — mock implementations + fixtures + contract tests
- [x] 03.f — dev scenario menu
- [x] 03.g — query defaults + key factories. STEP 03 complete.

## STEP 04

- [x] 04.a — i18n setup + 3 locale files + language persistence
- [x] 04.b — `i18n:check` script wired into `check`
- [x] 04.c — money (+ tests: 0, 5, 100, 123456, negatives)
- [x] 04.d — date (+ tests)
- [x] 04.e — plurals. STEP 04 complete.

## STEP 05

- [x] 05.a — layout + strings
- [x] 05.b — buttons (Google official style, phone primary) + flags
- [x] 05.c — legal links caption
- [x] 05.d — motion + a11y labels ("Google ilə davam et", "Telefon nömrəsi ilə davam et") + test.

## STEP 06

- [x] 06.a — phone schema + formatter (+ tests)
- [x] 06.b — `PhoneField`
- [x] 06.c — screen + keyboard-safe button
- [x] 06.d — request mutation + errors
- [x] 06.e — a11y + test.

## STEP 07

- [x] 07.a — `OtpInput` + `ResendTimer` (+ tests)
- [x] 07.b — screen + verify mutation
- [x] 07.c — error states + shake
- [x] 07.d — session save + routing by `nextStep` (+ tests)
- [x] 07.e — a11y.

## STEP 08

- [x] 08.a — plugin/config + env gating + docs
- [x] 08.b — `useGoogleSignIn` hook (+ tests)
- [x] 08.c — wire the Welcome button
- [x] 08.d — error messages
- [x] 08.e — session + `nextStep` routing
- [x] 08.f — logout integration.

## STEP 09

- [x] 09.a — schema + age rule (+ boundary tests: exactly MIN_AGE allowed, one day short blocked)
- [x] 09.b — form fields
- [x] 09.c — date picker
- [x] 09.d — submit + routing
- [x] 09.e — a11y.

## STEP 10

- [x] 10.a — phone-verify entry screen
- [x] 10.b — code screen
- [x] 10.c — PHONE_IN_USE sheet
- [x] 10.d — skip/banner logic by config
- [x] 10.e — resume-at-step tests.

## STEP 11

- [x] 11.a — `useWallet` + `useWalletTransactions` hooks (+ tests)
- [x] 11.b — shared `TransactionRow`
- [x] 11.c — Home layout + strings
- [x] 11.d — states (skeleton/error/offline)
- [x] 11.e — count-up + motion
- [x] 11.f — a11y + test.

## STEP 12

- [x] 12.a — hook + keys + infinite query (+ tests)
- [x] 12.b — list + row
- [x] 12.c — search + debounce
- [x] 12.d — states + strings.

## STEP 13

- [x] 13.a — state machine (+ tests)
- [x] 13.b — permission screens
- [x] 13.c — camera + overlay + scan line
- [x] 13.d — resolve call + success/lock
- [x] 13.e — error cards
- [x] 13.f — manual-entry sheet
- [x] 13.g — lifecycle (focus/background) + a11y.

## STEP 14

- [x] 14.a — hook + initial data (+ tests)
- [x] 14.b — header + items list
- [x] 14.c — status/read-only logic
- [x] 14.d — footer + rewardHint
- [x] 14.e — a11y.

## STEP 15

- [x] 15.a — outbox module (+ tests)
- [x] 15.b — star rating component + labels
- [x] 15.c — reason chips + comment
- [x] 15.d — submit mutation + idempotency + outbox wiring
- [x] 15.e — error/dismiss-confirm flows
- [x] 15.f — retry on start/foreground
- [x] 15.g — a11y.

## STEP 16

- [x] 16.a — layout + three reward variants (+ tests)
- [x] 16.b — motion + haptic
- [x] 16.c — navigation rules.

## STEP 17

- [x] 17.a — date grouping util (+ tests)
- [x] 17.b — hero + pending chip
- [x] 17.c — history list + sticky headers
- [x] 17.d — row variants (+ tests)
- [x] 17.e — states + empty
- [x] 17.f — foreground refetch + a11y.

## STEP 18

- [x] 18.a — sheet + rows + omit-null logic (+ tests)
- [x] 18.b — copy + toast
- [x] 18.c — refresh + states.

## STEP 19

- [x] 19.a — identity block
- [x] 19.b — grouped rows + routes
- [x] 19.c — logout flow + full cleanup (+ test that nothing remains)
- [x] 19.d — version footer + a11y.

## STEP 20

- [x] 20.a — personal info
- [x] 20.b — my reviews
- [x] 20.c — notifications + permission flow
- [x] 20.d — language
- [x] 20.e — privacy links + crash toggle
- [x] 20.f — delete flow with re-auth (+ tests)
- [x] 20.g — help.

## STEP 21

- [x] 21.a — OfflineBanner + online manager
- [x] 21.b — ErrorBoundary + test (throw in a child)
- [x] 21.c — toast queue
- [x] 21.d — not-found + session expiry
- [x] 21.e — update gate
- [x] 21.f — BAD_RESPONSE + clock tests.

## STEP 22

- [x] 22.a — manifest/permission audit script + result
- [x] 22.b — fixes found
- [ ] 22.c — TalkBack and font-scale pass with fixes
- [x] 22.d — write `docs/ANDROID_AUDIT.md`.

## STEP 23

- [x] 23.a — decision + install + config plugin
- [x] 23.b — deferred init + env gating
- [x] 23.c — scrubber (+ tests)
- [x] 23.d — toggle integration
- [x] 23.e — source map upload in EAS
- [ ] 23.f — startup measurement recorded in `docs/PERF_REPORT.md`.

## STEP 24

- [x] 24.a — missing unit tests per the list
- [x] 24.b — coverage thresholds in CI
- [x] 24.c — Maestro setup + flow 1
- [x] 24.d — flows 2–5
- [x] 24.e — scenario table in `docs/QA_CHECKLIST.md`.

## STEP 25

- [x] 25.a — PR workflow
- [x] 25.b — audit/license/secret scan
- [x] 25.c — guard script (+ test)
- [x] 25.d — bundle report
- [x] 25.e — Dependabot + PR template + CHANGELOG
- [x] 25.f — manual EAS workflows
- [x] 25.g — docs.

## STEP 26

- [x] 26.a — conventions + errors
- [x] 26.b — OpenAPI for auth/user/config
- [x] 26.c — OpenAPI for restaurants/receipts/feedback/wallet/notifications
- [x] 26.d — `BUSINESS_RULES.md` (MUST list above)
- [x] 26.e — open decisions + reviewer access plan
- [x] 26.f — fixtures-vs-schema contract test.

## STEP 27

- [x] 27.a — data inventory
- [x] 27.b — legal TODO + lawyer questions
- [x] 27.c — incident response
- [x] 27.d — store-readiness drafts.

## STEP 28

- [ ] 28.a — physical release-device baseline measurements pending; recovered no-map Hermes baseline recorded (6,107,845 bytes).
- [x] 28.b — bundle/startup fixes; dev fixtures excluded, native modules deferred, bounded wallet-only persistence.
- [x] 28.c — list/animation source pass; FlashList/image sizing retained, hidden overlays and animation cleanup fixed. Physical 60fps proof pending.
- [x] 28.d — source lifecycle cleanup and regression checks; offline/language/account/late-response cases pass. Ten-minute physical memory/battery session pending.
- [ ] 28.e — physical final timing/frame/memory numbers pending; verified final no-map Hermes 6,095,278 bytes (-0.21%) recorded.

## STEP 29

- [x] 29.a — production AAB + draft internal submit profile; separate live staging AAB profile. Credentials/artifact remain external.
- [x] 29.b — `RELEASE_ANDROID.md`
- [x] 29.c — `RELEASE_GATE.md` and tested fail-closed executable evidence gate.
- [ ] 29.d — internal-testing build installed from Google Play and walked through (sign in with Google, scan a staging receipt, rate, see the wallet)
- [x] 29.e — staged rollout/update halt/native recovery/OTA safety plan; first publication uses controlled testing, not percentage rollout.

## Verification log

- 00.a: canonical origin and initial main commit verified; ignore-rule checks and Git whitespace checks passed; pushed `1aafb5c` and verified remote hash.
- 00.b: source copy matches byte-for-byte; 30 step files and all micro-step IDs checked against the source; Git whitespace checks passed. No package scripts exist yet.
- Device testing: not verified.

Historical STEP 11-12 checkpoint: STEP 00-10 were merged into main (`4dd5f82`),
STEP 11-12 were on the batch branch, and STEP 13 onward was specification-only.
The current scope at the top and subsequent batch entries supersede this history.

- 01.a: Design tokens, theme, typography, and motion (`resolveMotion` / `useMotion` for Reduce Motion). 83 tests pass.

- 00.c: TypeScript, Expo version check, CLI schema compatibility tests, and npm audit --omit=dev --audit-level=high pass. Metro HTTP status verified; Android Hermes export succeeds (2477278 bytes baseline). Direct dependency licenses MIT/Apache-2.0 verified. Seven low-severity transitive tooling audit findings documented in decisions/0001-bootstrap-dependencies.md. Device launch not verified.

## STEP 00.d substeps

- [x] 00.d.1 Strict TypeScript, import boundaries and Prettier. All available checks passed on resume: lint, typecheck, format:check, CLI compatibility, Expo dependency validation, Git whitespace check.
- [x] 00.d.2 Jest and combined verification scripts. Full npm run check passes, including two tooling tests. Test dependencies are development-only (no release bundle impact).
- [x] 00.d.3 Husky and lint-staged. Full check passes; installed hook rejects an intentionally invalid staged TypeScript fixture. Hook dependencies are development-only, MIT licensed, with no release bundle impact.

- 00.e: All 49 PART 3 skeleton directories verified with .gitkeep files; no additional routes or feature implementations. Full npm run check passes. No runtime bundle impact.

## STEP 00.f substeps

- [x] 00.f.1 Production URL guard and 43 URL cases; full check passes (45 total tests). Zod 4.6.6 pinned (MIT, 6,148,944 unpacked bytes; app bundle impact measured when wired).
- [x] 00.f.2 Strict environment schema and tests. 24 test cases pass (69 total across suites); full check passes.
- [x] 00.f.3 Environment documentation and build validation entry point. .env.example documents all variables, production guards, and production URL TODO; validateEnv, getEnv, env proxy, and tooling tests pass (72 total tests).

- 00.f: Strict environment validation schema with Zod, production URL guard (SEC-9), build guards forbidding mock mode and non-production URLs in production, .env.example documenting all configuration variables and production domain TODO, and build/runtime validation entry points. All 72 tests pass.

## STEP 00.g substeps

- [x] 00.g.1 Pinned Expo SDK 58 native modules (DEP-1, DEP-2): expo-camera 58.0.14, expo-secure-store 58.0.2, expo-localization 58.0.5, expo-splash-screen 58.0.12, expo-build-properties 58.0.11, expo-dev-client 58.0.17. All MIT licensed, npm audit passes.
- [x] 00.g.2 app.config.ts Android configuration and build plugins. Android-first setup, CAMERA-only permissions, allowBackup false, cleartext off, and Hermes release minification verified (73 total tests).
- [x] 00.g.3 eas.json profiles and update channels. Validated development (APK), preview (internal), and production (AAB) profiles with update channels; tooling test passes (74 total tests).

- 00.g: Dynamic Android-first app.config.ts with CAMERA permission, allowBackup false, cleartext off, Hermes release minification, runtimeVersion policy, and eas.json development (APK), preview (internal), and production (AAB) profiles with update channels. Android export and all 74 tests pass.
- 00.h: Created compact AGENTS.md and .cursor/rules/epsilon.mdc (20 and 26 lines, <= 40 lines limit) summarizing loop, core pillars, and implementation invariants. All 75 tests pass.
- 00.i: Created docs/DEV_SETUP.md covering Windows workstation prerequisites, Android Studio SDK and Google Play emulator setup, USB debugging, EAS dev-client builds and installation, and client rebuild rules. All 76 tests pass.
- 00.j: Added .github/workflows/ci.yml running on main and step/** branches with Node 20, npm cache, npm ci, and npm run check. All 77 tests pass.

## STEP 05-07 batch verification (2026-10-31)

- Welcome, phone entry and OTP now use the existing design primitives and AZ/EN/RU
  localization, with shared PhoneField/OtpInput/ResendTimer for STEP 10 reuse.
- Normalized Azerbaijan mobile input; hidden single-field SMS autofill; six-digit
  auto-submit; service-backed request/verify; shared submission guard; masked phone
  in copy, no phone/code route params or query-cache entries.
- Server-relative resend/lockout deadlines survive navigation/backgrounding. They
  are display/interaction guards only; the server decides OTP validity and expiry.
- Invalid/expired/too-many/network/generic and secure-storage failures are handled;
  native-driver error shake, Reduce Motion color flash and permission-free Android
  error haptics. Session persistence precedes authenticated state and nextStep
  routing. Boot sessions hydrate from user/config services, with retry and wired
  single-flight refresh/logout callbacks; tokens are read from SecureStore at boot only.
- Epsilon Design System + Unslop source review completed across spacing, color,
  icons, copy, typography, layout, details, visuals and motion. Standing rule is
  recorded once in DESIGN_SYSTEM.md. No decorative redesign or new visual system.
- Approved expo-web-browser 58.0.7 (MIT, 244,559 unpacked bytes); legal links use
  configured URLs and browser failures are handled. Native dev client rebuild is
  required for the added native module. Google assets are bundled and attributed
  in assets/brand/README.md; Google authentication remains STEP 08. Apple is omitted
  on Android, consistent with the Android-only service contract.
- Known design input: real Epsilon logo/exact brand blue still awaits owner asset;
  Welcome uses a text wordmark and the existing provisional blue.
- Manual verification not performed: small Android keyboard/layout, 1.3x font
  scale, TalkBack, real SMS autofill, legal-link device behavior and low-end startup.
  No production backend/device authentication or APK installation is claimed.
- Final `npm run check`: lint (zero warnings), strict typecheck, 53 suites / 367
  tests, 110 locale base keys across AZ/EN/RU, and repository formatting all pass.
  Git whitespace checks and Expo dependency validation pass.
- Android Hermes release export passes: 5,217,070 bytes versus 5,065,224 bytes at
  recovered `8bdf92e` (+3.0%, below the 10% guard). This is bundle verification,
  not a native build or device performance measurement.
- Expo SDK compatibility validation required existing patch updates: Expo
  58.0.22, build-properties 58.0.12, dev-client 58.0.18, router 58.0.29. All direct
  dependencies, including web-browser, remain exactly pinned. Updated the CLI
  compatibility probe for upstream schema relocation/JSON Schema validation and
  explicit MCP Zod injection; retained every positive and negative validation case
  and the patched-Zod version assertion.
- Production-dependency audit at high severity passes (zero high/critical).
  Existing transitive tooling advisories remain: 1 low / 28 moderate with
  `--omit=dev`; npm recommends breaking SDK downgrades for some findings. No
  forced audit fixes or weakened checks were applied. Further supply-chain work
  remains with the planned dependency/CI audit stages.
- Implementation is ready for review/merge with the manual checks and brand input
  above recorded. No merge into main is authorized or performed in this batch.

## STEP 08-10 batch verification (2026-10-31)

- Recovered GitHub, verified `origin/step/05-07-auth` at `07a3e20`, and left the
  earlier preservation stash untouched. Merged with a merge commit (no squash or
  rewrite), confirmed identical feature-tree content, and pushed `main` at
  `2b115a3`. Created the single `step/08-10-onboarding` branch from that merge.
- STEP 08: original native Google SDK, gated/deferred single configuration, Play
  Services check, silent cancellation, mapped provider/backend/network errors,
  duplicate prevention, backend-only token exchange and nextStep routing. No
  browser OAuth, app-managed authorization-code callback, extra scopes, Apple
  flow, fake auth success, or sensitive logging. User cache is populated only
  from validated server data; native Google sign-out participates in logout.
- STEP 09: react-hook-form + Zod; prefilled names, native birth-date picker,
  default 18 years ago, max today, read-only email, instant AZ/EN/RU language,
  keyboard-safe submission, localized field/server errors and age boundaries.
  Server `/config.minAge` and AGE_RESTRICTED remain authoritative. HTTP Date
  adjusts the display/validation clock; the server still decides all eligibility.
- Profile update boundary supports validated `{user, nextStep}` and legacy User
  responses explicitly. The latter route through the existing resolver using
  server user/config fields. No client money/reward logic was introduced.
- STEP 10: reused phone/OTP/resend components and shared errors/limits/shake.
  Challenges distinguish sign-in from authenticated linking; link endpoints
  update the existing account. PHONE_IN_USE opens the edit/support sheet with no
  automatic account merge. Mandatory verification has no back-to-Welcome or skip;
  optional skip keeps phoneVerified false and shows the Home/Cashback reminder.
  Those routes retain their placeholder content; STEP 11 was not started.
- Guarded Welcome/sign-in, profile, phone linking and finished tabs. Relaunch
  hydrates user/config to resume the right stage; lost in-memory SMS challenges
  resume phone entry. No personal-data drafts or OTPs are persisted.
- Auth cleanup clears secure session, memory token, query data and registered
  Google/OTP state. Serialized secure writes/deletes and flow epochs prevent
  obsolete responses from restoring a logged-out account. Boot token references
  are handed off/released; tokens are read from SecureStore only at boot.
- Public configuration uses Expo-inlined values and manifest flags. The Android
  config plugin validates enabled Google setup and exposes only Play Services.
  Introspection confirms CAMERA/INTERNET, allowBackup=false, cleartext=false and
  removal rules for account/contact/SMS/storage/overlay/vibration permissions.
  This is generated-config verification, not a compiled APK manifest audit.
- Epsilon Design System + Unslop review completed for relevant STEP 05-10 screens,
  forms, error states, sheets, reminders and controls: spacing, color, icons, copy,
  typography, layout, details, visuals, motion. Preserved existing good design;
  the standing rule remains documented once in DESIGN_SYSTEM.md. Real logo and
  exact brand blue remain pending; existing wordmark/tokens are retained.
- Final `npm run check`: lint with zero warnings, strict TypeScript, 58 suites /
  408 tests, 130 locale base keys across AZ/EN/RU, formatting all green. Tests
  cover native Google success/cancel/errors, backend rejection, duplicate and
  late-response guards, profile/age/leap-day validation and submission, linking,
  logout cleanup, mandatory/optional routing and boot resume.
- Final Android Hermes release export: 5,425,609 bytes versus 5,217,070 bytes at
  merged STEP 05-07 (+4.0%, below the 10% guard). Expo dependency validation and
  Git whitespace checks pass. No native APK/AAB build or device timing is claimed.
- Owner-approved, exactly pinned MIT dependencies: Google sign-in 17.0.0
  (182,365 unpacked bytes), datetimepicker 9.2.1 (268,460 bytes, Expo-compatible),
  react-hook-form 7.91.0 (1,639,036 bytes). No unrelated dependency upgrades.
- Production-dependency audit at high severity passes: 0 high/critical, 1 low /
  30 moderate. Two new affected-package entries propagate the existing Expo
  advisory chain through Google/date-picker peers; no new primary SDK auth
  advisory was identified. No forced fixes or incompatible downgrades.
- MANUAL DEVICE QA PENDING. No Android SDK/adb is installed here. Dev client must
  be rebuilt for Google/date-picker/browser native modules. Real Google Cloud
  consent/client/SHA-1 setup and live backend/device sign-in are not verified.
  DEV_SETUP.md records owner configuration and small-device/TalkBack/font-scale,
  SMS, cancel/another-account, phone-in-use, optional skip and kill/relaunch QA.
- Implementation is ready for merge review, with the manual QA/configuration
  and real brand-asset limitations above. No STEP 08-10 merge is performed.

## STEP 11-12 batch verification (2026-10-31)

- Fetched/pruned GitHub, verified completed `step/08-10-onboarding` at `6bbe2f5`,
  merged it into main without conflicts or history rewriting, verified the merge
  tree equals the approved feature tip, and pushed main at `4dd5f82`. Created the
  single `step/11-12-product` branch. The older preservation stash is untouched.
- STEP 11 Home: existing wordmark/bell header, required greeting, universal wallet
  balance, pending chip, one primary Scan action, recent three transactions, empty
  state, cached data/error/retry states and coordinated pull-to-refresh. Scan,
  notifications, cashback and transaction actions use existing routes only.
  No balance card, statistics grid, promotions or new financial rules.
- Wallet hooks share existing query keys, 30-second freshness, GET retry policy,
  cancellation signals and cache cleanup. Their implementation lives in the
  shared hooks layer and is re-exported from cashback/hooks, so Home does not
  import another feature’s internals. App foreground and tab focus refetch stale
  queries; failed refresh keeps cached server values.
- Shared TransactionRow uses server amounts/status/type, explicit signs, locale
  dates, wrapping text and a named action. Balance speech uses whole manat/qepik.
  Count-up is UI-thread presentation using integer formatting: no first-render
  animation, instant updates with Reduce Motion, and instant digit-width changes
  to avoid clipping. Row fades run once; no computed rewards or balances.
- STEP 12 Restaurants: collapsing heading, 48pt search control with clear action,
  300ms debounce, isolated search query keys, cursor pagination, duplicate/cycle
  guards, accessible load-more/retry and FlashList virtualization. No nested
  scrolling, marketplace features, detail links or tappable restaurant rows.
- Restaurant responses validate at the HTTP boundary. Cursor pages and legacy
  arrays normalize to a page contract; search/limit/cursor are encoded through
  the existing GET endpoint. Backend logos use expo-image at 40pt with recycling
  identity and neutral Store fallback. Empty directory, no-match, initial loading,
  page error and cached refresh error states are distinct.
- Existing mocks now use explicitly named demo restaurants and no business logos;
  development mock mode shows a small test-data caption. No live partnership
  claims or production fixtures were added. The required STEP 10 optional-phone
  reminder remains available as a quiet action, not a promotional banner.
- Home and Restaurants passed the Epsilon Design System + Unslop source/component
  review: spacing, color, icons, copy, typography, layout, details, visuals, motion.
  Row skeleton geometry matches the two-line rows; no decorative redesign. The
  standing Unslop rule remains documented once in DESIGN_SYSTEM.md.
- Final `npm run check`: zero-warning lint, strict TypeScript, 62 suites / 423
  tests, 158 locale base keys across AZ/EN/RU and formatting all pass. Targeted
  coverage includes server money/activity, Scan repeat presses, refresh, cache
  preservation, debounced search/clear, empty/error distinction, pagination/search
  isolation, malformed responses and cancellation. No checks were weakened.
- Final Android Hermes release export: 5,608,840 bytes versus 5,425,609 bytes at
  the merged STEP 08-10 baseline (+3.4%, below 10%). Expo dependency validation
  and Git whitespace checks pass. No native APK/AAB build or device timing claim.
- Owner approved FlashList and expo-image additions. Exact MIT pins: FlashList
  2.3.2 (849,050 unpacked bytes; Expo’s compatible patch rather than latest 2.3.3)
  and expo-image 58.0.18 (138,294,160 unpacked bytes). Native APK size is unmeasured;
  the measured JS bundle stays within its guard. No unrelated package upgrades.
- Production-dependency audit at high severity passes: 0 high/critical, 1 low /
  30 moderate, unchanged from the onboarding batch. No forced advisory fixes.
- MANUAL DEVICE QA PENDING: Home pull-to-refresh/layout/count-up/Reduce Motion,
  stale foreground/offline behavior, TalkBack and 1.3x font scale, restaurant
  keyboard/search/clear/pagination/recycling and real backend empty response.
  Dev client rebuild now also needs expo-image. Existing Google Cloud/backend
  verification, real logo/exact blue, and advisory limitations remain documented.
- Ready for merge review with those manual integration/visual checks pending.
  No STEP 11-12 merge is performed. STEP 13 camera/receipt/feedback work is untouched.

## STEP 13-16 batch verification (2026-10-31)

- Fetched/pruned GitHub, verified approved STEP 11-12 tip `0fff998`, merged
  without conflicts/history rewriting, verified the identical merge tree and
  pushed main at `814fe17`. This single batch uses `step/13-16-core-feedback`.
  The older preservation stash is untouched. STEP 17 remains unimplemented.
- STEP 13: explicit permission/Settings/manual-entry recovery, QR-only camera,
  first-candidate lock, bounded opaque input, lifecycle cancellation, localized
  domain errors and success replacement. References travel only in POST bodies;
  no QR parsing, opening, logging, URL parameters or persistent claim storage.
- STEP 14: resolve primes the receipt query cache. FlashList displays exact server
  restaurant/branch/time/items/quantities/prices/total and optional rewardHint.
  Claimed/expired/rated/non-rateable items are read-only. Queued and accepted
  items cannot be submitted again while refreshed server data arrives.
- STEP 15: accessible five-star radios, up to three canonical reason chips,
  optional 500-character comment, dirty-dismiss confirmation, repeat-tap lock,
  inline retry and stable mutation keys. The bounded account-scoped outbox saves
  before POST, retains exact payload/key on ambiguous failures, retries sequentially
  on startup/login/foreground/reconnect, prunes after seven days, caps at 20 and
  removes success/duplicate/validation outcomes. Logout clears every feedback key;
  epochs/cancellation prevent late responses from restoring data across accounts.
- STEP 16: memory-only completion context, confirmed/pending/none reward variants,
  server amount required for confirmed rewards, receipt/home navigation locks,
  no reward or dish-name URL parameters, disabled back gesture and hardware Back
  to Home. Query invalidation refetches receipt, wallet/transactions and feedback;
  no optimistic balances, reward computation or client eligibility decisions.
- Product/security and Epsilon Design System + Unslop source/component reviews
  passed across Scan -> Receipt -> Rating -> Confirmation: spacing, color, icons,
  copy, typography, layout, details, visuals and motion. Existing tokens/Lucide,
  flat rows and concise AZ/EN/RU copy remain authoritative. No decorative financial
  celebration. Reduce Motion is instant; other animations use native/UI-thread
  transform/opacity. The standing design rule remains in DESIGN_SYSTEM.md once.
- Final `npm run check`: zero-warning lint, strict TypeScript, 69 suites / 460
  tests, all 246 locale base keys and formatting pass. Coverage includes scan
  permissions/background/locking/cancellation, opaque POST bodies, exact purchased
  items, draft/dismiss/retry, duplicate prevention, outbox recreation/limits/drop
  rules/logout/account isolation, server reward variants and completion navigation.
- Android Hermes release export passed: 5,716,340 bytes versus 5,608,840 at the
  merged STEP 11-12 baseline (+1.92%, below 10%). No native APK/AAB or device
  performance claim. Expo dependency compatibility and Git whitespace checks pass.
- Owner-approved AsyncStorage 2.2.0 is exactly pinned (MIT; 380,789 unpacked bytes).
  Its two added transitive packages are MIT. No unrelated upgrades. Production
  dependency audit: zero high/critical; existing 1 low / 30 moderate remain.
- MANUAL CAMERA/DEVICE QA PENDING: no adb/Android SDK on this PC. Rebuild the dev
  client for AsyncStorage, then verify camera startup (~400ms), grant/deny/revoke,
  repeated frames, torch, manual input, keyboard/small screens/TalkBack/1.3x fonts,
  Reduce Motion, airplane-mode submit/kill/reopen and all three reward variants.
  Real backend claims/idempotency/rewards and existing Google configuration/brand
  asset limitations still need owner/device verification. See DEV_SETUP.md.
- Ready for merge review with those manual integration/visual checks pending.
  This batch is pushed separately; it is not merged into main.

## STEP 17-20 batch verification (2026-10-31)

- Recovered GitHub, verified approved `be71f3c`, merged STEP 13-16 without
  conflicts/history rewriting, verified the identical tree and pushed main at
  `4582fe1`. One branch: `step/17-20-wallet-profile`; implementation checkpoint
  `5919a9a` is pushed. The older preservation stash remains untouched.
- STEP 17: one universal server wallet, pending amount, cursor-paged FlashList,
  device-local sticky date groups, signed transaction variants, empty/scan,
  skeleton/error/cached/offline/end states and coordinated refresh. Shared wallet
  keys preserve Home consistency and existing feedback invalidation. No balances
  summed from history, invented rewards, optimistic finance or redemption actions.
- STEP 18: authenticated transaction sheet primes from list cache and refreshes
  from the service. Invalid IDs cannot fetch; missing transactions are not
  substituted. Null context is omitted, status remains explicit, references copy
  only after a tap and success toast follows successful native clipboard access.
- STEP 19: current server identity, masked phone/email fallback, restrained grouped
  account/support rows, truthful loaded-review counts (plus suffix if more pages),
  logout confirmation, version and development-only scenario access. Logout clears
  all known SecureStore keys, user/query state, outbox, preferences and Google
  session. Cleanup and another-account isolation are behavior-tested.
- STEP 20: validated name PATCH with retained error drafts; paged read-only review
  history; server-confirmed notification switches with explanation, deferred OS
  permission, one channel and token registration; instant persisted language plus
  explicit backend-sync retry; legal links, local crash consent, account deletion
  and four concise support FAQs. Crash consent is stored for STEP 23; no reporter
  or analytics SDK is added. No logo/splash animation or STEP 21 work is started.
- Deletion requires fresh OTP or Google authentication for the same account,
  then the exact localized typed keyword, then backend DELETE with a stable key.
  Backend deletionWarning is displayed if supplied. Only successful deletion
  triggers Google revoke/sign-out and full cleanup; no client-only substitute for
  server deletion, retention policy or recent-auth enforcement was invented.
- Canonical profile/device/settings paths now use `/me`, `/devices` and
  `/me/notification-settings`. Review read records and two notification booleans
  validate strictly at the boundary; reward results are not fabricated into reviews.
  HTTP 204 is accepted only when the endpoint schema accepts an empty response.
  DEV_SETUP.md records expected projections and pending live-backend verification.
- Product, financial/security and Epsilon Design System + Unslop source/component
  reviews passed: spacing, color, icons, copy, typography, layout, details, visuals,
  motion. Existing primitives, tokens and AZ/EN/RU copy are reused; no decorative
  finance dashboard or social profile. Financial success text uses a darker green
  for contrast. The permanent Unslop rule remains in DESIGN_SYSTEM.md once.
- Final `npm run check`: zero-warning lint, strict TypeScript, 77 suites / 488
  tests, 329 locale base keys and formatting pass. Coverage includes server money,
  cursor cycles/deduplication, cached details, malformed IDs/responses, clipboard
  outcome, profile routes/drafts/persistence, notification consent/denial/late
  tokens, same-account reauthentication and deletion/logout cleanup.
- Android Hermes export passed: 5,922,377 bytes versus the merged STEP 13-16
  baseline 5,716,340 (+3.60%, below 10%). No APK/AAB or 60fps/device timing claim.
  Owner-approved exact MIT pins: expo-clipboard 58.0.4 (268,393 unpacked bytes),
  expo-notifications 58.1.7 (1,541,890 unpacked bytes); added transitives are MIT.
  Expo compatibility passes. Production audit remains 1 low / 30 moderate,
  zero high/critical. No forced or unrelated dependency upgrades.
- MANUAL DEVICE QA PENDING: this PC has no adb/Android SDK. Rebuild the dev client;
  verify notification grant/deny/Settings/channel, clipboard/TalkBack, small-screen
  keyboard/1.3x fonts, long-history 1000-row performance, another-account logout,
  and OTP/Google deletion against a backend enforcing recent authentication.
  Configure the real EAS project and Android push credentials; token registration,
  account/device unlinking, backend projections/retention/deletion and existing
  Google/brand-asset integration are not claimed verified. DATA_INVENTORY.md records
  current storage/cleanup boundaries. Earlier camera/device checks remain pending.
- Ready for merge review with the stated manual/native/backend verification
  pending. The batch is pushed separately and is not merged into main.

## STEP 21–23 batch verification (2026-11-01)

- Fetched the authoritative remote state and merged completed STEP 17–20 into
  main with no conflicts. `origin/main` is verified at `e263782`. This hardening
  batch remains separate; STEP 24 is untouched. The older preservation stash is
  unchanged and was not merged.
- STEP 21: nonblocking offline/reconnect status, FIFO toast queue, recoverable
  error boundary, not-found and single session-expiry navigation; strict semantic
  minimum-version gate and trusted Play Store action. Shared pull-to-refresh
  styling, malformed-response handling, monotonic OTP/rate-limit timing and
  server-anchored outbox TTL protect against a wrong device date. Foreground
  refetch does not rely on device-clock freshness.
- STEP 22: seven configuration checks pass; audit script also accepts a real
  release merged manifest and fails strict native mode without that evidence.
  Missing configured PNG assets were repaired with documented static epsilon
  placeholders, including a monochrome mask and plain-white static splash.
  No approved production logo or postponed logo animation is claimed.
- STEP 23: approved Sentry integration is exactly pinned to Expo-compatible
  8.28.0 (the initially approved 8.33.0 failed Expo compatibility). MIT SDK;
  owner-approved DEP-1 FSL-1.1-MIT build-tool exception covers transitive CLIs
  3.8.0 and 2.58.6. SDK import waits for the first frame, consent and configuration;
  development defaults off. Strict allowlist removes arbitrary payloads and PII.
  Consent revocation/logout disable immediately; only scrubbed JavaScript errors
  are collected. Native fatal capture/caching, replay, tracing and profiling are
  disabled. No actual crash event or source-map upload has run.
- Source-map CI/EAS plumbing and manual upload workflow are configured; final
  Android export produces a valid Debug ID and external map. Live dashboard and
  installed-build symbolication still need owner credentials and preview QA.
- Final code checks: zero-warning lint, strict TypeScript, 82 suites / 510 tests,
  all 337 locale base keys. Formatting is checked after this final documentation
  update. Expo dependency compatibility passes; production audit reports zero
  high/critical, 1 low / 32 moderate. No forced dependency upgrades.
- Bundle limit passes after removing unused SDK entry-point modules and enabling
  Expo's experimental optimizer/tree shaking consistently for release exports,
  CI and preview/production EAS: 6,104,882 Hermes bytes vs 5,922,377 (+3.08%).
  Initial full-entry export failed (+29.60%); no-map final comparison includes
  SDK code even with an empty DSN. Source-map export also passes. See
  PERF_REPORT.md for all measurements and compiler caveats.
- Epsilon Design System + Unslop source/component review completed for modified
  states: spacing → color → icons → copy → typography → layout → details → visuals
  → motion. Existing tokens, accessible controls, localized copy and restrained
  status motion are retained. Permanent requirement remains in DESIGN_SYSTEM.md.
- **22.c and 23.f remain unchecked intentionally:** real 360dp/1.3x-font/TalkBack
  passes and before/after low-end cold-start measurements are NOT VERIFIED.
  ANDROID_AUDIT.md and PERF_REPORT.md record exact remaining checks. No Android
  SDK/adb/phone is available here. Native merged-manifest, keyboard/back/insets,
  SMS autofill, notification and live Sentry dashboard tests remain pending.
  Update the hosted privacy disclosure and vendor retention/access configuration
  before production enablement. Implementation is ready for preview review with
  these explicit verification limits; no native/performance pass is fabricated.

## STEP 24–25 batch verification (2026-11-01)

- Recovered all remote branches; no newer implementation existed beyond
  `d185565`. Merged STEP 21–23 cleanly into main at `1ef24e3` and verified the
  pushed tree. That merge's GitHub CI passed. The preservation stash is untouched.
- STEP 24: reviewed existing high-risk coverage and retained useful tests.
  Added account-switch refresh overlap, delayed old-token 401, logout/late OTP
  lock, committed-but-lost feedback response with stable replay key, one server
  ledger result and real universal-wallet query invalidation. Fixed the two
  refresh races exposed by these tests. No new financial or eligibility logic.
- Coverage now collects unimported services/lib and explicit auth/scan state
  machines, with per-group minimums enforced in `npm run check` and CI. Scan
  thresholds name the machine and hook, not UI animation callbacks. No important
  module is excluded; the native SDK adapter remains an explicit preview QA gap.
  Overall: lines 83.11%, statements 80.68%, branches 71.69%, functions 76.61%.
  Services lines 75.04%; lib lines 91.99%; auth challenge store 100%.
- Five Maestro flows are authored and YAML-validated: mock Google onboarding to
  feedback/wallet/logout; wrong/expired/correct OTP; scan errors/permissions;
  offline kill/replay; reauthenticated deletion. Device execution is NOT VERIFIED.
  The opt-in seam requires development + mock + **DEV**; installed-release
  exclusion is tested. Mock wallet values are fixed server projections, never
  calculated rewards. Mock-server process-memory limits are documented. Real
  idempotency/ownership/two-device behavior remains backend verification.
- STEP 25: read-only PR/push CI, exact SHA action pins, deterministic npm ci,
  coverage and production guards, production high/critical audit, lockfile
  origin/integrity/license checks, checksum-pinned MIT gitleaks, Android export
  and strict 10% bundle gate. A separate bounded-data-only commenter never checks
  out/executes PR code. Its PR behavior requires reaching main and a real PR run.
  Weekly npm/action Dependabot, PR checklist and changelog are configured.
- Manual EAS builds and preview-only OTA require reviewed main/protected
  environments. No build, OTA, signing-key change, credential creation or store
  submission was triggered. Production is explicitly live/production; an EAS
  post-install hook validates actual production API values. Unknown server-side
  EAS configuration is not falsely certified by PR profile checks.
- Owner-approved CI-only eas-cli 27.2.0 is pinned; no application npm dependency
  was added. Exact existing non-allowlist license exceptions are recorded by
  lockfile path/version/license. The separate Sentry FSL build-tool exception is
  preserved. New/changed incompatible licenses fail. Production audit: zero
  high/critical, existing 1 low / 32 moderate remain; Expo compatibility passes.
- Final local gate: 87 suites / 527 tests, zero-warning lint, strict TypeScript,
  337 base keys in AZ/EN/RU, formatting, production/supply-chain/Android config
  and workflow checks pass. Gitleaks history and staged-change scans pass with
  full redaction. Workflow validation is not native/device execution.
- Final no-map Android Hermes export: 6,106,790 bytes vs 6,104,882 (+0.03%), below
  10%. Existing SDK 58 optimizer/tree-shaking settings remain consistent across
  exports/CI/EAS. No APK/AAB, startup or 60fps claim is made.
- Implementation checkpoint `8987b91` is pushed. GitHub Actions run
  `41287573728` was observed successful for both Quality and supply chain and
  Android export and bundle budget. The final documentation commit is verified
  separately after push; these are observed hosted results, not YAML inference.
- QA_CHECKLIST.md maps critical scenarios and external responsibilities.
  DEV_SETUP.md documents protected main/environments, secrets/signing backups,
  appVersion runtime policy and the prohibition on OTA requiring native changes.
  Those GitHub/EAS server settings are owner tasks, not claimed configured.
- Preview OTA intentionally fails closed until expo-updates and the real EAS
  project/update URL are configured in an approved native build. Maestro/device,
  accessibility, native manifest/client rebuild, camera/SMS/Back/keyboard/insets,
  cold starts, backend/Google/push credentials and live Sentry ingestion remain
  pending. Older 22.c/23.f checks remain unchecked. Production branding and hosted
  legal disclosure/vendor retention verification remain pending.
- No user-facing layout was changed, so no new screen redesign/Unslop audit was
  manufactured. The permanent Epsilon Design System + Unslop rule is preserved.
  Animated logo/splash work remains postponed. STEP 26 is untouched. This branch
  is ready for merge review with the documented external validation limits and
  is not merged into main.

## STEP 26-27 batch verification (2026-11-01)

- Fetched all GitHub branches; `9baf3c2` was the latest valid STEP 24-25 state.
  Cleanly merged it into main and verified the pushed merge `2ea4b97`. The older
  preservation stash is untouched. Current batch remains separate from main.
- STEP 26 preparation complete: `API_CONTRACT.md`, generated `openapi.yaml` and
  `BUSINESS_RULES.md` define conventions, 23 active operations, schemas/errors,
  server/client authority, integer-qepik money, one universal wallet, exact
  purchased dishes and opaque purchase references. Apple and redemption remain
  deferred. No backend, reward calculation or new product surface was built.
- `contract:check` now runs in the normal quality gate, comparing the generated
  OpenAPI with current Zod schemas, explicit operation definitions and HTTP path
  inventory. Cross-field reward rules are represented; opaque generic server
  errors remain representable without becoming trusted client-domain codes.
- Corrected phone-link routes to canonical `/me/phone/otp/request|verify`;
  centralized OTP challenge schema; preferred nested error envelope with legacy
  flat compatibility, known domain-code whitelist and safe Retry-After handling;
  rejected contradictory none/non-null reward results. Privacy/Terms configuration
  requires HTTPS and fails safely on missing/malformed input. No UI layout change.
- Replay contract preserves durable feedback keys and exact payloads after lost
  responses, atomic stored backend responses, unique claims/rewards and ledger
  source accounting. Fixed reward funding, spending, confirmation/expiry,
  regulation/POS and deletion-balance decisions remain explicitly open, not coded.
  **LIVE BACKEND CONTRACT VERIFICATION PENDING.** Backend teammate sign-off,
  real ownership/concurrency/idempotency and staging behavior remain unverified.
- STEP 27 preparation complete: updated `DATA_INVENTORY.md`; added
  `LEGAL_TODO.md`, `PRIVACY_POLICY_DRAFT.md`, `TERMS_DRAFT.md`,
  `REWARDS_TERMS_DRAFT.md`, `INCIDENT_RESPONSE.md` and `STORE_READINESS.md`.
  The latter includes AZ/EN/RU listing drafts, real-build screenshot plan,
  provisional store data mapping, private reviewer access and a public deletion
  page specification. Current Google/Apple guidance is linked and dated.
- **LEGAL REVIEW REQUIRED BEFORE PUBLICATION.** O1-O8 in LEGAL_TODO.md are the
  consolidated owner input register: entity/contact/HTTPS resources, program
  rules, processors/hosting/retention, incident owners, store assets/reviewer
  access and real production integrations. Counsel must assess Azerbaijan
  financial/personal-data rules, transfers, minors/age, consumer wording, UGC,
  agreements, vendor/license/trademark obligations and deletion/retention.
  No entity, legal basis, retention period, final rating or approval was invented.
- **ACCOUNT DELETION BACKEND VERIFICATION PENDING.** Existing re-authentication,
  confirmation and backend-first local cleanup are preserved. No public web page
  was deployed, reviewer credentials provisioned, external handoff sent, store
  form submitted or production publishing/credential operation performed.
- Final local gate: 88 suites / 536 tests; coverage lines 85.84%, statements
  83.28%, branches 74.08%, functions 79.08%; all thresholds unchanged and green.
  Lint, strict TypeScript, all 337 AZ/EN/RU keys, formatting, production,
  supply-chain, Android configuration, workflow and contract checks pass. Tests
  cover nested/unknown errors, safe retry headers, canonical protected phone
  routes, malformed rewards, HTTPS legal config and generated mock responses.
- Production audit remains zero high/critical, 1 low / 32 moderate; Expo
  compatibility and redacted history/staged secret scans pass. No dependency
  addition or license-exception expansion. Existing approved exceptions remain.
- Final Android no-map Hermes export: 6,107,845 bytes vs 6,106,790 (+0.02%), below
  the unchanged 10% budget using the established SDK 58 settings. No APK/AAB,
  cold-start, physical-device, optimized-release or legal-compliance claim.
- Implementation checkpoint `f3c7cb6` is pushed; GitHub Actions run `41308780454`
  was observed successful for both required jobs. Final handoff clarification and
  documentation commit are verified again after push; hosted results are not
  inferred from local checks.
- No new/materially changed user-facing screen; existing Epsilon Design System
  - Unslop is preserved without an invented redesign. Full legal translations,
    hosted legal/support/deletion URLs, native/client rebuild, physical QA/Maestro,
    cold starts and live backend/Google/push/Sentry/OTA prerequisites remain pending.
    Animated logo/splash is still postponed. STEP 28-29 work is untouched.
- Ready for contract/legal preparation merge review, with the above owner/legal/
  backend decisions and external validation limits; not a public-launch approval.

## STEP 28-29 final batch verification (2026-11-01)

- Fetched/pruned and compared relevant remote branches before implementation.
  `054f3df537251533169809af3c86889326efaf33` was the latest valid pushed STEP 26-27
  implementation; newer Dependabot proposals were left unmerged. Cleanly merged
  into main, pushed and remotely verified `08c734fc3513df1c05680e474b7afa42156b1968`.
  Created this final branch from that merge; no stale local work was merged.
  The original named preservation stash is untouched.
- STEP 28 repository implementation complete: Hermes template/export confirmed;
  dev fixture initialization is lazy and development-only; camera route, date
  picker and clipboard load on demand; no new dependency. Active query focus/
  reconnect/foreground refetch uses monotonic freshness and skips in-flight work;
  profile/config GETs propagate cancellation. No speculative memoization.
- Added strict account-scoped wallet-only AsyncStorage projections: at most 12
  records, three history pages, 50 items/page, 250,000 serialized characters;
  stale hydration never replaces newer data. No auth/profile/receipt/comment/
  config query persists. Epoch/owner/ID checks and serialized logout/deletion
  clearing prevent stale reads/writes crossing accounts. Privacy inventory/draft
  now disclose this sandboxed storage without claiming application encryption.
- Fixed offline feedback attempting a send and separated outbox engine lifetime
  from language/toast subscriptions. Hidden sheets/manual scanner overlays
  unmount; sheet focus/animation callbacks clean up; accessible close handle is
  44pt. Native deletion-modal Back closes idle flows and blocks busy reauth/delete.
  Regression tests cover these discovered cases and durable replay boundaries.
- STEP 29 repository preparation complete: production AAB/remote versioning,
  draft internal submission default without repository credentials, separate live
  staging AAB profile alongside preview APK, current Play policy/signing/store/
  internal-first/staged-update/halt/native-recovery/OTA runbook. Percentage staged
  rollout is for updates, not first publication. No build/upload/publish occurred.
- Added executable `release:check` / strict `release:gate` with fixed mandatory
  evidence IDs/priorities and attributed build/revision/date requirements for PASS.
  Structure checking is in normal CI; strict gate was executed and correctly
  exits 1 with NO-GO for ten unresolved P0 groups. It is an attestation validator,
  not proof of live behavior or legal approval, and performs no external action.
- Whole STEP 00-29 source/product/security/privacy/financial/accessibility/design
  audit is in `FINAL_AUDIT.md`; definitive statuses are in `QA_MATRIX.md`.
  Preserved opaque purchase links, exact purchased dishes, unique server feedback,
  universal wallet and server-only money/eligibility. No reward formula, new
  product phase, fake partner/content or unrelated redesign was introduced.
- Final Epsilon Design System + credited Unslop source review covered all screen
  groups in spacing -> color -> icons -> copy -> typography -> layout -> details
  -> visuals -> motion order. Existing strong layouts were retained. Physical
  TalkBack/VoiceOver/large-font/keyboard/safe-area/visual QA remains pending;
  source review is not a rendered-device approval. Static placeholder branding
  still needs owner approval; animated logo/splash remains postponed.
- Complete local gate after final staging-profile correction: **91 suites / 557
  tests**, lines **85.79%**, statements **83.24%**, branches **74.83%**, functions
  **78.79%**. Existing coverage thresholds unchanged. Strict TS, zero-warning
  lint, all 337 AZ/EN/RU keys, formatting, production/profile, supply chain,
  Android configuration, workflow/Maestro syntax, OpenAPI and release structure
  checks pass. The test-only Babel async-import adapter preserves real lazy-route
  and Android Back coverage without changing production loading or adding packages.
- Expo compatibility, production audit and redacted history/staged secret scans
  pass: zero high/critical, existing 1 low / 32 moderate upstream findings remain.
  No lockfile/dependency/license-exception expansion or unsafe forced downgrade.
  Actual merged-manifest checker now rejects missing/old target SDK (<36), but no
  native artifact or 16 KB compatibility result is claimed.
- Verified final no-map Hermes export: **6,095,278 bytes** vs recovered baseline
  **6,107,845** (-12,567 / **-0.21%**). Unchanged <10% budget and actual-bytecode
  mock-credential exclusion pass. This is not AAB/APK size or startup/frame timing.
  Low-end/Aziz-phone cold start <2.5s, tab <150ms, 60fps, memory/battery/network
  and ten-minute session remain NOT TESTED; 22.c, 23.f, 28.a/28.e and 29.d retain
  their pending physical verification. See `PERF_REPORT.md` for the protocol.
- Implementation checkpoint **`9dcd648204e27e0f6f698a49e8a02e3810755a10`** pushed;
  hosted [CI run 41314274710](https://github.com/AzizAlizade473/Epsilon-Front-End/actions/runs/41314274710)
  was observed successful for both quality/supply-chain and Android export/budget.
  Final handoff/configuration commit receives the same hosted verification after
  push; its result is reported with the final remote recovery hash.
- **30 / 30 STEPS IMPLEMENTED — 100% engineering implementation**, with external
  verification explicitly pending. Development PASS; internal fixture QA
  conditional on a rebuilt dev client/device; controlled live pilot BLOCKED;
  public store submission/public launch **NO-GO**. Live backend/OTP/Google/
  deletion/push/Sentry are BLOCKED; OTA is unconfigured/NOT TESTED. O1-O8 and
  counsel/store approvals, live authorization/ledger/refunds/reconciliation,
  native/device/performance proof, backup restore/rollback and incident/monitoring
  owners remain P0. Optional push/OTA/upstream maintenance are P1; separate iOS
  release validation P2. No critical defect was downgraded to finish the roadmap.
- STOP at this final engineering batch. No STEP 30, public distribution, OTA,
  production deployment, external message, credential creation or logo animation.

## Local browser review follow-up (2026-11-01)

- User requested a website preview and explicitly approved exactly pinned
  `react-native-web` 0.21.4 (MIT), matching the installed Expo SDK compatibility
  declaration. Lockfile, integrity and license checks pass without new exceptions.
- Started the localhost-only Expo web development server on port 8081 using an
  ignored `.env.local` copied from the development/mock example. Added Expo's
  generated web type include/ignore entry. No public deployment or live backend.
- Added platform session storage: native delegates to existing SecureStore;
  browser mock credentials stay in memory and reject live/production mode.
  No credentials enter localStorage/cookies; refreshing starts a fresh session.
- Fixed the user-reported PressSurface crash: react-native-web lacks the native
  `useAnimatedValue` export. All shared consumers now use a platform hook; web
  retains one Animated.Value across renders and native re-exports the existing
  hook. Native animation behavior and Epsilon styling are preserved.
- Complete `npm run check` passes: **93 suites / 561 tests**, unchanged thresholds,
  strict types, zero lint warnings, locale/format/config/contracts/supply-chain
  checks. Regression tests cover transient session deletion, live/production
  rejection and stable browser animation values. Expo compatibility and production
  audit pass: existing 1 low / 32 moderate, zero high/critical vulnerabilities.
- Actual development web entry returns HTTP 200 and resolves both `.web` adapters.
  Browser automation could not verify the current URL, so no rendered visual QA
  claim is made. User should refresh the preview to clear the stale error overlay.
  See DEV_SETUP.md for mock phone/OTP instructions and native-feature limitations.
- Android no-map export `dist/web-preview-fixed`: **6,094,528 bytes**, versus
  pre-preview 6,095,278 (-0.012% total; not an isolated package-size estimate).
  Budget/mock-marker checks pass and the browser session implementation is absent
  from Android bytecode. No launch-readiness/manual gate changes; NO-GO remains.

- [x] UI.welcome.1 - Reference-inspired centered welcome card, transparent existing Epsilon placeholder mark, preserved phone/Google flow. Checks: 93 suites / 561 tests; mobile browser phone navigation verified; native visual QA pending.

- [x] UI.welcome.2 - Use owner-supplied PDF logo with transparent background in welcome card; browser asset/alpha verified. Full check passes: 94 suites / 563 tests. Native visual QA pending.
