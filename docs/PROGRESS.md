# Epsilon progress

Scope: STEP 02 navigation shell. STEP 01 approved and merged into `main`.
Branch: `step/02-navigation`, based on merge commit `8771325`.

A checked item is complete only after its commit reaches GitHub.

Recovery: fetched all branches/tags on 2026-10-31; latest pushed development
was `86bb6af` (01.a). No old-laptop 01.b edits were pushed. All 83 baseline
tests pass; no missing `extend-expect` error. Windows CRLF formatting and stale
Node 20 instructions are repaired by 01.recovery. Use Node 22.22.1+.
Latest verified code commit: `7bb038e` (contrast correction); later commits document this checkpoint.
Checks: `npm run check` green, 144 tests / 25 suites; Expo dependency validation
and Android development/release exports pass. GitHub Actions execution not verified.
Next: 02.a provider/bootstrap shell, then the remaining STEP 02 micro-steps.
Aziz authorized STEP 01 merge and autonomous STEP 02 on 2026-10-31.
Manual device checks remain pending and do not block this implementation.
Open design input: exact brand blue awaits the real logo asset; placeholder is retained.
Device/TalkBack/font-scale/performance checks remain not verified.

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
- [ ] 02.b — route skeleton with stubs and typed routes
- [ ] 02.c — TabBar + center button
- [ ] 02.d — Sheet + transparent-modal wiring
- [ ] 02.e — bootstrap redirect + deep-link param schemas (+ tests)
- [ ] 02.f — Back-button behavior.

## STEP 03

- [ ] 03.a — contracts
- [ ] 03.b — client + errors + idempotency (+ tests)
- [ ] 03.c — refresh single-flight (+ tests)
- [ ] 03.d — service interfaces
- [ ] 03.e — mock implementations + fixtures + contract tests
- [ ] 03.f — dev scenario menu
- [ ] 03.g — query defaults + key factories.

## STEP 04

- [ ] 04.a — i18n setup + 3 locale files + language persistence
- [ ] 04.b — `i18n:check` script wired into `check`
- [ ] 04.c — money (+ tests: 0, 5, 100, 123456, negatives)
- [ ] 04.d — date (+ tests)
- [ ] 04.e — plurals.

## STEP 05

- [ ] 05.a — layout + strings
- [ ] 05.b — buttons (Google official style, phone primary) + flags
- [ ] 05.c — legal links caption
- [ ] 05.d — motion + a11y labels ("Google ilə davam et", "Telefon nömrəsi ilə davam et") + test.

## STEP 06

- [ ] 06.a — phone schema + formatter (+ tests)
- [ ] 06.b — `PhoneField`
- [ ] 06.c — screen + keyboard-safe button
- [ ] 06.d — request mutation + errors
- [ ] 06.e — a11y + test.

## STEP 07

- [ ] 07.a — `OtpInput` + `ResendTimer` (+ tests)
- [ ] 07.b — screen + verify mutation
- [ ] 07.c — error states + shake
- [ ] 07.d — session save + routing by `nextStep` (+ tests)
- [ ] 07.e — a11y.

## STEP 08

- [ ] 08.a — plugin/config + env gating + docs
- [ ] 08.b — `useGoogleSignIn` hook (+ tests)
- [ ] 08.c — wire the Welcome button
- [ ] 08.d — error messages
- [ ] 08.e — session + `nextStep` routing
- [ ] 08.f — logout integration.

## STEP 09

- [ ] 09.a — schema + age rule (+ boundary tests: exactly MIN_AGE allowed, one day short blocked)
- [ ] 09.b — form fields
- [ ] 09.c — date picker
- [ ] 09.d — submit + routing
- [ ] 09.e — a11y.

## STEP 10

- [ ] 10.a — phone-verify entry screen
- [ ] 10.b — code screen
- [ ] 10.c — PHONE_IN_USE sheet
- [ ] 10.d — skip/banner logic by config
- [ ] 10.e — resume-at-step tests.

## STEP 11

- [ ] 11.a — `useWallet` + `useWalletTransactions` hooks (+ tests)
- [ ] 11.b — shared `TransactionRow`
- [ ] 11.c — Home layout + strings
- [ ] 11.d — states (skeleton/error/offline)
- [ ] 11.e — count-up + motion
- [ ] 11.f — a11y + test.

## STEP 12

- [ ] 12.a — hook + keys + infinite query (+ tests)
- [ ] 12.b — list + row
- [ ] 12.c — search + debounce
- [ ] 12.d — states + strings.

## STEP 13

- [ ] 13.a — state machine (+ tests)
- [ ] 13.b — permission screens
- [ ] 13.c — camera + overlay + scan line
- [ ] 13.d — resolve call + success/lock
- [ ] 13.e — error cards
- [ ] 13.f — manual-entry sheet
- [ ] 13.g — lifecycle (focus/background) + a11y.

## STEP 14

- [ ] 14.a — hook + initial data (+ tests)
- [ ] 14.b — header + items list
- [ ] 14.c — status/read-only logic
- [ ] 14.d — footer + rewardHint
- [ ] 14.e — a11y.

## STEP 15

- [ ] 15.a — outbox module (+ tests)
- [ ] 15.b — star rating component + labels
- [ ] 15.c — reason chips + comment
- [ ] 15.d — submit mutation + idempotency + outbox wiring
- [ ] 15.e — error/dismiss-confirm flows
- [ ] 15.f — retry on start/foreground
- [ ] 15.g — a11y.

## STEP 16

- [ ] 16.a — layout + three reward variants (+ tests)
- [ ] 16.b — motion + haptic
- [ ] 16.c — navigation rules.

## STEP 17

- [ ] 17.a — date grouping util (+ tests)
- [ ] 17.b — hero + pending chip
- [ ] 17.c — history list + sticky headers
- [ ] 17.d — row variants (+ tests)
- [ ] 17.e — states + empty
- [ ] 17.f — foreground refetch + a11y.

## STEP 18

- [ ] 18.a — sheet + rows + omit-null logic (+ tests)
- [ ] 18.b — copy + toast
- [ ] 18.c — refresh + states.

## STEP 19

- [ ] 19.a — identity block
- [ ] 19.b — grouped rows + routes
- [ ] 19.c — logout flow + full cleanup (+ test that nothing remains)
- [ ] 19.d — version footer + a11y.

## STEP 20

- [ ] 20.a — personal info
- [ ] 20.b — my reviews
- [ ] 20.c — notifications + permission flow
- [ ] 20.d — language
- [ ] 20.e — privacy links + crash toggle
- [ ] 20.f — delete flow with re-auth (+ tests)
- [ ] 20.g — help.

## STEP 21

- [ ] 21.a — OfflineBanner + online manager
- [ ] 21.b — ErrorBoundary + test (throw in a child)
- [ ] 21.c — toast queue
- [ ] 21.d — not-found + session expiry
- [ ] 21.e — update gate
- [ ] 21.f — BAD_RESPONSE + clock tests.

## STEP 22

- [ ] 22.a — manifest/permission audit script + result
- [ ] 22.b — fixes found
- [ ] 22.c — TalkBack and font-scale pass with fixes
- [ ] 22.d — write `docs/ANDROID_AUDIT.md`.

## STEP 23

- [ ] 23.a — decision + install + config plugin
- [ ] 23.b — deferred init + env gating
- [ ] 23.c — scrubber (+ tests)
- [ ] 23.d — toggle integration
- [ ] 23.e — source map upload in EAS
- [ ] 23.f — startup measurement recorded in `docs/PERF_REPORT.md`.

## STEP 24

- [ ] 24.a — missing unit tests per the list
- [ ] 24.b — coverage thresholds in CI
- [ ] 24.c — Maestro setup + flow 1
- [ ] 24.d — flows 2–5
- [ ] 24.e — scenario table in `docs/QA_CHECKLIST.md`.

## STEP 25

- [ ] 25.a — PR workflow
- [ ] 25.b — audit/license/secret scan
- [ ] 25.c — guard script (+ test)
- [ ] 25.d — bundle report
- [ ] 25.e — Dependabot + PR template + CHANGELOG
- [ ] 25.f — manual EAS workflows
- [ ] 25.g — docs.

## STEP 26

- [ ] 26.a — conventions + errors
- [ ] 26.b — OpenAPI for auth/user/config
- [ ] 26.c — OpenAPI for restaurants/receipts/feedback/wallet/notifications
- [ ] 26.d — `BUSINESS_RULES.md` (MUST list above)
- [ ] 26.e — open decisions + reviewer access plan
- [ ] 26.f — fixtures-vs-schema contract test.

## STEP 27

- [ ] 27.a — data inventory
- [ ] 27.b — legal TODO + lawyer questions
- [ ] 27.c — incident response
- [ ] 27.d — store-readiness drafts.

## STEP 28

- [ ] 28.a — baseline measurements
- [ ] 28.b — bundle/startup fixes
- [ ] 28.c — list/animation fixes
- [ ] 28.d — memory/lifecycle checks
- [ ] 28.e — final numbers.

## STEP 29

- [ ] 29.a — EAS production + submit profile
- [ ] 29.b — `RELEASE_ANDROID.md`
- [ ] 29.c — `RELEASE_GATE.md`
- [ ] 29.d — internal-testing build installed from Google Play and walked through (sign in with Google, scan a staging receipt, rate, see the wallet)
- [ ] 29.e — staged-rollout plan.

## Verification log

- 00.a: canonical origin and initial main commit verified; ignore-rule checks and Git whitespace checks passed; pushed `1aafb5c` and verified remote hash.
- 00.b: source copy matches byte-for-byte; 30 step files and all micro-step IDs checked against the source; Git whitespace checks passed. No package scripts exist yet.
- Device testing: not verified.

STEP 00 and STEP 01 are merged into `main` (`8771325`). STEP 02 is in progress.
Later-step documents are specifications only.

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
