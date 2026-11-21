import { expect, it, jest } from '@jest/globals';

// The project ships no @types/node, so type the two Node modules used here locally.
const { readFileSync } = jest.requireActual<{
  readFileSync(path: string, encoding: 'utf8'): string;
}>('fs');
const { join } = jest.requireActual<{ join(...parts: string[]): string }>(
  'path',
);
declare const __dirname: string;

const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const pushesHome = /router\.navigate\("?'?\/home/;

it('closing the Wallet pops it instead of pushing a second tabs navigator', () => {
  expect(read('src/components/wallet/WalletJourney.tsx')).not.toMatch(
    pushesHome,
  );
  expect(read('src/features/cashback/screens/WalletScreen.tsx')).not.toMatch(
    pushesHome,
  );
});

it('paints the Wallet scene navy from the first frame', () => {
  const nav = read('src/components/navigation/RootNavigator.tsx');
  expect(nav).toMatch(/cashback\/index[\s\S]*walletDesign\.colors\.canvas/);
});

it('keeps the contour pattern off the full Wallet and Home backgrounds', () => {
  for (const file of [
    'src/features/cashback/screens/WalletScreen.tsx',
    'src/features/home/screens/HomeScreen.tsx',
  ])
    expect(read(file)).not.toMatch(/ContourPattern/);
  // The one intended place: the wallet card itself, as a single composition.
  const card = read('src/components/wallet/WalletSurface.tsx');
  expect(card.match(/<ContourPattern/g)).toHaveLength(1);
  expect(card).toMatch(/composition="card"/);
});

it('uses opaque per-tab scene colours and a plain fade for tab switches', () => {
  const tabs = read('app/(tabs)/_layout.tsx');
  expect(tabs).toMatch(/'fade'/);
  expect(tabs).not.toMatch(/'shift'/);
  expect(tabs).toMatch(/sceneStyle/);
});
