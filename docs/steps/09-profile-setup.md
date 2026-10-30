## STEP 09 — Profile setup  (branch `step/09-profile-setup`)

**Layout:** title1 "Sizi tanıyaq"; Inputs "Ad", "Soyad" (prefilled from Google if present), "Doğum tarixi" (native date picker, default 18 years ago, max today); read-only caption "Hesab: name@gmail.com" if email exists (do not ask again); language SegmentedControl AZ/EN/RU (instant); primary "Davam et". **Rules:** names 2–40 chars, letters/spaces/hyphens/apostrophes incl. ə ı ö ü ç ş ğ; age < `MIN_AGE` → blocking inline "Epsilon-dan istifadə üçün ən azı {{age}} yaşınız olmalıdır." (also on AGE_RESTRICTED). **Data:** `updateProfile` → route by updated `nextStep` (usually `/phone-verify`, else `/home`). react-hook-form + Zod; keyboard safe.

**Micro-steps:** 09.a schema + age rule (+ boundary tests: exactly MIN_AGE allowed, one day short blocked) · 09.b form fields · 09.c date picker · 09.d submit + routing · 09.e a11y.

**MANUAL CHECK:** a new Google user reaches the next step; underage date is blocked.

---
