## STEP 22 — Android audit  (branch `step/22-android-audit`)

**Goal:** prove the Android build is clean and safe. Produce `docs/ANDROID_AUDIT.md`.
Verify on a **release/preview build** and record the result (pass/fail/not verified) for each:
- Merged manifest: only the main activity exported; permissions are only CAMERA (+ POST_NOTIFICATIONS if used); `allowBackup` false; cleartext traffic off (SEC-8).
- Adaptive icon (foreground, background, monochrome) and the Android 12+ splash (logo on plain white, no blur, held until bootstrap ends).
- Edge-to-edge insets with three-button and gesture navigation; status bar icons dark; keyboard never covers primary buttons (test Samsung and Google keyboards).
- Back button behavior on every screen (PART 0 of STEP 02).
- SMS code autofill works on a real phone without READ_SMS.
- Notification channel exists; permission asked only after the user turns a toggle on.
- Text at 1.3× font scale on a 360 dp screen: nothing clipped (UX-3). TalkBack pass on every screen (UX-2).

**Micro-steps:** 22.a manifest/permission audit script + result · 22.b fixes found · 22.c TalkBack and font-scale pass with fixes · 22.d write `docs/ANDROID_AUDIT.md`.

**MANUAL CHECK:** Aziz installs the preview build; no unexpected permission appears; Back works everywhere.

---
