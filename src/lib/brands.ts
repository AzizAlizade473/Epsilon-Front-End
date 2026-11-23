import type { ImageSourcePropType } from 'react-native';

/**
 * Known restaurant chains, matched only on a receipt's establishment name.
 *
 * A brand is recognised when the name IS the brand or STARTS with the brand
 * followed by a branch separator ("KFC-VAĞZAL", "KFC Gənclik"). Anything
 * else (a name that merely contains or resembles the brand, like "KFCX" or
 * "MY KFC KEBAB") gets no brand. Brand identity says nothing about whether a
 * restaurant is an Epsilon partner: that comes only from the server.
 *
 * `logo` holds an official, authorised asset once Epsilon has one; until then
 * the badge draws the brand's name in its colours (no trademark artwork copied).
 */
export type Brand = {
  id: string;
  name: string;
  /** Upper-case, accents kept; compared after normalising the receipt name the same way. */
  aliases: readonly string[];
  color: string;
  ink: string;
  logo?: ImageSourcePropType;
};

export const brands: readonly Brand[] = [
  {
    id: 'kfc',
    name: 'KFC',
    aliases: ['KFC'],
    color: '#E4002B',
    ink: '#FFFFFF',
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    aliases: ["MCDONALD'S", 'MCDONALDS', "MC DONALD'S", 'MC DONALDS'],
    color: '#DA291C',
    ink: '#FFC72C',
  },
  {
    id: 'burger-king',
    name: 'Burger King',
    aliases: ['BURGER KING'],
    color: '#F5EBDC',
    ink: '#D62300',
  },
  {
    id: 'pizza-hut',
    name: 'Pizza Hut',
    aliases: ['PIZZA HUT'],
    color: '#EE3A43',
    ink: '#FFFFFF',
  },
  {
    id: 'papa-johns',
    name: "Papa John's",
    aliases: ["PAPA JOHN'S", 'PAPA JOHNS'],
    color: '#2D5A27',
    ink: '#FFFFFF',
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
    for (const alias of brand.aliases) {
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
