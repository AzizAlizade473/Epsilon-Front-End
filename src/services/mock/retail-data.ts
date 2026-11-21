/**
 * GENERATED from source-verified research (2026-11-16). Real chains and
 * real products as publicly listed; prices are the shelf prices seen then.
 * Not Epsilon partners. Do not hand-edit facts without re-checking sources.
 * Coverage notes: araz: arazmarket.az category pages reachable via raw HTML (WebFetch summariser saw nothing; curl showed embedded Next.js JSON, 741 products over ~100 categories). PL page lists brand names only. | bravo: Official site: store list only. Wolt Globus Centre venue category pages parsed from embedded page JSON (up to 50 items per category). | tamstore: Official site: corporate info only. Wolt Khatai venue category pages parsed (up to 50 items per category). | rahat: Home and promo pages reachable but contain no product names/sizes; zero products recorded. | spar: spar-international.com has no products. Wolt araz-spar-1-3mkr venue parsed (up to 50 items/category). Venue is Araz-operated SPAR. | mergeNotes: Danone 100 g yogurts at SPAR carry a 'Kz' suffix (e.g. 'Danone Yogurt 100qr Ciyelek Kz'); merged with Tamstore Danone 100 qr on brand+flavour+size, origin not verified. Cross-chain merges (A
 */
import type { RetailCategory } from '@/services/contracts/retail';

type L3 = [az: string, en: string, ru: string];
export type ChainFact = {
  id: string;
  name: string;
  color: string;
  description: L3;
  privateLabels: string[];
  sourceUrl: string;
  /** Real photo from the chain's own site, or null when none is published. */
  coverUrl: string | null;
  logoUrl: string;
  /** True when the logo is white-only and needs the chain colour behind it. */
  logoOnDark: boolean;
};
export type ProductFact = {
  id: string;
  brand: string;
  name: L3;
  variant: string | null;
  size: string;
  category: RetailCategory;
  privateLabel: boolean;
  /** Product image as listed on the source page (hotlinked, not bundled). */
  imageUrl: string | null;
  barcode: string | null;
  chains: string[];
  /** Shelf price in qəpik per chain, as listed on the source page. */
  prices: Record<string, number>;
  sources: {
    url: string;
    type: 'official-site' | 'wolt-listing' | 'promo-catalog';
  }[];
};

export const CHECKED_ON = '2026-11-16';
export const CHAINS: ChainFact[] = [
  {
    id: 'araz',
    name: 'Araz',
    color: '#282973',
    description: [
      'Azərbaycanda supermarket şəbəkəsi. Öz brendləri: Tac, Soba, Mastero, Bloom, Dalğa, Südçü.',
      'Supermarket chain in Azerbaijan with its own brands: Tac, Soba, Mastero, Bloom, Dalğa, Südçü.',
      'Сеть супермаркетов в Азербайджане с собственными марками: Tac, Soba, Mastero, Bloom, Dalğa, Südçü.',
    ],
    privateLabels: ['Tac', 'Soba', 'Mastero', 'Bloom', 'Dalğa', 'Südçü'],
    sourceUrl: 'https://www.arazmarket.az/az',
    coverUrl:
      'https://b7x9kq.arazmarket.az/storage/static-pages/01JV747A637W3N6FBJKMR9CPGF.jpg',
    logoUrl: 'https://www.arazmarket.az/_next/static/media/logo.42b6a354.svg',
    logoOnDark: false,
  },
  {
    id: 'bravo',
    name: 'Bravo',
    color: '#2F67B2',
    description: [
      'Azərbaycanda Hiper, Super, Market və Ekspres formatlı mağazalar şəbəkəsi.',
      'Hyper, Super, Market and Express store formats across Azerbaijan.',
      'Магазины форматов Hiper, Super, Market и Ekspres по всему Азербайджану.',
    ],
    privateLabels: [],
    sourceUrl: 'https://www.bravosupermarket.az/branches/',
    coverUrl:
      'https://images.squarespace-cdn.com/content/v1/63e56b3c0537932311e24cb4/2563932a-a416-42ca-80a1-16f90daebb8f/bravo-supermarket-12.jpg',
    logoUrl: 'https://bravosupermarket.az/site/templates/img/newLogo.png',
    logoOnDark: false,
  },
  {
    id: 'tamstore',
    name: 'Tamstore',
    color: '#534C9C',
    description: [
      'Mini, şəhər və supermarket tipli marketlər şəbəkəsi.',
      'A chain of mini, city and supermarket-type stores.',
      'Сеть магазинов формата мини, городской маркет и супермаркет.',
    ],
    privateLabels: [],
    sourceUrl: 'https://www.tamstore.az/az',
    coverUrl: 'https://www.tamstore.az/uploads/1702878313-657fdc6909ba0.jpeg',
    logoUrl: 'https://www.tamstore.az/uploads/1702016832-6572b740206e4.png',
    logoOnDark: false,
  },
  {
    id: 'rahat',
    name: 'Rahat Market',
    color: '#1F4E8C',
    description: [
      'ANC Group-a məxsus, 2009-cu ildən fəaliyyət göstərən supermarket şəbəkəsi.',
      'Supermarket chain trading since 2009, part of ANC Group.',
      'Сеть супермаркетов с 2009 года, входит в ANC Group.',
    ],
    privateLabels: [],
    sourceUrl: 'https://rahatmarket.az/en/haqqimizda/rahat-market-haqqinda',
    coverUrl:
      'https://images.report.az/photo/8bd595c6-cc1b-36e9-aa76-9f70b314980b_1200.jfif',
    logoUrl: 'https://rahatmarket.az/storage/1/rahat_supermarket.svg',
    logoOnDark: false,
  },
  {
    id: 'spar',
    name: 'SPAR',
    color: '#3B3F99',
    description: [
      'Beynəlxalq SPAR şəbəkəsi; Azərbaycanda Araz tərəfindən idarə olunur.',
      'The international SPAR network, operated in Azerbaijan by Araz.',
      'Международная сеть SPAR; в Азербайджане управляется компанией Araz.',
    ],
    privateLabels: [],
    sourceUrl: 'https://spar-international.com/country/azerbaijan-2/',
    coverUrl:
      'https://spar-international.com/wp-content/uploads/2016/04/Azerbaijan-app-5.jpg',
    logoUrl:
      'https://spar-international.com/wp-content/themes/spar_international/img/spar-logo.svg',
    logoOnDark: false,
  },
];
export const PRODUCTS: ProductFact[] = [
  {
    id: 'atena_milk_15_1l',
    brand: 'Atena',
    name: [
      'Atena Süd 1.5% 1 l',
      'Atena Milk 1.5% 1 L',
      'Молоко Atena 1,5% 1 л',
    ],
    variant: '1.5%',
    size: '1 L',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000013869.png',
    barcode: '4760087901459',
    chains: ['araz', 'tamstore'],
    prices: {
      araz: 270,
      tamstore: 269,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/sade-sud-953',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/sud-v-sud-mhsullari-76',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'milla_milk_32_1l',
    brand: 'Milla',
    name: ['Milla Süd 3.2% 1l', 'Milla Milk 3.2% 1 L', 'Молоко Milla 3,2% 1 л'],
    variant: '3.2%',
    size: '1 L',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000012492.png',
    barcode: '4760081600037',
    chains: ['araz', 'tamstore'],
    prices: {
      araz: 290,
      tamstore: 249,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/sade-sud-953',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/sud-v-sud-mhsullari-76',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'azersud_lactosefree_15_1l',
    brand: 'Azər Süd',
    name: [
      'Azər Süd Laktozasız 1.5% 1 l',
      'Azər Süd Lactose-Free Milk 1.5% 1 L',
      'Безлактозное молоко Azər Süd 1,5% 1 л',
    ],
    variant: 'Lactose-free 1.5%',
    size: '1 L',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000014376.png',
    barcode: '4760095105238',
    chains: ['araz', 'tamstore'],
    prices: {
      araz: 335,
      tamstore: 339,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/sade-sud-953',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/sud-v-sud-mhsullari-76',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'milla_milk_25_1l',
    brand: 'Milla',
    name: [
      'Süd Milla 2,5% 1lt',
      'Milla Milk 2.5% 1 L',
      'Молоко Milla 2,5% 1 л',
    ],
    variant: '2.5%',
    size: '1 L',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000012821.png',
    barcode: '4760081603373',
    chains: ['araz', 'tamstore'],
    prices: {
      araz: 280,
      tamstore: 279,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/sade-sud-953',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/sud-v-sud-mhsullari-76',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'slavyanskoe_milk_15_1l',
    brand: 'Slavyanskoe',
    name: [
      'Slavyanskoe Süd 1.5% 1 Lt',
      'Slavyanskoe Milk 1.5% 1 L',
      'Молоко Славянское 1,5% 1 л',
    ],
    variant: '1.5%',
    size: '1 L',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000021913.png',
    barcode: '4820003489802',
    chains: ['araz', 'tamstore'],
    prices: {
      araz: 285,
      tamstore: 279,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/sade-sud-953',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/sud-v-sud-mhsullari-76',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'milla_village_katiq_6_1kg',
    brand: 'Milla',
    name: [
      'Milla Qaymaqlı Kənd Qatığı 6% 1kq',
      'Milla Creamy Village Qatiq (fermented milk) 6% 1 kg',
      'Катык деревенский сливочный Milla 6% 1 кг',
    ],
    variant: 'Creamy village qatiq 6%',
    size: '1 kg',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://imageproxy.wolt.com/assets/6ab677581f7ef328065b5a74',
    barcode: '4760081603632',
    chains: ['tamstore'],
    prices: {
      tamstore: 359,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/yoqurt-v-ksmik-106',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'milla_katiq_15_500',
    brand: 'Milla',
    name: [
      'Milla Qatıq 1.5% 500qr',
      'Milla Qatiq (fermented milk) 1.5% 500 g',
      'Катык Milla 1,5% 500 г',
    ],
    variant: '1.5%',
    size: '500 g',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000013394.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 200,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/qatiq-inek-sudu-1011',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'milla_white_cheese_250',
    brand: 'Milla',
    name: [
      'Milla Ağ Pendir 250qr',
      'Milla White Cheese 250 g',
      'Белый сыр Milla 250 г',
    ],
    variant: null,
    size: '250 g',
    category: 'dairy',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/60c2e6054e858ffd60a57f75/fc19a8a2-5b1a-11f0-a073-1a0c072b2ff5_wmx_s_111111.jpg',
    barcode: '4760081601294',
    chains: ['spar'],
    prices: {
      spar: 350,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/sud-sud-mhsullaryeni-kateqoriya-22',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'atena_white_cheese_400',
    brand: 'Atena',
    name: [
      'Atena Bəyaz Pendir 400 gr Qapaqlı',
      'Atena White Cheese 400 g, lidded tub',
      'Белый сыр Atena 400 г, в контейнере с крышкой',
    ],
    variant: 'Lidded tub',
    size: '400 g',
    category: 'dairy',
    privateLabel: false,
    imageUrl: 'https://imageproxy.wolt.com/assets/6a1d84f6cd71db5aaad292e9',
    barcode: '4760078000413',
    chains: ['spar'],
    prices: {
      spar: 590,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/sud-mhsullar-38',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'savuskin_tvorog_9_300',
    brand: 'Savuşkin',
    name: [
      'Savuşkin Tvoroq 9% 300qr',
      'Savushkin Tvorog (curd) 9% 300 g',
      'Творог Савушкин 9% 300 г',
    ],
    variant: '9%',
    size: '300 g',
    category: 'dairy',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/611b9f5c209bfbf807f41e7f/89b80a60-bc1a-11ee-bed3-4afce4e157fb_11111.png',
    barcode: '4810268027345',
    chains: ['spar'],
    prices: {
      spar: 390,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/sud-mhsullar-38',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'milvana_white_eggs_10',
    brand: 'Milvana',
    name: [
      'Milvana Ağ Yumurta 10əd.',
      'Milvana White Eggs, 10 pcs',
      'Яйца белые Milvana, 10 шт.',
    ],
    variant: 'White',
    size: '10 pcs',
    category: 'dairy',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/shared/c47ece66-cd00-11ef-8cfd-16c2200baa49_brv_dairy_milvana_white_eggs_10_mockup_top_01_removebg_preview_photoroom.jpg',
    barcode: '4760157740803',
    chains: ['bravo'],
    prices: {
      bravo: 290,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/yumurtalar-7',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'tac_village_eggs_10',
    brand: 'Tac',
    name: [
      'Tac Kənd Yumurtası 10əd',
      'Tac Village Eggs, 10 pcs',
      'Яйца деревенские Tac, 10 шт.',
    ],
    variant: 'Village',
    size: '10 pcs',
    category: 'dairy',
    privateLabel: true,
    imageUrl: 'https://imageproxy.wolt.com/assets/6a070234cf8c9f142af5106b',
    barcode: '4760105914317',
    chains: ['spar'],
    prices: {
      spar: 390,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/yumurta-42',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'imuni_yo_peach_32_120',
    brand: 'Imuni Yo',
    name: [
      'Imuni Yo Yogurt Şaftalı 3.2% 120 qr',
      'Imuni Yo Peach Yogurt 3.2% 120 g',
      'Йогурт Imuni Yo персик 3,2% 120 г',
    ],
    variant: 'Peach 3.2%',
    size: '120 g',
    category: 'yogurt',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/60c2e6054e858ffd60a57f75/45ee0b58-f8c9-11ef-99ed-b664ffa7ddf3_1000135796.jpg',
    barcode: '4760167450563',
    chains: ['spar'],
    prices: {
      spar: 79,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/yoqurt-31',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'imuni_yo_apricot_32_120',
    brand: 'Imuni Yo',
    name: [
      'Imuni Yo Yogurt Ərik 3.2% 120 qr',
      'Imuni Yo Apricot Yogurt 3.2% 120 g',
      'Йогурт Imuni Yo абрикос 3,2% 120 г',
    ],
    variant: 'Apricot 3.2%',
    size: '120 g',
    category: 'yogurt',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/60c2e6054e858ffd60a57f75/492819c6-f8c9-11ef-b606-a6d5546f0e04_1000135800.jpg',
    barcode: '4760167450587',
    chains: ['spar'],
    prices: {
      spar: 79,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/yoqurt-31',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'ankara_pasta_thin_long_500',
    brand: 'Ankara',
    name: [
      'Ankara Makarna İncə Uzun 500qr',
      'Ankara Pasta, thin long, 500 g',
      'Макароны Ankara тонкие длинные 500 г',
    ],
    variant: 'Thin long',
    size: '500 g',
    category: 'pantry',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000005029.png',
    barcode: '8690576029233',
    chains: ['araz', 'bravo', 'tamstore'],
    prices: {
      araz: 190,
      bravo: 190,
      tamstore: 149,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/makaron-qablasdirilmis-1511',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/makaron-duyu-v-bakliyyat-mhsullar-94',
        type: 'wolt-listing',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/makaron-v-souslar-190',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'ankara_pasta_manti_500',
    brand: 'Ankara',
    name: [
      'Ankara Makaron Mantı 500qr',
      'Ankara Pasta, manti shape, 500 g',
      'Макароны Ankara «манты» 500 г',
    ],
    variant: 'Manti',
    size: '500 g',
    category: 'pantry',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000005094.png',
    barcode: '8690576029257',
    chains: ['araz', 'bravo', 'spar'],
    prices: {
      araz: 190,
      bravo: 190,
      spar: 149,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/makaron-qablasdirilmis-1511',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/makaron-duyu-v-bakliyyat-mhsullar-94',
        type: 'wolt-listing',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/makaron-v-duyu-119',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'ankara_pasta_penne_500',
    brand: 'Ankara',
    name: [
      'Ankara Makaron Penne 500qr',
      'Ankara Penne Pasta 500 g',
      'Макароны Ankara пенне 500 г',
    ],
    variant: 'Penne',
    size: '500 g',
    category: 'pantry',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/6082a8c7376cf8c5b3dcbdf0/4d1401ce-9b12-11ed-ab30-7e65a7179344_frame_1.jpeg',
    barcode: '8690576029431',
    chains: ['araz', 'spar'],
    prices: {
      araz: 190,
      spar: 149,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/makaron-qablasdirilmis-1511',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/makaron-v-duyu-119',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'final_corn_oil_1l',
    brand: 'Final',
    name: [
      'Final Qarğıdalı Yağı 1l',
      'Final Corn Oil 1 L',
      'Кукурузное масло Final 1 л',
    ],
    variant: 'Corn oil',
    size: '1 L',
    category: 'pantry',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000012484.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 675,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/qargidali-yaglari-1761',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'tac_corn_oil_1l',
    brand: 'Tac',
    name: [
      'Tac Qarğıdalı Yağı 1 l',
      'Tac Corn Oil 1 L',
      'Кукурузное масло Tac 1 л',
    ],
    variant: 'Corn oil',
    size: '1 L',
    category: 'pantry',
    privateLabel: true,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/60c2e6054e858ffd60a57f75/aa1a759c-e23c-11ef-9cc7-4eba62b5ef8d_1000041022.jpg',
    barcode: '4673742976207',
    chains: ['spar'],
    prices: {
      spar: 479,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/yaglar-39',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'tac_pickled_cucumber_680',
    brand: 'Tac',
    name: [
      'TAC XİYAR TURŞUSU 680 QR',
      'Tac Pickled Cucumbers 680 g',
      'Маринованные огурцы Tac 680 г',
    ],
    variant: 'Pickled cucumber',
    size: '680 g',
    category: 'pantry',
    privateLabel: true,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000012644.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 240,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/xiyar-tursusu-4412',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'bostan_green_peas_700',
    brand: 'Bostan',
    name: [
      'Bostan Yaşıl Noxud 700qr',
      'Bostan Canned Green Peas 700 g',
      'Зелёный горошек Bostan 700 г',
    ],
    variant: 'Canned green peas',
    size: '700 g',
    category: 'pantry',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000013383.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 370,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/yasil-noxud-konservasi-4418',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'tac_sugar_cubes_500',
    brand: 'Tac',
    name: [
      'Tac Kəllə Qənd 500 qr',
      'Tac Sugar Cubes 500 g',
      'Кусковой сахар Tac 500 г',
    ],
    variant: 'Sugar cubes',
    size: '500 g',
    category: 'pantry',
    privateLabel: true,
    imageUrl: 'https://imageproxy.wolt.com/assets/6a1aa8b0ecb12f53d468ce02',
    barcode: '4760105900839',
    chains: ['spar'],
    prices: {
      spar: 179,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/skr-tozu-v-qnd-129',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'sarikiz_lemon_200',
    brand: 'Sarıkız',
    name: [
      'Sarıkız Limon 200ml(Kapakli)',
      'Sarıkız Lemon Sparkling Drink 200 ml',
      'Газированный напиток Sarıkız лимон 200 мл',
    ],
    variant: 'Lemon',
    size: '200 ml',
    category: 'beverages',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000002746.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 115,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/qazli-meyve-aromali-ickiler-1065',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'natura_peach_juice_1l',
    brand: 'Natura',
    name: [
      'Natura Şaftalı Soku 1lt',
      'Natura Peach Juice 1 L',
      'Сок Natura персик 1 л',
    ],
    variant: 'Peach',
    size: '1 L',
    category: 'beverages',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000013449.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 240,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/meyve-sireleri-1049',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'beta_earl_grey_100',
    brand: 'Beta',
    name: [
      'Beta Earl Grey Çay 100 qr',
      'Beta Earl Grey Tea 100 g',
      'Чай Beta Эрл Грей 100 г',
    ],
    variant: 'Earl Grey',
    size: '100 g',
    category: 'beverages',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/604f1b91edd7ae05ebb52f33/3526604a-9bda-11eb-9e96-deb3827c71e8_beta_tea_qara_c_ay_100_qr.jpeg',
    barcode: '8690717003009',
    chains: ['spar'],
    prices: {
      spar: 340,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/cay-v-kofe-127',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'popsy_classic_140',
    brand: 'Popsy',
    name: [
      'Popsy  Çips  Klassik 140 q',
      'Popsy Classic Chips 140 g',
      'Чипсы Popsy классические 140 г',
    ],
    variant: 'Classic',
    size: '140 g',
    category: 'snacks',
    privateLabel: false,
    imageUrl: 'https://imageproxy.wolt.com/assets/6a29340a64c66cf1b27a3ebe',
    barcode: null,
    chains: ['bravo'],
    prices: {
      bravo: 199,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/cips-crz-v-qlyanaltlar-54',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'lacrema_croissant_cocoa_65',
    brand: 'La Crema',
    name: [
      'La Crema Kruassan Kakao 65qr',
      'La Crema Cocoa Croissant 65 g',
      'Круассан La Crema с какао 65 г',
    ],
    variant: 'Cocoa',
    size: '65 g',
    category: 'snacks',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000066605.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 105,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/kruassan-dolgulu-702',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'n1_extra_baton_400',
    brand: 'N1',
    name: [
      'N1 Extra Baton 400qr',
      'N1 Extra Baton Loaf 400 g',
      'Батон N1 Extra 400 г',
    ],
    variant: 'Extra baton',
    size: '400 g',
    category: 'bakery',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000112770.png',
    barcode: '4760130800371',
    chains: ['araz', 'spar'],
    prices: {
      araz: 115,
      spar: 99,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/baton-coreyi-2531',
        type: 'official-site',
      },
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/cork-v-lavas-6',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'gilan_n1_croissant_65',
    brand: 'Gilan N1',
    name: [
      'Gilan N1 Kruassan 65qr',
      'Gilan N1 Croissant 65 g',
      'Круассан Gilan N1 65 г',
    ],
    variant: null,
    size: '65 g',
    category: 'bakery',
    privateLabel: false,
    imageUrl: 'https://b7x9kq.arazmarket.az/storage/products/1000013291.png',
    barcode: null,
    chains: ['araz'],
    prices: {
      araz: 85,
    },
    sources: [
      {
        url: 'https://www.arazmarket.az/az/categories/kruassan-2502',
        type: 'official-site',
      },
    ],
  },
  {
    id: 'tac_choc_croissant_75',
    brand: 'Tac',
    name: [
      'Tac Kruassan Şokoladlı 75 qr',
      'Tac Chocolate Croissant 75 g',
      'Круассан Tac с шоколадом 75 г',
    ],
    variant: 'Chocolate',
    size: '75 g',
    category: 'bakery',
    privateLabel: true,
    imageUrl: 'https://imageproxy.wolt.com/assets/6a0d8be888027f8ba3054e0b',
    barcode: '4760105916410',
    chains: ['spar'],
    prices: {
      spar: 69,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/cork-v-lavas-6',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'oven_medium_baton_200',
    brand: 'Oven',
    name: [
      'Oven Orta Baton 200qr',
      'Oven Medium Baton 200 g',
      'Батон Oven средний 200 г',
    ],
    variant: 'Medium baton',
    size: '200 g',
    category: 'bakery',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/66348f21f221b23d85139cf6/aac0f65e-0922-11ef-bb9b-22d6e8de5ca5_590687.jpg',
    barcode: null,
    chains: ['bravo'],
    prices: {
      bravo: 49,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/corklr-v-un-mmulatlar-8',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'cleverest_bleach_lemon_1l',
    brand: 'Cleverest',
    name: [
      'Cleverest Ağardıcı Maye Limon 1l',
      'Cleverest Liquid Bleach Lemon 1 L',
      'Жидкий отбеливатель Cleverest лимон 1 л',
    ],
    variant: 'Lemon',
    size: '1 L',
    category: 'household',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/66348f21f221b23d85139cf6/46066e56-79ce-11f0-934e-d69c7428a070_wmx_s_111111.jpg',
    barcode: '4760157741299',
    chains: ['bravo'],
    prices: {
      bravo: 199,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/tmizlik-v-mist-mhsullar-142',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'selpak_toilet_paper_4',
    brand: 'Selpak',
    name: [
      'Selpak Tualet 4 əd',
      'Selpak Toilet Paper, 4 rolls',
      'Туалетная бумага Selpak, 4 рулона',
    ],
    variant: null,
    size: '4 pcs',
    category: 'household',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/604f1b91edd7ae05ebb52f33/e50b0e24-c82c-11eb-894a-d6fc6b2a637f_selpak_4_r.jpeg',
    barcode: '8690530204492',
    chains: ['spar'],
    prices: {
      spar: 499,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/tmizlik-140',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'potato_gedebey_kg',
    brand: '—',
    name: [
      'Kartof Gədəbəy kq',
      'Gədəbəy Potatoes (per kg)',
      'Картофель Гедебей (за кг)',
    ],
    variant: 'Gədəbəy',
    size: 'kg',
    category: 'produce',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/66f6a23f86a34ceec78687fc/7223e598-9209-11ef-9658-7a3ba6b01ddf_250857.jpg',
    barcode: null,
    chains: ['bravo'],
    prices: {
      bravo: 139,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/bravo-supermarket-globus-centre/items/meyv-v-trvzlr-3',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'banana_kg',
    brand: '—',
    name: ['Banan kq', 'Bananas (per kg)', 'Бананы (за кг)'],
    variant: null,
    size: 'kg',
    category: 'produce',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/604f1b91edd7ae05ebb52f33/a6315276-1f52-11ec-9b4b-ea19e614d954_banan_kg.jpeg',
    barcode: null,
    chains: ['spar'],
    prices: {
      spar: 259,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/meyv-trvz-2',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'ostankino_klassik_sausage_300',
    brand: 'Ostankino',
    name: [
      'Ostankino Klassik Kolbasa 300qr',
      'Ostankino Classic Sausage 300 g',
      'Колбаса Останкино Классическая 300 г',
    ],
    variant: 'Classic',
    size: '300 g',
    category: 'meat',
    privateLabel: false,
    imageUrl:
      'https://wolt-menu-images-cdn.wolt.com/menu-images/68ad527871323d956d4b3edd/6391b2f8-995b-11f0-a65d-3a8c47fd6da3_4607958074518.jpg',
    barcode: '4607958074518',
    chains: ['tamstore'],
    prices: {
      tamstore: 550,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/tamstore-xetai/items/kolbasa-v-sosis-233',
        type: 'wolt-listing',
      },
    ],
  },
  {
    id: 'mercan_chicken_1kg',
    brand: 'Mercan',
    name: [
      'Mercan Təzə Toyuq Paket Soyudulmuş 1kq',
      'Mercan Fresh Chilled Chicken, packed, 1 kg',
      'Охлаждённая курица Mercan, упаковка 1 кг',
    ],
    variant: 'Chilled whole chicken',
    size: '1 kg',
    category: 'meat',
    privateLabel: false,
    imageUrl:
      'https://image-resizer-proxy.development.dev.woltapi.com/wolt-dev-development-restaurant-api-menu-images/menu-images/62ac40c35daa642602a0231b/eccbae0a-95a8-11ef-8e65-be0d96f3d78a_2711827.jpg',
    barcode: null,
    chains: ['spar'],
    prices: {
      spar: 659,
    },
    sources: [
      {
        url: 'https://wolt.com/en/aze/baku/venue/araz-spar-1-3mkr/items/toyuq-mhsullar-16',
        type: 'wolt-listing',
      },
    ],
  },
];
