## STEP 02 — Navigation shell, tab bar, Sheet  (branch `step/02-navigation`)

**Goal:** clear orientation everywhere; transitions are smooth and consistent.

- **Root layout:** providers order Theme → I18n → Query → Auth → Toast → OfflineBanner. Splash stays visible until i18n + token read + auth bootstrap finish, then fades 200 ms (PERF-1).
- **Routes:** `(onboarding)`, `(auth)`, `(tabs)`, `scan` (full-screen modal, slide from bottom), `receipt/[receiptId]` (push), `rate/[receiptItemId]` and `cashback/transaction/[id]` (**transparent modal rendering `<Sheet>`**, animation none), `feedback-done` (fade, gesture disabled), `profile/*` (push).
- **Bootstrap redirect (`app/index.tsx`):** no onboarding flag → welcome; no session → welcome/phone; user state decides: missing name/birth date → `/profile-setup`; phone required and unverified → `/phone-verify`; else `/home`. (Later driven by `nextStep` and `/config`.)
- **Tab bar** (custom `TabBar`): Ana səhifə (house), Restoranlar (store), center Skan (scan-line), Keşbek (wallet), Profil (user). White, hairline top border, height 64 + inset. Active: ink icon+label; inactive: inkMuted. Center button: 56 pt brand circle raised 12 pt, spring scale 0.94 + haptic, **pushes `/scan`** (it is not a real tab). The bar never moves; tab content cross-fades 150 ms.
- **`Sheet`:** Reanimated + gesture-handler (or `@gorhom/bottom-sheet` only if compatible with the installed Reanimated; check docs). Dim overlay (no blur), handle, drag-to-dismiss, snap points, keyboard-aware, Android Back closes it, focus moves into it, bottom inset padding. Open spring 280 ms, close 200 ms; Reduce Motion = fade.
- **Back button:** each screen defines it; from a tab root Back exits; sheets and the scan modal close on Back.
- **Deep links:** scheme `epsilon://`; params validated with Zod (SEC-6).
- Screens are stubs that only show their title.

**Micro-steps:** 02.a root layout + providers + splash gate · 02.b route skeleton with stubs and typed routes · 02.c TabBar + center button · 02.d Sheet + transparent-modal wiring · 02.e bootstrap redirect + deep-link param schemas (+ tests) · 02.f Back-button behavior.

**MANUAL CHECK:** every route opens/closes with the right transition; tab bar is stable; no white flash at launch; Back works on all screens.

---
