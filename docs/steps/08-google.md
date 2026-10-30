## STEP 08 — Google sign-in  (branch `step/08-google`)

**Aziz does first (docs/DEV_SETUP.md):** Google Cloud project; OAuth consent screen with app name, support email, privacy policy link, scopes **only** openid/email/profile; **publish to "In production"**; create OAuth clients: **Web** (its ID = `GOOGLE_WEB_CLIENT_ID`, used by app and backend), **Android** (package + SHA-1 for: local debug key if used, EAS development/preview keystore from `eas credentials`, production keystore, later Google Play App Signing key). A missing SHA-1 causes DEVELOPER_ERROR.
**Build:** `useGoogleSignIn`: configure once at startup (only if flag + client ID set) with `webClientId`; press → Play Services check → sign in → `idToken` → `AuthService.signInWithGoogle({idToken})` → discard the token (SEC-3). Cancel → silent. Errors → AZ messages: "Daxil olmaq mümkün olmadı. Yenidən cəhd edin." / "İnternet bağlantısı yoxdur" / "Google Play xidmətləri yenilənməlidir." / "Telefonda Google hesabı yoxdur" / SOCIAL_EMAIL_UNVERIFIED "Bu Google hesabının e-poçtu təsdiqlənməyib." Prevent double taps and concurrent flows. On success save session, put user in the cache, route by `nextStep` (new users never see an empty Home). Logout calls `GoogleSignin.signOut()`. Apple code stays off.
**Tests:** success, cancel, invalid token, no network, double tap (native modules mocked).

**Micro-steps:** 08.a plugin/config + env gating + docs · 08.b `useGoogleSignIn` hook (+ tests) · 08.c wire the Welcome button · 08.d error messages · 08.e session + `nextStep` routing · 08.f logout integration.

**MANUAL CHECK:** on your phone: Google → profile setup (new user) works; cancel leaves Welcome usable; "use another account" works. Needs a development build.

---
