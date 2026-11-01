# Mobile/backend contract

**LIVE BACKEND CONTRACT VERIFICATION PENDING.** This handoff describes the mobile
client and required backend behavior, not a deployed backend certification.

## Open decisions — OWNER DECISION REQUIRED

1. Who funds cashback, and how participating restaurants settle a universal wallet.
2. Where/how value can be spent; redemption screens/API and step-up auth are future work.
3. Pending-to-confirmed timing, expiry and program conditions.
4. Whether the proposed spendable balance is regulated in Azerbaijan — LEGAL REVIEW REQUIRED.
5. POS/purchase-link generation and onboarding effort per restaurant.
6. Balance/pending rewards and legally retained records on account deletion.

These decisions must be approved before implementing redemption or binding reward
terms. The consolidated owner/legal launch checklist is in `LEGAL_TODO.md`.

## Authority and terminology

Purchase = the server-verified sale; Receipt = its mobile projection with exact
purchased items; purchase reference = an opaque server-issued lookup/claim token.
QR and manual code are V1 carriers, not permanent purchase identity. The app
never trusts embedded QR amounts, customer details or restaurant claims. A dish
rating targets a server-returned `receiptItemId`; a `feedbackId` identifies the
accepted feedback. A reward is its server decision; a wallet transaction is a
ledger projection, not the same identifier as a receipt or feedback.

The server owns identity, purchase validity/ownership/expiry, purchased dishes,
eligibility, duplicates, reward values and settlement. The client collects input,
validates shape, renders projections, caches safely and formats integer money.
There is **one universal wallet**; restaurant source accounting is not a separate
customer wallet. An incentive is not a prerequisite for submitting valid feedback.
Accountless web feedback is a separate future surface.

## Wire conventions

- Base URL ends in `/v1`; HTTPS production host is owner-configured. OpenAPI uses
  a relative server URL, not an invented deployed domain.
- JSON bodies; bearer access token on protected endpoints. The request adapter
  reads the token from session memory, never disk per request.
- `Accept-Language`: az/en/ru (AZ default); user-visible copy is localized from
  machine codes, never parsed from backend English `message` text.
- UTC ISO-8601 output (`Z`); current decoders also accept explicit timezone
  offsets for compatibility. HTTP `Date` anchors presentation/cooldowns; the
  server still enforces expiry, recent authentication and eligibility.
- Cursor pages `{items, nextCursor}` with opaque cursor/null end and `limit` 1–50.
  Cursors and object IDs must not disclose PII; authorize each returned object.
- Every implemented mutation supplies `Idempotency-Key`; see replay rules below.
- Success uses the actual JSON projection, not a universal `{data: ...}` wrapper.
  Logout, deletion and device registration accept empty 204 or JSON null/empty
  success as defined by the void decoder. Other endpoints require valid JSON.
- Response validation happens at fetch boundary; malformed success is
  `BAD_RESPONSE`, never partial trusted wallet/receipt state.

`openapi.yaml` is generated from current Zod response schemas and explicit
operation definitions via `npm run contract:generate`; `contract:check` prevents
drift. Schema references: `src/services/contracts/index.ts`; interfaces:
`src/services/interfaces/index.ts`; wire adapter: `src/services/http/services.ts`.
Cross-field reward constraints are also expressed in OpenAPI; semantic app
versions still use the shared strict parser. Backend validation MUST additionally
enforce the security/business requirements in `BUSINESS_RULES.md`.

## Active endpoint inventory

| Domain        | Methods and relative paths                                         | Request / response                                                 |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Config        | GET `/config`                                                      | Config: minAppVersion, minAge, requirePhoneVerification            |
| Phone sign-in | POST `/auth/otp/request`, `/auth/otp/verify`                       | phone; phone+code → OtpChallenge / AuthResult                      |
| Google        | POST `/auth/google`                                                | idToken → AuthResult; backend validates Google token               |
| Session       | POST `/auth/refresh`, `/auth/logout`                               | refreshToken → Session; logout → empty                             |
| User          | GET/PATCH/DELETE `/me`                                             | User; partial profile → ProfileUpdate; deletion → empty            |
| Phone linking | POST `/me/phone/otp/request`, `/me/phone/otp/verify`               | authenticated phone; phone+code → challenge / User                 |
| Restaurants   | GET `/restaurants`, `/restaurants/{id}`                            | search/cursor/limit → RestaurantPage; detail → Restaurant          |
| Purchase      | POST `/receipts/resolve`; GET `/receipts/{id}`                     | `{kind: qr                                                         | code, value}` → Receipt; owned receipt → Receipt |
| Feedback      | POST/GET `/feedback`                                               | FeedbackInput → FeedbackResult; cursor/limit → FeedbackPage        |
| Wallet        | GET `/wallet`, `/wallet/transactions`, `/wallet/transactions/{id}` | Wallet; cursor/limit → TransactionPage; detail → WalletTransaction |
| Notifications | GET/PUT `/me/notification-settings`; POST `/devices`               | preferences; `{token}` → empty                                     |

No redemption/withdrawal API is implemented. `/auth/apple` and optional Apple
authorization code for deletion are reserved canonical future requirements,
not an active Android endpoint. Apple SDK/sign-in support is disabled.

### Compatibility decisions

Canonical phone linking is now `/me/phone/otp/request|verify`; the earlier
`/auth/phone/link/request|verify` adapter names were corrected before this
handoff. Backend owner must confirm the canonical paths in staging.
Profile PATCH prefers `{user,nextStep}` but explicitly decodes legacy User-only
responses; restaurant list prefers a page but accepts a legacy array. No new
backend should rely on those legacy forms. `nextStep` is profile/phone/home.
DELETE `/me` currently sends no Android body and requires server recentAuth;
client-only token deletion is never account deletion.

## Money and reward contract

All `*Minor` fields are safe integers in **qəpik** (100 qəpik = 1 AZN); currency
is currently AZN. No decimal strings, NaN/Infinity, unsafe integers or floating
point monetary values. UI formats via `lib/money`, for example `12.50 ₼`.
Wallet `balanceMinor` is confirmed server balance, `pendingMinor` is separate.
The client never derives balance by adding local transactions or dishes.

Wallet transaction type earned/redeemed/reversed/expired and status
pending/confirmed/cancelled are separate enums. Debits use signed negative
amounts. Generic safe-integer decoders permit signed values; they do not decide
the legal/business overdraft, refund, expiry or zero-value policy. Server owners
must enforce approved policies. Receipt quantities are positive integers.

Feedback returns `{feedbackId,reward:{status,amountMinor}}`: none requires null;
confirmed requires an integer server amount; pending may have null or an integer
server projection. No client reward percentage or amount calculation. On accepted
feedback, invalidate receipt, feedback and all universal-wallet queries. A
`rewardHint` is not a promise. Expiry/reversal are new ledger rows, not UI edits.

Every backend ledger row MUST retain restaurant source accounting. The current
mobile `source` may be null for a system-adjustment projection; this is not
permission for an unattributed backend ledger. Backend owner must resolve
system-adjustment attribution/reconciliation without changing customer wallets.

## Idempotency and ambiguous outcomes

The client creates keys per logical mutation; receipt resolution retains a key
for the same retry attempt, feedback persists the key and exact payload in a
bounded account-scoped outbox before sending, deletion retains a key across its
retry flow. HTTP retries only GET for network/timeout (maximum two with jitter),
with 15s timeout. Authenticated requests may replay once after 401 refresh using
the same mutation body/key; there is no blind transport retry of mutations.

The backend MUST bind a key to user, operation and payload fingerprint, atomically
store the committed response, and return that same result for the same key and
payload. A changed payload under the same key must fail without side effects;
backend owner must select a documented existing error mapping before deployment.
Uniqueness on feedback item/owner and ledger source prevents duplicates even
across different keys. Concurrent commits must not issue two rewards.

A lost/timeout response does not prove failure. Feedback retains the same key
for startup/foreground replay; accepted results clear the entry. Terminal
FEEDBACK_ALREADY_SUBMITTED/VALIDATION_FAILED drop it safely without synthesizing
a reward. NETWORK/TIMEOUT/unknown outcomes retain it. Maximum 20 entries; TTL is
seven days from trusted time, deferred/anchored if no server clock is known.
Backend idempotency retention MUST cover that replay window plus the agreed
retry/in-flight margin; exact backend retention is OWNER DECISION REQUIRED.
No reconciliation endpoint is invented. Other mutation screens retain drafts
and refetch server projections; UI must not claim an ambiguous write failed
definitively. Verify deletion retry/re-auth semantics with the backend.

## Errors and auth

Preferred error: `{"error":{"code":"OTP_EXPIRED","message":"…","requestId":"…"}}`.
`Retry-After` uses safe nonnegative delta-seconds on 429; optional safe integer
`error.retryAfterSeconds` is accepted. X-Request-Id takes precedence over body
requestId. The decoder retains legacy flat errors during migration. Unknown or
malformed codes fall back by HTTP status (401 unauthorized, 429 rate limited,
422 validation, otherwise generic UNKNOWN); they never become arbitrary typed
domain codes. Client-only codes BAD_RESPONSE/NETWORK/TIMEOUT/UNKNOWN are not
server response codes. Stable server codes are exported once in `http/errors.ts`
and listed in OpenAPI; 403 remains generic forbidden without a new UI code.
The OpenAPI wire error permits opaque non-domain server codes (for example, a
generic service failure category selected by the backend). Its recognized-code
annotation is not permission to cast an unknown code into the client enum.
The runtime whitelist and status fallback remain mandatory; new domain behavior
requires a coordinated contract/client change.
Never include tokens, phone, comments or raw purchase references in error text,
request IDs, logs or URLs.

Access tokens are short-lived; refresh tokens rotate with reuse detection.
Concurrent 401s share one refresh; delayed old-token 401s reuse the rotated token;
obsolete-account refreshes cannot publish tokens or clear the new flight. Refresh
failure clears session and returns to Welcome. Tokens use SecureStore at boot
and session memory thereafter. Logout/deletion clear user/query/outbox/preferences
and provider session locally; server MUST revoke credentials/device associations.
UI guards are not authorization. All object reads/writes need ownership checks.

## Reviewer access and backend acceptance

OWNER DECISION REQUIRED: provision a whitelisted review account, fixed OTP and
demo purchase reference in an isolated review dataset with no real payouts.
Do not add a global OTP bypass, log/commit credentials, or enable mock controls in
production. Review secrets belong only in store App access/review notes through
restricted owner access. Backend must enforce isolation, scoped expiry, audit
and a disable/revoke procedure. Keep the review service reachable for review.

Backend teammate acceptance is pending: review all three handoff files, resolve
the six decisions, confirm exact routes/schema/error shapes, prove object and
tenant isolation, idempotent lost-response replay, global claim uniqueness,
atomic ledger/reversals, deletion/recentAuth and retention, and exercise real
phone/Google/POS/push contracts in staging. No handoff message was sent externally
from this session and no backend behavior is claimed verified.
