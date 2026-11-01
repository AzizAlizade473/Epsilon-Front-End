# Release gate

2026-11-01: **NO-GO for public store submission and public launch.** Engineering
roadmap implementation is distinct from verified operational readiness. No real
backend, device, counsel, store or owner approval is inferred from passing Jest.

`npm run release:check` validates the required evidence register and safe AAB /
draft internal submission configuration; it can pass while reporting NO-GO.
`npm run release:gate` fails while any P0 is not PASS or evidence is malformed.
Both are read-only. CI runs the structure check, not a fictitious launch approval.
The fixed requirement list prevents silently removing/downgrading blocker rows.
PASS requires proof, reviewer, UTC timestamp, build and full revision. Independent
release reviewers must verify those attestations; the script cannot verify them.

## Security

- [x] Client source: tokens use SecureStore; no token/OTP/QR logging or URL exposure;
      release overrides/fixtures forbidden; production transport/config guarded.
- [ ] Signed artifact scanned and no secrets/debug payloads embedded.
- [ ] Backend authorization, account ownership and restaurant isolation verified.
- [ ] Live validation, OTP limits/expiry, refresh revocation and abuse limits verified.
- [ ] Backend security testing completed and critical findings resolved.

## Financial integrity

- [x] Source: integer-qepik rendering, exact purchased dishes, one universal wallet;
      server-only eligibility/rewards/balances; no invented redemption or formula.
- [ ] Live duplicate-receipt prevention and multi-user claim races verified.
- [ ] Atomic, idempotent, auditable ledger and lost-response replay verified.
- [ ] Refunds/reversals, settlement/expiry rules and retained balances approved.
- [ ] Reconciliation and fraud monitoring running with accountable owners.

## Reliability

- [ ] Final local and hosted automated gates green for reviewed revision
      (record actual results in FINAL_AUDIT.md / PROGRESS.md).
- [x] Source/test doubles cover offline retry, malformed responses, auth races,
      bounded wallet cache and server-committed/lost-response replay.
- [ ] Native/Maestro E2E and real-device matrix (small/normal/large/low-end) pass.
- [ ] Installed internal Play build completes Google -> scan -> rate -> wallet.
- [ ] Cold start/tab/frame, ten-minute memory/battery/lifecycle tests pass.
- [ ] No known critical crash/data-loss issue after native/live testing.
- [ ] Backend backup restore tested, with ledger reconciliation.

## Legal

- [ ] Privacy, Terms and Rewards Terms reviewed by qualified counsel; approved
      translations hosted at verified URLs with owner entity/contact details.
- [ ] Real processors/regions/roles, retention, transfers, minors and security
      controls approved; store Data safety matches actual service behavior.
- [ ] In-app and public-web deletion work, including retention/session/device effects.
- [ ] Current store policies, content rating, audience and reviewer access reviewed.
- [ ] Cashback regulation, restaurant agreements and program rules approved.

## Operations

- [ ] Required hosted CI green for the exact final recovery commit.
- [ ] Consent-gated scrubbed Sentry ingestion/symbolication and alert ownership live.
- [ ] Rollout halt, native recovery and any enabled OTA rollback tested.
- [ ] Incident/support/financial roles and escalation contacts assigned.
- [ ] Store assets, credentials, approved identity/version and listing complete.

Unperformed critical checks remain unchecked. See release-evidence.json for the
machine-readable P0/P1/P2 register, QA_MATRIX.md for test scope, LEGAL_TODO.md
for O1-O8 owner decisions and RELEASE_ANDROID.md for the authorized-owner runbook.
Push is P1 while optional; if required for a release scope, promote its gate before
approval. OTA must remain disabled while unverified. iOS is outside this Android
launch scope and needs separate native validation before any iOS distribution.

The client is never trusted for money. All important server operations must be
authorized, validated, atomic, idempotent and auditable. Abnormal paths require
evidence. Never publish with unresolved critical security, financial-integrity
or data-loss defects.
