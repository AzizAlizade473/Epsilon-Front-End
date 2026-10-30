## STEP 21 — Global states and resilience  (branch `step/21-resilience`)

- **OfflineBanner** (NetInfo): slim bar under the inset, "İnternet bağlantısı yoxdur", slides down 200 ms; on reconnect shows "Bağlantı bərpa olundu" for 1.5 s (success color). Never blocks the UI. React Query `onlineManager` pauses/resumes.
- **ErrorBoundary:** full-screen ErrorState "Nəsə səhv getdi" + "Yenidən yüklə"; logs only a scrubbed error (SEC-3).
- **Toast queue:** one visible at a time.
- **+not-found:** "Səhifə tapılmadı" + "Ana səhifəyə qayıt".
- **Session expiry:** toast "Sessiyanız bitdi. Yenidən daxil olun." → Welcome.
- **Update gate (REL-4):** `/config.minAppVersion` → full-screen "Yeniləmə tələb olunur" with a Play Store link.
- **BAD_RESPONSE** path: generic error, never a crash; unit-tested.
- Uniform pull-to-refresh style. Device clock is never used for decisions (NET-6): add a test that a wrong device date changes nothing.

**Micro-steps:** 21.a OfflineBanner + online manager · 21.b ErrorBoundary + test (throw in a child) · 21.c toast queue · 21.d not-found + session expiry · 21.e update gate · 21.f BAD_RESPONSE + clock tests.

**MANUAL CHECK:** airplane mode: all tabs show cached data + banner; no infinite spinners anywhere; set the phone clock to a wrong date: the app behaves normally.

---
