## STEP 11 — Home  (branch `step/11-home`)

**Goal:** orientation in one glance: balance, one action, recent activity. Nothing else.
**Layout (scroll, pull-to-refresh):** top bar 56 pt — logo mark 28 pt left, ONE bell right (no badge at 0), no title · greeting callout "Salam, {{firstName}}" · caption "Ümumi keşbek" + **Amount at display size (56 pt)** e.g. "0.00 ₼" · if `pendingMinor > 0`: warning Chip "Gözləyən {{amount}}" · caption "Keşbek bütün partnyor restoranlarda toplanır." (remove if funding rules change) · primary button 56 pt "Çeki skan et" + centered caption "Yeməkləri qiymətləndirin və keşbek qazanın." · section "Son fəaliyyət" with right link "Hamısına bax" (→ Keşbek tab) · latest 3 `TransactionRow`s; empty: "Hələ fəaliyyət yoxdur." No cards around the balance, no banners, no tips.
**Data:** `useWallet()`, `useWalletTransactions({limit:3})` in `features/cashback/hooks` (shared). **States:** loading skeleton (balance 200×56 + 3 rows, same heights as final); error inline with retry (scan button stays usable); offline keeps cached data + banner. **Motion:** count-up only when the value changes (not on first render at 0); row stagger once; press scale + haptic. **A11y:** balance read as "Ümumi keşbek, 12 manat 50 qəpik".

**Micro-steps:** 11.a `useWallet` + `useWalletTransactions` hooks (+ tests) · 11.b shared `TransactionRow` · 11.c Home layout + strings · 11.d states (skeleton/error/offline) · 11.e count-up + motion · 11.f a11y + test.

**MANUAL CHECK:** pull-to-refresh works; no layout jump when data arrives; scan button opens the scan modal.

---
