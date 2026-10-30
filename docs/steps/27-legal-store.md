## STEP 27 — Legal and store-readiness documents  (branch `step/27-legal-store`)

These are **inputs for a lawyer and for the stores**, not final legal texts. Do not copy generic policies.
- `docs/DATA_INVENTORY.md`: a table of every data item the app/backend handles — phone, name, email, birth date, language, Google account id, receipt data (restaurant, items, amounts, time), feedback ratings/comments, wallet ledger, push token, IP/request logs, crash reports — with purpose, where stored, who can access, retention, deletion behavior, protection (encryption in transit/at rest).
- `docs/LEGAL_TODO.md`: Privacy Policy, Terms of Service, Rewards/Cashback Terms, account deletion & retention policy, restaurant agreements, vendor data-processing agreements, security-incident procedure, open-source license review, trademark permissions (LEG-2); plus lawyer questions: cashback classification, Azerbaijan personal-data law (consent, registration, cross-border transfer and hosting location), consumer/advertising rules, minimum age.
- `docs/INCIDENT_RESPONSE.md`: who does what in an outage or breach, how to revoke sessions/keys, how to notify users and authorities, rollback steps.
- Store readiness (feeds STEP 29): listing text AZ/EN/RU, screenshots plan (real builds, no fake data visible), Data safety answers draft (collected: phone, name, email, birth date, feedback, wallet transactions, crash reports; no ads, no tracking, no data sale; encrypted in transit; deletion available), a **web page spec for account-deletion requests** (Google Play requires a public deletion URL as well as in-app deletion — verify the current policy), reviewer access plan from STEP 26.

**Micro-steps:** 27.a data inventory · 27.b legal TODO + lawyer questions · 27.c incident response · 27.d store-readiness drafts.

**MANUAL CHECK:** Aziz reviews the inventory for anything that is missing or wrongly described.

---
