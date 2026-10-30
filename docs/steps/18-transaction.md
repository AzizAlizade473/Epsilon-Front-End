## STEP 18 — Transaction detail (sheet)  (branch `step/18-transaction`)

Sheet: 56 pt type icon; signed Amount (title1 size, colored as in the list); status Chip ("Təsdiqləndi" success / "Gözləyir" warning / "Ləğv edildi" danger). Label/value ListRows without chevron: "Restoran", "Filial", "Yemək" (if present), "Tarix" (date + time), "Çek nömrəsi" and "Əməliyyat nömrəsi" (tap to copy → toast "Kopyalandı"). Null values are omitted (no "—" rows). Data: initial data from the list cache, then `WalletService.transaction(id)` refresh. Skeleton only if no cached data.

**Micro-steps:** 18.a sheet + rows + omit-null logic (+ tests) · 18.b copy + toast · 18.c refresh + states.

**MANUAL CHECK:** opens instantly from the list; copy works; TalkBack reads value after label.

---
