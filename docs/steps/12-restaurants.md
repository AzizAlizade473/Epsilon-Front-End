## STEP 12 — Restaurants  (branch `step/12-restaurants`)

Large collapsing title "Restoranlar"; search pill 48 pt "Restoran axtar" (clear button); FlashList of rows (logo 40 pt via expo-image or neutral store icon, name, caption "{{n}} filial"). **Empty (launch state):** icon store + "Restoranlar tezliklə burada görünəcək." (no fake rows). No-result: "Heç nə tapılmadı" / "Başqa ad yoxlayın." Debounce 300 ms, cursor pagination via `RestaurantService.list`. Rows are **not tappable** (no chevron) until a detail screen exists. States: loading skeleton, error, empty, no-results, offline. LEG-2: logos only from the backend.

**Micro-steps:** 12.a hook + keys + infinite query (+ tests) · 12.b list + row · 12.c search + debounce · 12.d states + strings.

**MANUAL CHECK:** typing never janks; empty state shows against the real empty backend response.

---
