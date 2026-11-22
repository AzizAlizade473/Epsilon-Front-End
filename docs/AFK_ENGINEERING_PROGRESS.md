# AFK engineering session — progress (2026-11-22)

Branches: front-end `fix/afk-ekassa-restaurants`, back-end `fix/ekassa-import-reliability` (both pushed, not merged).

## Done

| #   | Task                                       | Commit                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | e-kassa "Receipt reading is not available" | BE `27acf5b`, FE `f1ff250` | Root cause from backend log: the JPG **did** reach the backend (twice). On-device OCR text was incomplete, then Gemini answered HTTP 503 (overloaded) → generic `RECEIPT_READER_UNAVAILABLE`. Fixed: one retry on 500/503, distinct `RECEIPT_READER_BUSY` message, OCR coverage trace in the log (no receipt content), dev-only dump of failed imports to `private-fixtures/imports/` (git-ignored; config refuses it in production), dev-only stage trail on the official receipt screen (EKASSA_PAGE_OPENED … RATING_SCREEN_OPENED). |
| 3   | Remove Market tab                          | FE `4edd784`               | Tab, routes (`/supermarkets`, `/supermarket/*`), screens, retail demo data, Market-only Home sections, How-it-works sector switch, 81 translation keys removed. Bar: Home · Restaurants · Profile + Scan. Receipt classifier still recognises supermarkets.                                                                                                                                                                                                                                                                            |
| 4   | Restaurants tab empty                      | FE `4edd784`               | Regression cause: directory, menus, reviews, food photos and demo label were gated on `EXPO_PUBLIC_API_MODE === 'mock'`; phone builds run `live`, and no public-menu API exists → empty tab. New `src/lib/demoContent.ts`: labelled demo catalogue in mock **and development** builds, never production.                                                                                                                                                                                                                               |

| QA | Demo reviews showed "Verified purchase"; boot error swallowed | FE `fe8638f` | Demo reviews now "Demo review"; dev builds log the boot failure cause. |
| QA | Home title still "Explore products & dishes" | FE `d94cc6b` | Dishes-only strings (az/en/ru). |
| 2 | Official JPG parsed incomplete ("line 1, all product lines") | BE `e18a5aa` | Real dump (136,058-byte JPG, complete receipt, 49 OCR lines) showed OCR text was fine; the item regex needed a bare unit + quantity, but the official image prints `(ədəd)` (read `(ədad)`) and OCR drops the lone quantity `1`. Now: bracketed unit, optional quantity derived only when total ÷ price is exact, `№`→`Ne`, wrapped `kodu:`, `*ƏV` marker, wrapped legal name/address. Real receipt → TAM STORE, №462, 13.11.2026 20:29:34, 1 × MOLOQORSK QAT. SUD 8.5 3 40GR PET, 1.79, engine `on_device_ocr` (no Gemini); verified privately through `POST /receipts/fiscal/import`. |
Gate after each batch: `npx tsc --noEmit`, `eslint --max-warnings=0`, `jest` 688/688, `i18n:check`, `contract:check`; backend `vitest` 95/95.

## Open / next

1. Parser fixed for the official layout (see row 2). Not built yet: a product-correction screen when only some fields are uncertain (prompt Step 4); today a partial read still shows the incomplete-receipt panel with retry / saved-image import.
2. Task 5 (link scanned restaurant receipts to restaurant profiles by VÖEN + object code): backend `classify.ts` already matches partners by objectCode then VÖEN; demo restaurants have no VÖEN, so no reliable match is possible yet — by design no name-based matching.
3. Web smoke test done in mock mode (web only supports mock previews by design): welcome → mock login → Home (wallet, pending, explore dishes) → Restaurants (populated, "Preview data") → profile (menu categories, photos, ratings, reviews) → dish page → Profile. No console errors.
4. APK build `1d549d8b` from `fe8638f` (live-tunnel profile).

## Not verified

- No Android device here: the e-kassa flow, ML Kit, WebView download are device-only. The PoC on the user's phone did receive `document.jpg, 136058 bytes`.
- Live Gemini after the retry fix (no live calls made by this session).

## Resume

```
git -C Epsilon-Front-End checkout fix/afk-ekassa-restaurants
git -C Epsilon-Back-End checkout fix/ekassa-import-reliability
powershell -ExecutionPolicy Bypass -File %LOCALAPPDATA%\EpsilonTools\start-server.ps1
```
