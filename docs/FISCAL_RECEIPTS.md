# Fiscal receipt scanning: status and manual testing guide

## Status: partially implemented, e-kassa integration blocked

| Part                                                                                                    | State                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scan e-kassa QR in the existing Scan screen                                                             | Done. Real formats verified on 3 physical receipts (12-char and 44-char `doc`, NUL padding).                                                                                                                                                                                                                    |
| Retrieve the receipt from e-kassa                                                                       | **Blocked.** `monitoring.e-kassa.gov.az` returns each receipt only as a JPEG from an undocumented endpoint behind reCAPTCHA Enterprise (re-checked 2026-11-21). No published API exists. Epsilon does not scrape or bypass it. Access needs a State Tax Service (DVX) or authorised e-kassa operator agreement. |
| Normalized receipt JSON, sector classification, eligibility, multi-user ratings, cashback once per line | Done in the backend behind a provider interface, tested with fixtures.                                                                                                                                                                                                                                          |
| Existing receipt-rating UI showing real merchant, sector, products, totals                              | Done. Renders whatever the backend returns; fixtures are labelled "Test data".                                                                                                                                                                                                                                  |
| Gemini sector advisor                                                                                   | Implemented, **off by default**, mocked in tests. No live Gemini call has been made.                                                                                                                                                                                                                            |

Until an authorised provider exists, a real QR in production returns
`RECEIPT_SOURCE_UNAVAILABLE` and the app shows "Official receipt service unavailable".
No receipt data is invented.

## How data flows

1. App scans the QR and sends it to `POST /v1/receipts/resolve` (`kind: "qr"`).
2. Backend parses it (never fetches the URL), gets the receipt from the configured
   `FiscalProvider` (`none` | `fixture`), validates totals, drops personal fields.
3. Sector: Epsilon partner (establishment code, then VÖEN) > cached decision >
   business-name rules > Gemini (if enabled) > `unknown`. Products never decide the sector.
4. Each user gets their own copy of the shared receipt. Only HoReCa can be rated.
   Partner cashback is paid once per receipt line (database unique claim).
5. The app opens the existing receipt screen; Home lists it via `GET /v1/receipts`.

## Manual testing (local)

### 1. Backend `.env` (Epsilon-Back-End)

```
FISCAL_PROVIDER=fixture        # local test receipts; never in production
GEMINI_ENABLED=false           # set true only when you want to test Gemini
GEMINI_API_KEY=your-key        # server only; never in the app
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_MAX_CALLS_PER_DAY=5
```

`private-fixtures/fiscal/*.json` (git-ignored) holds test receipts keyed by Fiscal ID.
`tam-store.json` is keyed by receipt #9's real Fiscal ID, so scanning that paper
receipt shows TAM STORE marked "Test data".

### 2. Start

```
cd Epsilon-Back-End
npm run db:migrate
npm start
```

App: `npx expo start` with `EXPO_PUBLIC_API_MODE=live` and
`EXPO_PUBLIC_API_URL=http://<PC Wi-Fi IP>:3000/v1` (or a `live-local` build).

### 3. Checks

| Test                        | Expected                                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scan receipt #9 (TAM STORE) | Merchant TAM STORE, sector Supermarket / Retail, "Test data" chip, 2 products, total 2.37, VAT 0.36, unsupported-sector notice, no rating buttons, "Scan another receipt".         |
| Scan any other real receipt | "Official receipt service unavailable" (no provider).                                                                                                                              |
| Restaurant                  | Add a restaurant fixture JSON (copy `tam-store.json`, change merchant name to "... RESTORAN", items and Fiscal ID). Rating buttons appear; "not an Epsilon partner" notice.        |
| Partner cashback            | Set `restaurants.voen` / `branches.object_code` of a partner to the fixture's values (`npm run db:studio`). Rating pays cashback once per line.                                    |
| JSON                        | In a dev build, open "More receipt details" → "Developer: show JSON".                                                                                                              |
| Gemini                      | Use a fixture whose name matches no rule, set `GEMINI_ENABLED=true`, restart, scan once. Category shows "AI suggestion". Each new establishment uses one call; results are cached. |

## What unblocks the real feature

An authorised data source. See the e-kassa operator contacts at
https://e-kassa.gov.az/az/operatorlarla-elaqe and the State Tax Service
(https://e-kassa.gov.az/az/onlayn-elaqe, call centre 195). Request a server-to-server
API returning one receipt by its 12-character Fiscal ID as JSON (merchant, VÖEN,
establishment code, items with quantity/price/VAT, totals, payment, status).
Then implement `FiscalProvider` in
[Epsilon-Back-End `src/fiscal/provider.ts`](https://github.com/AzizAlizade473/Epsilon-Back-End/blob/master/src/fiscal/provider.ts).
