## STEP 15 — Rate a dish (sheet)  (branch `step/15-rate`)

**Sheet content:** dish name (title2) + caption restaurant · "Bu yeməyi necə qiymətləndirirsiniz?" · 5 large stars (48 pt, 56 pt tap area), selection haptic, quick spring 1→1.15→1; label per rating: 1 "Çox pis", 2 "Pis", 3 "Normal", 4 "Yaxşı", 5 "Əla" · if rating ≤ 3: multi-select reason chips (height+opacity 200 ms): "Dadı", "Temperatur", "Porsiya", "Qiymət", "Təqdimat", "Gözləmə vaxtı" · comment Input (3 lines, "Rəyiniz (istəyə bağlı)", counter n/500) · caption "Keşbek rəyin müsbət və ya mənfi olmasından asılı deyil." · primary "Göndər" (disabled until a rating), above the keyboard.
**Behavior:** idempotency key generated on open and kept until success (NET-3). Loading keeps width. Success → `/feedback-done` with item name + reward; invalidate receipt + wallet + transactions. FEEDBACK_ALREADY_SUBMITTED → toast "Bu yemək artıq qiymətləndirilib." and close. NETWORK → inline error with retry; keep the typed comment. Dismiss with unsaved text → confirm "Rəyiniz silinəcək. Çıxmaq istəyirsiniz?" ("Çıx" / "Qal").
**Outbox (REL-2):** before sending, save `{receiptItemId, rating, comment, reasonCodes, idempotencyKey, createdAt}` in a small AsyncStorage outbox (max 20, drop older than 7 days). On success/ALREADY_SUBMITTED remove it. On NETWORK/TIMEOUT or app kill keep it; retry sequentially on next start/foreground and after login; show "Göndərilir…" on that item in the receipt; on VALIDATION error drop it and show a toast. Cleared on logout (AUTH-4). Tests: kill-and-retry, duplicate replay, drop rules.

**Micro-steps:** 15.a outbox module (+ tests) · 15.b star rating component + labels · 15.c reason chips + comment · 15.d submit mutation + idempotency + outbox wiring · 15.e error/dismiss-confirm flows · 15.f retry on start/foreground · 15.g a11y.

**MANUAL CHECK:** double-tapping "Göndər" never sends twice; turn on airplane mode, submit, kill the app, go online, reopen: it is sent once.

---
