# Restaurant brand assets

Bundled chain logos in `assets/brands/`, used only to identify the restaurant a
customer ate at (receipt, rating sheet, Home, restaurant pages, review history).
A logo never means the restaurant is an Epsilon partner: partnership comes only
from the server (`fiscal.partner.isPartner`).

Each file is a 500 px (long side) transparent PNG rendered locally from the original SVG on Wikimedia Commons, downloaded
on 2026-11-24, unmodified (original colours and proportions; shown with
`resizeMode="contain"` on a white tile, never cropped or recoloured).

| Brand       | File              | Source (Wikimedia Commons)        | Copyright               | Trademark                                                                                                                           |
| ----------- | ----------------- | --------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| KFC         | `kfc.png`         | File:KFC Logo.svg (red)           | Public domain (Commons) | Trademarked: identification only                                                                                                    |
| McDonald's  | `mcdonalds.png`   | File:McDonald's Golden Arches.svg | Public domain (Commons) | Trademarked: identification only                                                                                                    |
| Burger King | `burger-king.png` | File:Burger King 2020.svg         | Public domain (Commons) | Trademarked: identification only                                                                                                    |
| Papa John's | `papa-johns.png`  | File:Papa John's 2019 logo.svg    | Public domain (Commons) | Trademarked: identification only                                                                                                    |
| Domino's    | `dominos.png`     | File:Domino's pizza logo.svg      | Public domain (Commons) | Trademarked: identification only                                                                                                    |
| Pizza Hut   | `pizza-hut.png`   | File:Pizza Hut 2025.svg           | Public domain (Commons) | Trademarked: identification only                                                                                                    |
| Starbucks   | `starbucks.png`   | File:Starbucks-wordmark-green.svg | Public domain (Commons) | Trademarked: identification only. The siren emblem is not freely licensed (not on Commons), so the official green wordmark is used. |

"Public domain" is the copyright status Commons records for these files (simple
text and geometric marks). Trademark rights still apply: the logos are shown
only to name the restaurant, never to suggest endorsement or partnership.

## Pending

- **Papa John's** (File:Papa John's 2019 logo.svg) and **Starbucks**
  (File:Starbucks-wordmark-green.svg): Wikimedia rate-limited the downloads
  (HTTP 429). Both brands are matched already and show the neutral mark until
  the files are added; their table rows describe the intended files.

## Not used

- **Brandfetch / Logo.dev**: both need an API key. A key shipped in the app
  would be public; a server proxy is possible later. No receipt data, fiscal
  IDs or customer data are ever sent to a logo provider.
- **KFC / McDonald's media libraries**: press portals with their own terms and
  sign-ups; the Commons files above are the same marks.

## Matching

`src/lib/brands.ts` matches a chain only when the receipt's establishment name
_is_ the brand or _starts with_ it followed by a separator (`KFC-VAĞZAL` is
KFC; `KFCX`, `MY KFC KEBAB` are not). Partners keep their own `logoUrl` from the
server. Unknown restaurants show a neutral shop mark. A missing or failing image
falls back to the neutral mark and never blocks rating.

To add a chain: add the PNG here with its source row, then an entry in
`brands.ts` (aliases upper-case, official domain).
