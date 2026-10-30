## STEP 05 — Welcome / sign-in options  (branch `step/05-welcome`)

**Layout (20 pt margins):** logo mark 40 pt (assets/brand/logo.svg) · title1 "Yeməyi qiymətləndir, keşbek qazan" · body "Çekinizi skan edin, yeməkləri qiymətləndirin və keşbek balansınıza əlavə olunsun." · three steps as ListRows (scan-line, star, wallet): "Çeki skan edin" / "Yeməyi qiymətləndirin" / "Keşbek qazanın" · bottom stack (12 pt gaps, 56 pt, pill): Apple button (**only if `ENABLE_APPLE_SIGNIN`**, native Apple button), **Google button** (white, hairline border, official multicolor "G" from bundled SVG, label "Google ilə davam et", per Google branding guidelines), divider "və ya", brand-filled **"Telefon nömrəsi ilə davam et"** · caption "Davam etməklə İstifadə Şərtləri və Məxfilik Siyasəti ilə razı olursunuz." (links via expo-web-browser).
**Rules:** hide any button whose flag is off; while a sign-in runs all buttons are disabled and the tapped one shows loading (no width change). **Motion:** title/steps/buttons fade-up with 40 ms stagger; press scale + haptic. No illustration, no carousel.

**Micro-steps:** 05.a layout + strings · 05.b buttons (Google official style, phone primary) + flags · 05.c legal links caption · 05.d motion + a11y labels ("Google ilə davam et", "Telefon nömrəsi ilə davam et") + test.

**MANUAL CHECK:** screen is correct on a small Android; buttons respond; legal links open.

---
