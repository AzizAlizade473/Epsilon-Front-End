## STEP 17 — Cashback (universal wallet)  (branch `step/17-cashback`)

**Layout:** large title "Keşbek"; hero caption "Balans" + Amount display 56 pt; if pending > 0 Chip "Gözləyən {{amount}}". Empty (zero history): EmptyState icon wallet, "Hələ əməliyyat yoxdur", "Skan etdiyiniz çeklər və qazandığınız keşbeklər burada görünəcək.", primary "Çeki skan et". History: FlashList with sticky date headers ("Bu gün", "Dünən", "12 Oktyabr"); row = leading 40 pt icon by type (earned arrow-down-left on successTint, redeemed arrow-up-right on brand tint, reversed rotate-ccw on warningTint, expired clock on divider); title = source restaurant (or "Keşbek"); subtitle "{{type label}} · {{HH:mm}}" with labels "Qazanılıb", "Xərclənib", "Ləğv edilib", "Müddəti bitib"; trailing signed Amount (earned "+3.20 ₼" success color; redeemed "−3.20 ₼" ink; pending rows muted + caption "Gözləyir"). UX-4 applies. Tap → transaction sheet. **No redeem button, no per-restaurant balance list, no help card.**
**Data:** `useWallet()`, infinite `useWalletTransactions()` (cursor, 20/page), pull-to-refresh, refetch on foreground (REL-3). Reuse `TransactionRow`. States: skeleton (hero + 6 rows), empty, error (hero keeps cached data), offline, end of list. Date grouping uses the device timezone.

**Micro-steps:** 17.a date grouping util (+ tests) · 17.b hero + pending chip · 17.c history list + sticky headers · 17.d row variants (+ tests) · 17.e states + empty · 17.f foreground refetch + a11y.

**MANUAL CHECK:** a long mock history (1000 rows) scrolls at 60 fps.

---
