# Epsilon Agent Rules

> Always read `docs/PROGRESS.md` first. Android first. One micro-step at a time.

## 1. The Loop (PART 0.1)

- State micro-step ID & goal -> implement ONLY that unit (<= 150 changed lines).
- Run `npm run check` (fix until green; never bypass checks or lower standards).
- Tick `docs/PROGRESS.md` -> stage changed files -> conventional commit -> `git push`.
- Log one line: `✅ <id> · checks green · <hash> · pushed` and continue autonomously.

## 2. Core Pillars (PART 2)

- **SEC**: No secrets/PII in code/logs/URLs; tokens in SecureStore at boot only; client never computes money/eligibility; deep links validated with no auto-actions; production forbids mock/dev URLs (SEC-9); minimal Android permissions (CAMERA, POST_NOTIFICATIONS only when used; allowBackup=false, cleartext=false).
- **NET**: Validate responses with Zod at fetch boundary (`BAD_RESPONSE` fallback); 15s timeout; retry only GET (max 2 with jitter); `Idempotency-Key` on mutations; 401 single-flight refresh then logout; server time authoritative.
- **PERF**: Minimal startup (splash, i18n, storage, query; defer rest); FlashList for lists; `expo-image` at exact display size; 60fps UI-thread animations (transform/opacity); cold start < 2.5s; bundle growth < 10%.
- **REL**: Double-tap safe; feedback survives kill via outbox and retries on start/foreground; foreground refetch; update gate blocks old versions; global error boundary.

## 3. Implementation Invariants

- **Read docs/PROGRESS.md first**: Never skip or reorder steps.
- **Tokens not literals**: Use design tokens from `src/design/` (UX-1). Tap target >= 44x44pt.
- **i18n not literals**: All UI strings in `locales/{az,en,ru}.json` (AZ default).
- **Money via `lib/money`**: Integer qəpik only (never floats); format as `12.50 ₼`.
- **No `any`**: Strict TypeScript, `noUncheckedIndexedAccess`, zero lint warnings.
