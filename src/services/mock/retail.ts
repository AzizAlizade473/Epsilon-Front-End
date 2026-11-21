import type { CatalogLanguage } from '@/services/contracts/restaurant-catalog';
import type {
  Listing,
  PackShape,
  ProductReview,
  RetailAttribute,
  RetailCatalog,
  RetailCategory,
  RetailProduct,
  Supermarket,
} from '@/services/contracts/retail';
import { CHAINS, CHECKED_ON, PRODUCTS, type ProductFact } from './retail-data';

/**
 * Retail concept demo. Chains and products are REAL and source-referenced
 * (retail-data.ts); none of these retailers is an Epsilon partner. Every
 * rating and review here is simulated and labelled as demo content; nothing
 * reaches a backend, the wallet or activity.
 */
type L3 = [az: string, en: string, ru: string];
const LANG: Record<CatalogLanguage, 0 | 1 | 2> = { az: 0, en: 1, ru: 2 };

/** Category-appropriate questions: no "taste" for detergent, no "texture" for water. */
const ATTRIBUTES: Record<RetailCategory, RetailAttribute[]> = {
  dairy: ['taste', 'freshness', 'packaging', 'value'],
  yogurt: ['taste', 'texture', 'packaging', 'value'],
  bakery: ['taste', 'freshness', 'texture', 'value'],
  beverages: ['taste', 'packaging', 'value'],
  snacks: ['taste', 'texture', 'packaging', 'value'],
  produce: ['freshness', 'taste', 'value'],
  meat: ['freshness', 'quality', 'packaging', 'value'],
  pantry: ['quality', 'taste', 'packaging', 'value'],
  household: ['effectiveness', 'quality', 'packaging', 'value'],
};
/** Neutral illustration per category (no brand artwork reproduced). */
const ART: Record<
  RetailCategory,
  { shape: PackShape; color: string; accent: string }
> = {
  dairy: { shape: 'carton', color: '#FFFFFF', accent: '#2F67B2' },
  yogurt: { shape: 'cup', color: '#F4F6FB', accent: '#534C9C' },
  bakery: { shape: 'loaf', color: '#C98B4E', accent: '#6B3E1E' },
  beverages: { shape: 'bottle', color: '#BFE3F2', accent: '#1D5E8C' },
  snacks: { shape: 'bag', color: '#2F67B2', accent: '#F2C94C' },
  produce: { shape: 'tray', color: '#D93B30', accent: '#3F8F3A' },
  meat: { shape: 'tray', color: '#C2474B', accent: '#282973' },
  pantry: { shape: 'box', color: '#E8D3A8', accent: '#8A5A2B' },
  household: { shape: 'bottle', color: '#F6E05E', accent: '#2F67B2' },
};

/** Simulated comment pools by category family and sentiment. */
type Pool = Record<'good' | 'mixed' | 'bad', L3[]>;
const FOOD: Pool = {
  good: [
    [
      'Dadı çox yaxşıdır, yenə alacağam.',
      'Tastes great, I would buy it again.',
      'Очень вкусно, куплю ещё.',
    ],
    [
      'Qiymətinə görə keyfiyyəti yaxşıdır.',
      'Good quality for the price.',
      'Хорошее качество за свою цену.',
    ],
    [
      'Qablaşdırma rahatdır, həmişə təzə olur.',
      'Convenient pack and always fresh.',
      'Удобная упаковка, всегда свежий.',
    ],
  ],
  mixed: [
    [
      'Pis deyil, amma qiyməti bir az yüksəkdir.',
      'Not bad, but a little pricey.',
      'Неплохо, но немного дороговато.',
    ],
    [
      'Dadı normaldır, qablaşdırma daha rahat ola bilərdi.',
      'Taste is fine; the pack could open more easily.',
      'Вкус нормальный, упаковку можно сделать удобнее.',
    ],
    [
      'Bəzən çox yaxşı olur, bəzən orta.',
      'Sometimes very good, sometimes average.',
      'Иногда очень хорошо, иногда средне.',
    ],
  ],
  bad: [
    [
      'Gözlədiyim kimi deyildi.',
      'Not what I expected.',
      'Не то, что я ожидал.',
    ],
    ['Bu qiymətə dəyməz.', 'Not worth the price.', 'Не стоит своих денег.'],
  ],
};
const DAIRY: Pool = {
  good: [
    [
      'Dadı təbiidir, uşaqlar da sevir.',
      'Natural taste, the kids like it too.',
      'Натуральный вкус, детям тоже нравится.',
    ],
    [
      'Həmişə təzədir, son istifadə tarixi uzundur.',
      'Always fresh with a long best-before date.',
      'Всегда свежее, долгий срок годности.',
    ],
  ],
  mixed: [
    [
      'Dadı yaxşıdır, amma qapağı bəzən axır.',
      'Tastes good, but the cap sometimes leaks.',
      'Вкус хороший, но крышка иногда подтекает.',
    ],
    [
      'Bir az durudur, daha qatı olsa yaxşı olardı.',
      'A bit thin; I would prefer it creamier.',
      'Немного жидковато, хотелось бы гуще.',
    ],
  ],
  bad: [
    [
      'Bir dəfə turş çıxdı.',
      'Once it had already turned sour.',
      'Однажды оказалось прокисшим.',
    ],
  ],
};
const YOGURT: Pool = {
  good: [
    [
      'Dadı xoşdur, porsiya ölçüsü rahatdır.',
      'Nice flavour and a convenient portion size.',
      'Приятный вкус и удобная порция.',
    ],
    [
      'Meyvə dadı təbii hiss olunur.',
      'The fruit flavour feels natural.',
      'Фруктовый вкус ощущается натуральным.',
    ],
  ],
  mixed: [
    [
      'Dadını bəyənirəm, amma bir az çox şirindir.',
      'I like the flavour, but it is a bit too sweet.',
      'Вкус нравится, но слишком сладко.',
    ],
    [
      'Konsistensiya daha qatı ola bilərdi.',
      'The texture could be thicker.',
      'Консистенция могла бы быть гуще.',
    ],
    [
      'Daha az şəkər və daha çox protein istərdim.',
      'I would like less sugar and more protein.',
      'Хотелось бы меньше сахара и больше белка.',
    ],
  ],
  bad: [
    [
      'Çox şirindir, meyvə az hiss olunur.',
      'Far too sweet; you barely taste the fruit.',
      'Слишком сладко, фрукты почти не чувствуются.',
    ],
  ],
};
const CLEAN: Pool = {
  good: [
    [
      'Yağı asanlıqla təmizləyir, az istifadə olunur.',
      'Removes grease easily; a little goes a long way.',
      'Легко удаляет жир, расход небольшой.',
    ],
    [
      'Ətri xoşdur və uzun müddət qalır.',
      'Pleasant scent that lasts.',
      'Приятный стойкий аромат.',
    ],
  ],
  mixed: [
    [
      'Yaxşı təmizləyir, amma qapağı axır.',
      'Cleans well, but the cap leaks.',
      'Хорошо моет, но крышка подтекает.',
    ],
    [
      'Normaldır, daha konsentrat ola bilərdi.',
      'It is fine; could be more concentrated.',
      'Нормально, но могло бы быть концентрированнее.',
    ],
  ],
  bad: [
    [
      'Ləkələri yaxşı çıxarmadı.',
      'Did not remove stains well.',
      'Плохо выводит пятна.',
    ],
  ],
};
const POOLS: Partial<Record<RetailCategory, Pool>> = {
  dairy: DAIRY,
  yogurt: YOGURT,
  household: CLEAN,
};
/** Clearly simulated reviewer handles. */
const AUTHORS = [
  'Demo A.',
  'Demo L.',
  'Demo R.',
  'Demo S.',
  'Demo N.',
  'Demo T.',
  'Demo O.',
  'Demo G.',
  'Demo K.',
];
/** Fixed anchor: demo dates never depend on the device clock. */
const ANCHOR = Date.UTC(2026, 10, 10, 12);
const DAY = 86_400_000;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Deterministic simulated star ratings: 3–9 per product, varied means. */
function simulatedRatings(id: string): number[] {
  let seed = hash(id);
  const next = () =>
    ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0) % 1000) / 1000;
  const count = 3 + Math.floor(next() * 7);
  const bias = 3.4 + next() * 1.4;
  return Array.from({ length: count }, () =>
    Math.min(5, Math.max(1, Math.round(bias + (next() - 0.5) * 2.4))),
  );
}

function reviewsFor(p: ProductFact, lang: 0 | 1 | 2): ProductReview[] {
  const pool = POOLS[p.category] ?? FOOD;
  const used = { good: 0, mixed: 0, bad: 0 };
  return simulatedRatings(p.id).map((rating, index) => {
    const band = rating >= 5 ? 'good' : rating >= 3 ? 'mixed' : 'bad';
    const list = pool[band];
    const comment = list[(used[band]++ + p.id.length) % list.length]!;
    const scores = Object.fromEntries(
      ATTRIBUTES[p.category].map((a, i) => [
        a,
        Math.min(5, Math.max(1, rating + (((index + i * 2) % 3) - 1))),
      ]),
    ) as ProductReview['scores'];
    return {
      id: `${p.id}_d${String(index + 1).padStart(2, '0')}`,
      productId: p.id,
      supermarketId: p.chains[index % p.chains.length]!,
      rating,
      scores,
      comment: comment[lang],
      createdAt: new Date(
        ANCHOR - (index * 11 + (hash(p.id) % 7)) * DAY,
      ).toISOString(),
      author: AUTHORS[(index + p.id.length) % AUTHORS.length]!,
      verification: 'sample',
      receiptItemId: null,
    };
  });
}

/** Closer neutral shape from the English product name; category is the fallback. */
const SHAPES: [RegExp, PackShape][] = [
  [/jar|canned|pickled/i, 'jar'],
  [/tea|eggs|cheese|sugar|tvorog|toothpaste|toilet|powder|bueno/i, 'box'],
  [/butter|kit kat|snickers|twix/i, 'bar'],
  [/chips|pasta|croissant|sachet/i, 'bag'],
  [/loaf|baton/i, 'loaf'],
  [/oil|cola|juice|drink|bleach|dishwashing/i, 'bottle'],
];
function artFor(p: ProductFact) {
  const base = ART[p.category];
  const hit = SHAPES.find(([re]) => re.test(p.name[1]));
  return hit ? { ...base, shape: hit[1] } : base;
}

export function mockRetailCatalog(language: CatalogLanguage): RetailCatalog {
  const lang = LANG[language];
  const supermarkets: Supermarket[] = CHAINS.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description[lang],
    color: c.color,
    demo: true,
    coverUrl: c.coverUrl,
    logoUrl: c.logoUrl,
    logoOnDark: c.logoOnDark,
    privateLabels: c.privateLabels,
    sources: [
      { url: c.sourceUrl, type: 'official-site', checkedOn: CHECKED_ON },
    ],
  }));
  const products: RetailProduct[] = PRODUCTS.map((p) => ({
    id: p.id,
    barcode: p.barcode,
    imageUrl: p.imageUrl,
    brand: p.brand,
    name: p.name[lang],
    variant: p.variant,
    category: p.category,
    size: p.size,
    privateLabel: p.privateLabel,
    sources: p.sources.map((s) => ({ ...s, checkedOn: CHECKED_ON })),
    attributes: ATTRIBUTES[p.category],
    art: artFor(p),
  }));
  const listings: Listing[] = PRODUCTS.flatMap((p) =>
    p.chains.map((chain) => ({
      supermarketId: chain,
      productId: p.id,
      status: 'listed' as const,
      priceMinor: p.prices[chain] ?? null,
    })),
  );
  const reviews = PRODUCTS.flatMap((p) => reviewsFor(p, lang));
  return { supermarkets, products, listings, reviews };
}
