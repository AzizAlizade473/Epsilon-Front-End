## STEP 16 — Feedback confirmation  (branch `step/16-feedback-done`)

Centered success circle 72 pt (spring 0.6→1, 280 ms, success haptic); title2 "Təşəkkürlər!"; body "Rəyiniz göndərildi." **Reward line from `FeedbackResult.reward` only:** confirmed → Amount "+{{amount}}" in success color + "Balansınıza əlavə olundu."; pending → "Keşbek təsdiqlənəndən sonra balansınıza əlavə olunacaq."; none → **no reward line** (never promise). Buttons: primary "Digər yeməyi qiymətləndir" (only if rateable items remain → back to the receipt) and ghost "Ana səhifəyə qayıt" (dismiss all, `/home`). Back gesture disabled; hardware Back goes Home. No confetti. Reduce Motion: final state instantly.

**Micro-steps:** 16.a layout + three reward variants (+ tests) · 16.b motion + haptic · 16.c navigation rules.

**MANUAL CHECK:** all three reward variants (use the dev menu) look right.

---
