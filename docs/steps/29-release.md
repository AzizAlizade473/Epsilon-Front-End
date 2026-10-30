## STEP 29 — Release and release gate  (branch `step/29-release`)

- EAS `production` builds an AAB; a Google Play submit profile (service-account key in EAS secrets, never in git).
- `docs/RELEASE_ANDROID.md`: developer account verified; app created; Play App Signing ON → copy the Play signing SHA-1 into the Google Cloud Android OAuth client; store listing; privacy policy URL live; Data safety form; account deletion in-app + public URL; content rating; target audience (not for children); **Internal testing first**; check Google's current requirements for new developer accounts (closed-testing period/testers) before planning production; target API level; staged rollout with halt/rollback steps; EAS Update rollback.
- `docs/RELEASE_GATE.md`: the production-readiness checklist below. **Release is blocked while any critical item is unchecked.**

**Security:** [ ] no secrets in the app · [ ] sessions in SecureStore only · [ ] backend authorization and restaurant isolation verified · [ ] validation and rate limits live · [ ] security testing done (backend).
**Financial integrity:** [ ] server-only cashback · [ ] duplicate-receipt prevention verified · [ ] concurrency-safe ledger verified · [ ] refunds/reversals handled · [ ] reconciliation and fraud monitoring running.
**Reliability:** [ ] unit + component + E2E pass · [ ] offline and network-failure tests pass · [ ] real-device matrix verified (small, normal, large, low-end Android) · [ ] no known critical crash or data-loss bug · [ ] backup restore tested.
**Legal:** [ ] Privacy Policy, Terms, Rewards Terms reviewed by a lawyer · [ ] data protection implemented · [ ] account deletion works (app + web URL) · [ ] store policies reviewed · [ ] cashback regulation and restaurant agreements reviewed.
**Operations:** [ ] CI/CD green · [ ] crash monitoring live · [ ] rollback tested · [ ] incident roles assigned · [ ] store materials ready.
**Final principles:** the client is never trusted for money; every important request is validated and authorized on the server; financial operations are atomic, idempotent and auditable; abnormal conditions are tested, not only happy paths; **never publish with an unresolved critical security, financial-integrity or data-loss defect.**

**Micro-steps:** 29.a EAS production + submit profile · 29.b `RELEASE_ANDROID.md` · 29.c `RELEASE_GATE.md` · 29.d internal-testing build installed from Google Play and walked through (sign in with Google, scan a staging receipt, rate, see the wallet) · 29.e staged-rollout plan.

**MANUAL CHECK:** the internal-testing install from Google Play (not a local APK) completes the whole flow.

---
