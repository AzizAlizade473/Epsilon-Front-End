## STEP 06 — Phone sign-in  (branch `step/06-phone`)

**Layout:** Header with back; title1 "Telefon nömrənizi daxil edin"; helper "Təsdiq kodu SMS ilə göndəriləcək."; row: fixed "+994" chip + 56 pt input (number-pad, autofocus, telephone autofill); button "Kod göndər" pinned above the keyboard. **Format** while typing "50 123 45 67"; accept pasted "+994501234567"/"0501234567"; validate Azerbaijan mobile prefixes (50, 51, 55, 70, 77, 99, 10, 60) + 7 digits with Zod; disabled until valid; error "Nömrə düzgün deyil." **Data:** `AuthService.requestOtp` → `{retryAfterSeconds}`; RATE_LIMITED → "Çox cəhd edildi. Bir az sonra yenidən yoxlayın."; NETWORK → toast. AUTH-2: the UI never says whether the number exists. Success → push `/otp`.
**Extract shared components now:** `PhoneField`, `OtpInput`, `ResendTimer` in `features/auth/components` (reused in STEP 10).

**Micro-steps:** 06.a phone schema + formatter (+ tests) · 06.b `PhoneField` · 06.c screen + keyboard-safe button · 06.d request mutation + errors · 06.e a11y + test.

**MANUAL CHECK:** keyboard never covers the button; paste formats are normalized.

---
