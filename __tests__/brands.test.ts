import { expect, test } from '@jest/globals';
import { displayMerchantName, matchBrand } from '@/lib/brands';
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
