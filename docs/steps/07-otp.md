## STEP 07 — SMS code  (branch `step/07-otp`)

**Layout:** back; title1 "Kodu daxil edin"; body "{{phone}} nömrəsinə göndərilən 6 rəqəmli kodu yazın." (phone masked "+994 50 ••• •• 67"); 6 boxes (48×56 pt) driven by **one hidden TextInput** (paste, `textContentType="oneTimeCode"`, `autoComplete="sms-otp"`; **no READ_SMS permission**); resend "Kodu yenidən göndər" / "{{s}} san. sonra yenidən göndər". **Behavior:** auto-submit at 6 digits; verifying = boxes disabled at opacity 0.6; OTP_INVALID → shake (±8 pt ×3, 240 ms), error haptic, clear, "Kod yanlışdır. Yenidən cəhd edin."; OTP_EXPIRED → "Kodun müddəti bitib. Yeni kod göndərin."; OTP_TOO_MANY → lock for the returned duration. **Data:** `verifyOtp` → `AuthResult`; save session (SEC-2) and route by `nextStep`. Reduce Motion: color flash instead of shake.

**Micro-steps:** 07.a `OtpInput` + `ResendTimer` (+ tests) · 07.b screen + verify mutation · 07.c error states + shake · 07.d session save + routing by `nextStep` (+ tests) · 07.e a11y.

**MANUAL CHECK:** SMS autofill works on your phone; resend timer survives leaving and returning.

---
