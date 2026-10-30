## STEP 10 — Phone verification for any account  (branch `step/10-phone-verify`)

**Goal:** link a verified phone to the signed-in account (anti-fraud anchor). Reuse `PhoneField`, `OtpInput`, `ResendTimer`.
**Copy:** title1 "Telefon nömrənizi təsdiqləyin"; body "Hesabınızı qorumaq və keşbeki təhlükəsiz hesablamaq üçün nömrənizi bir dəfə təsdiqləməlisiniz."; button "Kod göndər". Code screen as STEP 07 but calls `verifyPhoneLink`. **Errors:** PHONE_IN_USE → sheet "Bu nömrə başqa hesaba bağlıdır." with "Başqa nömrə yaz" (primary) and "Dəstəklə əlaqə" (ghost); no automatic merging. **Behavior:** cannot be skipped when `requirePhoneVerification` is true (no back to Welcome; a "Hesabdan çıx" ghost link is allowed). If the flag is false: "İndi yox" → Home plus a gentle banner on Home/Cashback ("Keşbek almaq üçün nömrəni təsdiqləyin") that returns here. Killing the app at any onboarding step resumes at the right step.

**Micro-steps:** 10.a phone-verify entry screen · 10.b code screen · 10.c PHONE_IN_USE sheet · 10.d skip/banner logic by config · 10.e resume-at-step tests.

**MANUAL CHECK:** Google user: Google → profile → phone → Home; kill the app mid-way and reopen.

---
