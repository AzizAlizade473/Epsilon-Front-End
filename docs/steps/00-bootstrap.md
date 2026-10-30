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
