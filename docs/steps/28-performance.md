## STEP 28 — Performance pass  (branch `step/28-performance`)

Measure on a **low-end Android release build** and on Aziz's phone; write numbers into `docs/PERF_REPORT.md` (before → after). Targets: cold start < 2.5 s, tab switch < 150 ms, 60 fps lists and sheet drag, no frame drops in Scan → Receipt → Rate → Done.
Checklist: Hermes on; bundle analyzed and unused libraries removed; routes lazy so the camera module loads only on scan; FlashList everywhere with correct item sizes; no animated layout properties in lists; images at exact size with stable placeholders (flat color, no blur); no console.log in release; no transparent overlays left mounted; camera unmounted when not focused; React Query persistence only for wallet/transactions; startup path matches PERF-1 (verify the order of work at launch); memory over a long session; backgrounding/foregrounding and process-kill recovery; battery/network sanity.
Fix only what measurements show. No premature memoization.

**Micro-steps:** 28.a baseline measurements · 28.b bundle/startup fixes · 28.c list/animation fixes · 28.d memory/lifecycle checks · 28.e final numbers.

**MANUAL CHECK:** Aziz uses the app for 10 minutes on the low-end phone: no stutter.

---
