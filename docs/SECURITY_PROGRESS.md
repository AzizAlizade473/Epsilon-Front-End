# Security audit — progress

Findings and their status: [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## 2026-11-23 — audit pass 1

Branches: `security/audit` in both repos (front-end from `fix/afk-ekassa-restaurants`,
back-end from `fix/ekassa-import-reliability`). Nothing merged to `main`, nothing deployed.

Method: read every API route, the auth, session, OTP, cashback, ledger and fiscal modules,
the e-kassa WebView screen and export bridge, the app's HTTP client, token storage and cache
handling. Read the demo server's Caddy and systemd configuration and the names (not values)
of its environment variables. Each finding was first reproduced by a failing test, then fixed.

### Done

- Back-end `test/security.test.ts`: 11 tests (8 failed before the fixes, 3 guard existing behaviour).
- SEC-01 `TRUST_PROXY` setting; SEC-02 e-mailed code caps (`OTP_EMAIL_MAX_PER_DAY`);
  SEC-03 discounted lines; SEC-04 partner VOEN; SEC-05 deletion erases OTP rows;
  SEC-06 cursor validation. Both new settings are in the back-end `.env.example`.
- Back-end `vitest.config.ts`: `hookTimeout` 60 s. The baseline run failed 1–2 tests with
  "Hook timed out in 10000ms" (in-memory Postgres migration under load), not a code problem.
- No app code change was needed: the app-side checks (category G and the WebView) found no issue.

### Results

- Back-end `npx vitest run`: 10 files, 116 tests passed.
- App: `npx jest` 123 suites, 697 tests passed; `npm run typecheck`, `npm run lint`,
  `npm run i18n:check` and `npm run contract:check` pass.

### Needs the owner

1. Deploy the back-end branch to the demo server and add `TRUST_PROXY=127.0.0.1` to
   `/opt/epsilon/.env` (Caddy proxies from the same host). Without it SEC-01 stays open there.
2. Decide SEC-11 (shared record from a customer image) and SEC-13 (receipt-level discount).
3. Optional: Caddy log level INFO on the demo server (SEC-18).

### Not verified

- No test on a real Android device; no request was sent to the demo server.
- Gmail sending was not exercised (tests replace the sender); no live Gemini call.
