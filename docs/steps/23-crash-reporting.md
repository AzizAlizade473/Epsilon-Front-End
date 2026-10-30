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
