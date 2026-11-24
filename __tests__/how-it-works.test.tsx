import { beforeEach, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HowItWorksScreen from '@/features/home/screens/HowItWorksScreen';
import { initializeI18n } from '@/lib/i18n';
import az from '../locales/az.json';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true }),
}));
beforeEach(async () => {
  await initializeI18n();
});

it('explains the current receipt-to-rating flow and its limits, without old pilots', async () => {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <HowItWorksScreen />
    </SafeAreaProvider>,
  );
  const h = az.howItWorks;
  expect(screen.getByText(h.headline)).toBeOnTheScreen();
  for (const name of [
    'meal',
    'scan',
    'import',
    'rate',
    'cashback',
    'keep',
  ] as const)
    expect(screen.getByText(h[`${name}Title`])).toBeOnTheScreen();
  expect(screen.getByText(h.nonPartner)).toBeOnTheScreen();
  expect(screen.getByText(h.oncePerItem)).toBeOnTheScreen();
  expect(screen.queryByText(/BHOS|OBA/)).toBeNull();
});
