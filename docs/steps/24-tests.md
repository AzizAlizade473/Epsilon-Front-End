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
