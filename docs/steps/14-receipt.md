## STEP 14 — Receipt details  (branch `step/14-receipt`)

Header "Çek" with back. Top: restaurant logo 48 pt (or neutral icon), name (title2), caption "{{branch}} · {{date, time}}", Chip "Təsdiqləndi". Section "Qiymətləndirilə bilən yeməklər": item rows (name; "{{qty}} × {{unit price}}"; trailing: `canRate && rating==null` → small pill "Qiymətləndir"; rated → read-only stars + "Qiymətləndirildi"; `!canRate` → nothing). Footer "Cəmi" Amount. Receipt id (caption, mono) at the bottom. Show `rewardHint` **only if the backend sends it**; never invent reward amounts or rules. Tap item/pill → `/rate/<itemId>`. When all rateable items are rated: primary "Ana səhifəyə qayıt".
**Data:** `useReceipt(id)` with initial data from the resolve result (no second spinner); invalidate after rating. States: skeleton, error retry, claimed/expired → read-only. Long dish names wrap to 2 lines.

**Micro-steps:** 14.a hook + initial data (+ tests) · 14.b header + items list · 14.c status/read-only logic · 14.d footer + rewardHint · 14.e a11y.

**MANUAL CHECK:** opens instantly after scan with no empty flash; qəpik amounts correct.

---
