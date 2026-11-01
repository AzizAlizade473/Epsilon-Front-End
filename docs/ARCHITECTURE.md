# Epsilon client architecture

Android-first Expo Router / React Native application. The product links an opaque
purchase QR/manual reference to **exact purchased dishes** and verified feedback.
There is one server-authoritative wallet across partner restaurants. The mobile
client renders integer-qepik amounts; it does not compute eligibility, rewards,
balances, settlement, expiry or redemption rules. See BUSINESS_RULES.md and
decisions/0004-verified-feedback-architecture.md.

`app/` owns routes/guards; `src/features/` owns screens and feature behavior;
shared UI, hooks, design tokens and providers live under `src/`. `src/services/`
owns typed interfaces, Zod contracts, HTTP boundaries, query keys and outbox/cache
engines. Features do not import other features' internals. API_CONTRACT.md and
generated openapi.yaml describe the backend handoff, not a deployed backend.

Startup holds the splash, initializes i18n and reads SecureStore once, then creates
the query/auth runtime. Development mocks are dynamically initialized only in
`__DEV__` mock mode. Release mode cannot enable fixture services or overrides.
Native camera route, birth-date picker and clipboard code are loaded on demand;
Google initialization follows the first frame; optional consent-gated Sentry and
wallet cache work are deferred. No reporting/permission prompt blocks startup.

Session credentials persist only in SecureStore; access credentials remain in
request memory while running. Auth epochs, serialized credential writes and a
single-flight refresh reject stale responses after logout/account switching.
Protected routes and IDs/deep links are validated; links never trigger mutations.
Logout/deletion clears queries, credentials, outbox, preferences, wallet cache and
Google application session. Device/server session revocation still needs a live
backend. Backend-first deletion requires re-authentication and explicit text
confirmation before local cleanup; failed deletion preserves the account.

HTTP requests use 15-second timeouts, abort signals, GET-only retries (maximum
two with jitter), mutation idempotency keys and Zod response validation. Query
retries are disabled. Freshness is 30 seconds, memory GC five minutes; active
focus/foreground/reconnect refetches use monotonic freshness and do not duplicate
in-flight requests. Explicit invalidations follow profile/feedback mutations.

Most queries stay in memory. A strict account-scoped wallet-only AsyncStorage
projection is bounded to 12 records/three history pages/250,000 characters and
hydrates as stale after a known user is restored; it cannot authorize offline
login or money. Durable feedback outbox is bounded to 20 entries and replays the
exact payload/idempotency key after restart/reconnect. Ambiguous responses retain
the draft; the backend must atomically preserve and replay the original result.
No optimistic wallet credits are introduced. See DATA_INVENTORY.md for storage.

All customer copy uses AZ/EN/RU resources (AZ default). Epsilon tokens/system fonts,
consistent Lucide icons, 44-point controls and Epsilon Design System + Unslop are
mandatory. FlashList v2 handles paged restaurant/receipt/history/review lists;
expo-image renders fixed-size logos. Motion is transform/opacity on the UI/native
thread with reduced-motion support and teardown. No animation proves real 60fps.

CI validates lint/types/tests/coverage/locales/format/config/contracts/supply chain,
scans secrets and exports Android Hermes under the documented SDK 58 optimizer
settings. `release:check` validates the evidence register; `release:gate` fails
closed for unresolved P0s. Neither builds, deploys nor grants public launch
approval. See RELEASE_ANDROID.md, RELEASE_GATE.md and QA_MATRIX.md.
