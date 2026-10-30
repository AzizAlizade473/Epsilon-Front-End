## STEP 20 — Profile sub-screens  (branch `step/20-profile-sub`)

1. **Personal info:** Inputs "Ad", "Soyad" (editable); read-only "Telefon" (caption "Telefon nömrəsini dəyişmək üçün dəstəklə əlaqə saxlayın.") and "Doğum tarixi"; read-only group "Daxil olma üsulları" listing linked identities (Telefon, Google + email). "Yadda saxla" only when dirty; toast "Yadda saxlanıldı".
2. **My reviews:** FlashList (dish, restaurant, date, read-only stars, 2-line comment preview); empty "Hələ rəy yoxdur" / "Qiymətləndirdiyiniz yeməklər burada görünəcək."; infinite scroll.
3. **Notifications:** switches "Keşbek yenilikləri" (default on), "Yeni partnyor restoranlar" (default off); caption "Reklam bildirişləri yalnız razılığınızla göndərilir." Ask the OS permission only when the user turns something on (Android 13+ POST_NOTIFICATIONS), after a short explanation; one notification channel "Keşbek yenilikləri"; register the device token via `NotificationService` (no sensitive payloads, SEC-3).
4. **Language:** three radio rows AZ "Azərbaycan dili", EN "English", RU "Русский"; applies instantly, saved locally, synced to backend.
5. **Privacy:** "Məxfilik siyasəti", "İstifadə şərtləri" (expo-web-browser); static text "Məlumatlarımın istifadəsi" (no tracking, no ads, what is stored); toggle "Xəta hesabatları göndər" (crash reports, STEP 23); destructive "Hesabı sil": sheet 1 explains consequences and shows the backend `deletionWarning` if present (PRIV-2; never invent policy), then **re-authentication** (AUTH-3: fresh OTP or fresh Google sign-in), then sheet 2 requires typing "SİL" (or "DELETE" / "УДАЛИТЬ" by language), then `UserService.deleteAccount()`, Google `signOut` + `revokeAccess` (ignore errors), clear everything, go to Welcome.
6. **Help:** FAQ accordion (4 static Q&As: how scanning works, why a receipt may be unsupported, when cashback is confirmed, how to delete the account — honest and generic, no invented rules) + "Dəstəklə əlaqə" (`mailto:` env support email).

**Micro-steps:** 20.a personal info · 20.b my reviews · 20.c notifications + permission flow · 20.d language · 20.e privacy links + crash toggle · 20.f delete flow with re-auth (+ tests) · 20.g help.

**MANUAL CHECK:** deleting a mock account clears all local data; language switch updates open screens instantly.

---
