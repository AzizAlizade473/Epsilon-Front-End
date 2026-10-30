## STEP 19 — Profile hub  (branch `step/19-profile`)

Large title "Profil". Identity block (no card): 64 pt avatar circle with the logo mark on brand tint (no initials, no photo upload), name (title2), masked phone (or email if no phone), small edit IconButton → personal info. Grouped lists (white rounded groups, hairline dividers, 52 pt rows): **HESAB** — "Şəxsi məlumatlar", "Rəylərim" (trailing count), "Bildirişlər", "Dil seçimi" (trailing "AZ"); **TƏHLÜKƏSİZLİK VƏ DƏSTƏK** — "Məxfilik və təhlükəsizlik", "Yardım və dəstək"; separate destructive row "Hesabdan çıx" (confirm sheet "Hesabdan çıxmaq istəyirsiniz?" — "Çıx" / "Ləğv et"). Footer caption "Epsilon v{{version}}". No colored icon boxes, no levels, no achievements. Logout follows AUTH-4. `__DEV__` only: long-press avatar opens the mock scenario menu.

**Micro-steps:** 19.a identity block · 19.b grouped rows + routes · 19.c logout flow + full cleanup (+ test that nothing remains) · 19.d version footer + a11y.

**MANUAL CHECK:** logout then login with another Google account works; nothing from the first account remains.

---
