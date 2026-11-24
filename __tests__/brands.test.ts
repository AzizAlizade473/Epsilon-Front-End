import { expect, test } from '@jest/globals';
import { brands, displayMerchantName, matchBrand } from '@/lib/brands';
import { dishName } from '@/lib/dish-name';

test('recognises a chain only by its establishment name prefix', () => {
  expect(matchBrand('KFC-VAĞZAL')?.brand.id).toBe('kfc');
  expect(matchBrand('KFC Gənclik Mall')?.brand.id).toBe('kfc');
  expect(matchBrand('kfc')?.brand.id).toBe('kfc');
  expect(matchBrand("McDonald's Nizami")?.brand.id).toBe('mcdonalds');
  expect(matchBrand('PIZZA HUT - 28 MALL')?.brand.id).toBe('pizza-hut');
});

test('never brands a name that merely resembles a chain', () => {
  for (const name of [
    'KFCX',
    'MY KFC KEBAB',
    'GFC MMC',
    'KFCLUB',
    'BURGER KINGDOM',
    '',
    null,
  ])
    expect(matchBrand(name)).toBeNull();
});

test('shows branded branch names readably and leaves others as printed', () => {
  expect(displayMerchantName('KFC-VAĞZAL')).toBe('KFC — Vağzal');
  expect(displayMerchantName('KFC')).toBe('KFC');
  expect(displayMerchantName('TAM STORE')).toBe('TAM STORE');
});

test('drops the VAT marker from receipt dish names only', () => {
  expect(dishName('Pendirli sous * 18%')).toBe('Pendirli sous');
  expect(dishName('KFC Superfürsətlər Çizburger *18%')).toBe(
    'KFC Superfürsətlər Çizburger',
  );
  expect(dishName('Kapuçino')).toBe('Kapuçino');
  expect(dishName('Pizza 30%')).toBe('Pizza 30%');
});

test('prefers the longest alias and knows every bundled chain', () => {
  expect(displayMerchantName("DOMINO'S PIZZA NİZAMİ")).toBe(
    "Domino's — Nizami",
  );
  expect(matchBrand('STARBUCKS 28 MALL')?.brand.id).toBe('starbucks');
  expect(matchBrand('DOMINOS-GƏNCLIK')?.brand.id).toBe('dominos');
  for (const id of ['kfc', 'mcdonalds', 'burger-king', 'dominos', 'pizza-hut'])
    expect(brands.find((brand) => brand.id === id)?.logo).toBeTruthy();
});
