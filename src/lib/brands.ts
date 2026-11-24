/**
 * Known restaurant chains, matched only on a receipt's establishment name.
 *
 * A brand is recognised when the name IS the brand or STARTS with the brand
 * followed by a branch separator ("KFC-VAĞZAL", "KFC Gənclik"). Anything
 * else (a name that merely contains or resembles the brand, like "KFCX" or
 * "MY KFC KEBAB") gets no brand. Brand identity says nothing about whether a
 * restaurant is an Epsilon partner: that comes only from the server.
 *
 * Logos are bundled, unmodified renders of the official marks; sources and
 * usage status are recorded in docs/BRAND_ASSETS.md.
 */
export type Brand = {
  id: string;
  name: string;
  /** Upper-case, accents kept; compared after normalising the receipt name the same way. */
  aliases: readonly string[];
  /** Official site, for reference and a future logo service. */
  domain: string;
  /** Absent until the asset is bundled: the badge then shows the neutral mark. */
  /** A bundled asset (require()). */
  logo?: number;
};

export const brands: readonly Brand[] = [
  {
    id: 'kfc',
    name: 'KFC',
    aliases: ['KFC'],
    domain: 'kfc.com',
    logo: require('../../assets/brands/kfc.png'),
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    aliases: ["MCDONALD'S", 'MCDONALDS', "MC DONALD'S", 'MC DONALDS'],
    domain: 'mcdonalds.com',
    logo: require('../../assets/brands/mcdonalds.png'),
  },
  {
    id: 'burger-king',
    name: 'Burger King',
    aliases: ['BURGER KING'],
    domain: 'bk.com',
    logo: require('../../assets/brands/burger-king.png'),
  },
  {
    id: 'pizza-hut',
    name: 'Pizza Hut',
    aliases: ['PIZZA HUT'],
    domain: 'pizzahut.com',
    logo: require('../../assets/brands/pizza-hut.png'),
  },
  {
    id: 'papa-johns',
    name: "Papa John's",
    aliases: ["PAPA JOHN'S", 'PAPA JOHNS'],
    domain: 'papajohns.com',
  },
  {
    id: 'dominos',
    name: "Domino's",
    aliases: ["DOMINO'S", 'DOMINOS', "DOMINO'S PIZZA", 'DOMINOS PIZZA'],
    domain: 'dominos.com',
    logo: require('../../assets/brands/dominos.png'),
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    aliases: ['STARBUCKS'],
    domain: 'starbucks.com',
  },
];

const normalise = (name: string) =>
  name
    .toLocaleUpperCase('az')
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** The branch part after the brand: "KFC-VAĞZAL" → "VAĞZAL"; null when none. */
const SEPARATOR = /^\s*[-–—,:/|]?\s*/;

export function matchBrand(
  name: string | null | undefined,
): { brand: Brand; branch: string | null } | null {
  if (!name) return null;
  const value = normalise(name);
  for (const brand of brands)
    // Longest alias first: "DOMINO'S PIZZA NİZAMİ" is branch "NİZAMİ", not "PIZZA NİZAMİ".
    for (const alias of [...brand.aliases].sort(
      (x, y) => y.length - x.length,
    )) {
      if (value === alias) return { brand, branch: null };
      if (!value.startsWith(alias)) continue;
      const rest = value.slice(alias.length);
      // The alias must end at a word boundary: "KFCX" is not KFC.
      if (!/^[\s\-–—,:/|]/.test(rest)) continue;
      const branch = rest.replace(SEPARATOR, '').trim();
      return { brand, branch: branch || null };
    }
  return null;
}

const titleCase = (text: string) =>
  text
    .toLocaleLowerCase('az')
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, gap: string, letter: string) => gap + letter.toLocaleUpperCase('az'),
    );

/** "KFC-VAĞZAL" → "KFC — Vağzal"; unknown names are returned as printed. */
export function displayMerchantName(name: string): string {
  const match = matchBrand(name);
  if (!match) return name;
  return match.branch
    ? `${match.brand.name} — ${titleCase(match.branch)}`
    : match.brand.name;
}
