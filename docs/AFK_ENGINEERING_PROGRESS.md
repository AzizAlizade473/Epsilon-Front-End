# AFK engineering session — progress (2026-11-22)

Branches: front-end `fix/afk-ekassa-restaurants`, back-end `fix/ekassa-import-reliability` (both pushed, not merged).

## Done

| #   | Task                                       | Commit                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | e-kassa "Receipt reading is not available" | BE `27acf5b`, FE `f1ff250` | Root cause from backend log: the JPG **did** reach the backend (twice). On-device OCR text was incomplete, then Gemini answered HTTP 503 (overloaded) → generic `RECEIPT_READER_UNAVAILABLE`. Fixed: one retry on 500/503, distinct `RECEIPT_READER_BUSY` message, OCR coverage trace in the log (no receipt content), dev-only dump of failed imports to `private-fixtures/imports/` (git-ignored; config refuses it in production), dev-only stage trail on the official receipt screen (EKASSA_PAGE_OPENED … RATING_SCREEN_OPENED). |
| 3   | Remove Market tab                          | FE `4edd784`               | Tab, routes (`/supermarkets`, `/supermarket/*`), screens, retail demo data, Market-only Home sections, How-it-works sector switch, 81 translation keys removed. Bar: Home · Restaurants · Profile + Scan. Receipt classifier still recognises supermarkets.                                                                                                                                                                                                                                                                            |
| 4   | Restaurants tab empty                      | FE `4edd784`               | Regression cause: directory, menus, reviews, food photos and demo label were gated on `EXPO_PUBLIC_API_MODE === 'mock'`; phone builds run `live`, and no public-menu API exists → empty tab. New `src/lib/demoContent.ts`: labelled demo catalogue in mock **and development** builds, never production.                                                                                                                                                                                                                               |

Gate after each batch: `npx tsc --noEmit`, `eslint --max-warnings=0`, `jest` 688/688, `i18n:check`, `contract:check`; backend `vitest` 95/95.

## Open / next

1. **Official JPG parser tuning**: needs one real failed import. After the next phone test, files appear in `Epsilon-Back-End/private-fixtures/imports/` (JPG + ML Kit OCR JSON + reason). Use them to fix `src/fiscal/ocr.ts` so official images parse on-device (no Gemini).
2. Task 5 (link scanned restaurant receipts to restaurant profiles by VÖEN + object code): backend `classify.ts` already matches partners by objectCode then VÖEN; demo restaurants have no VÖEN, so no reliable match is possible yet — by design no name-based matching.
3. Web smoke test of Home / Restaurants / profile (in progress), then APK build from `fix/afk-ekassa-restaurants` (live-tunnel profile, uncommitted `eas.json`).

## Not verified

- No Android device here: the e-kassa flow, ML Kit, WebView download are device-only. The PoC on the user's phone did receive `document.jpg, 136058 bytes`.
- Live Gemini after the retry fix (no live calls made by this session).

## Resume

```
git -C Epsilon-Front-End checkout fix/afk-ekassa-restaurants
git -C Epsilon-Back-End checkout fix/ekassa-import-reliability
powershell -ExecutionPolicy Bypass -File %LOCALAPPDATA%\EpsilonTools\start-server.ps1
```
