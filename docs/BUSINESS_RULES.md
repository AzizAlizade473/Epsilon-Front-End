# Backend requirements — MUST checklist

**LIVE BACKEND CONTRACT VERIFICATION PENDING.** These are backend handoff
requirements, not evidence that a backend exists or that any legal model is
approved. Resolve the six decisions at the top of `API_CONTRACT.md` first.

## Identity and authorization

- Backend MUST rate-limit OTP by phone, IP and account, enforce expiry/attempt
  limits and avoid responses that reveal whether a number already exists.
- Backend MUST issue short-lived access tokens, rotate refresh tokens, detect
  refresh reuse, revoke sessions on logout/deletion and enforce recentAuth for
  account deletion. Exact lifetimes are owner/security decisions, not client guesses.
- Backend MUST verify Google signature against Google keys, issuer, web-client
  audience, expiry and email_verified. Identity MUST be provider + verified sub,
  never email. `auth_identities(user_id,provider,provider_user_id,email,email_verified)`
  MUST enforce uniqueness per provider/provider_user_id.
- Backend MUST NOT auto-link or merge by matching email. Linking MUST require an
  authenticated account and proof of control, including the approved OTP flow.
- Backend MUST enforce object-level ownership on every receipt, feedback and
  wallet read/write, tenant isolation for future restaurant tooling, input field
  allowlists (no mass assignment) and audits for sensitive mutations. UI hiding
  MUST NOT be treated as authorization.

## Purchases and feedback

- Purchase references MUST be unguessable server-issued tokens or verifiable
  signed mechanisms, validated against authoritative purchase/POS data where
  integrated. Arbitrary QR fields MUST NOT establish identity, amount or eligibility.
- Backend MUST enforce one global claim per receipt/item with database unique
  constraints; validate purchase amounts, timestamps and exact eligible items;
  reject cancelled/refunded/expired purchases; audit claims; route unverifiable
  records to review rather than fabricate verification.
- Feedback MUST target an owned, server-returned purchased item, validate rating
  1–5, allowed reason codes (max three), optional comment (max 500 characters),
  existing submission and approved eligibility. Reason-code policy remains
  server controlled; the client string schema is not a moderation policy.
- Valid feedback MUST remain independent of a positive incentive. Backend MUST
  compute eligibility and amount; when requirePhoneVerification is true it MUST
  require phoneVerified for rewards. No app-computed cashback percentage/value.
- Comments provided to restaurant tooling MUST omit name and phone; backend
  MUST apply access control, abuse handling and moderation. This future dashboard
  behavior is a requirement, not a verified deployed disclosure. Legal/store
  owners MUST assess applicable user-generated-content rules before launch.

## Ledger, concurrency and replay

- Wallet MUST be universal across the approved program, not separate restaurant
  customer balances. Backend MUST provide confirmed balance as the sum of
  confirmed append-only ledger rows, pending separately; client lists are not a
  ledger authority. Amounts MUST use integer minor units, currently AZN qəpik.
- Every ledger row MUST record source restaurant accounting for settlement and
  reconciliation. Mobile nullable source for system adjustments MUST NOT erase
  backend attribution; system-allocation policy requires owner confirmation.
- Ledger states MUST distinguish pending/confirmed/cancelled. Reversal and expiry
  MUST append new rows, never edit financial history. Exact timing, expiry,
  funding, redemption and deletion settlement remain OWNER DECISION REQUIRED.
- Backend MUST bind idempotency key + user + operation + payload, atomically store
  the resulting response and replay that same result after a lost response.
  Different payloads under a key MUST NOT mutate state. Retention MUST cover the
  agreed client replay horizon (seven trusted-time days plus retry margin).
- Unique feedback/reward/source constraints and atomic transactions MUST prevent
  duplicate issuance even with different keys. Balance checks for future spending
  MUST be concurrency safe using row locks or serializable isolation. No spend
  or redemption mutation is introduced by this handoff.
- Backend MUST monitor account/device/IP concentration, scan velocity, rating
  patterns, bulk new phones and repeated unsupported scans; run reconciliation
  against restaurant/POS records. Signal collection, retention and access require
  minimization/legal approval, not unlimited surveillance permission.

## Operations and review access

- Backend MUST validate requests and size limits, use parameterized queries,
  standardized machine errors/request IDs, no sensitive payload logging, health
  checks, graceful shutdown and backwards-compatible expand/contract migrations.
- Operations MUST use encrypted backups with a tested restore, defined RPO/RTO,
  and alerts for auth failures, error rates, abnormal transactions, DB performance
  and background jobs. Owners and exact targets are not yet supplied.
- A store-review account MUST be whitelisted, isolated from real payouts and
  supplied with a scoped fixed OTP/demo receipt through private App access/review
  notes. Backend MUST prevent a general production OTP bypass, audit/revoke the
  access and keep review services reachable. No credentials belong in this repo.
- Deletion MUST revoke sessions/device links and apply the approved retention
  policy; local cleanup is not deletion. Backend MUST disclose pending-reward/
  retained-record consequences before confirmation. Those consequences require
  owner/legal approval and staging verification, not invented client promises.

Backend owner sign-off and staging evidence for all sections are pending.
