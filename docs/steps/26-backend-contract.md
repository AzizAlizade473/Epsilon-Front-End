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
