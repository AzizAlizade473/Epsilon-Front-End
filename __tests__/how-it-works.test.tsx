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

it('explains the restaurant flow, the feedback levels, the per-receipt rule and the BHOS exception', async () => {
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
  expect(screen.getByText(h.r1Title)).toBeOnTheScreen();
  expect(screen.queryByRole('radio')).toBeNull(); // no Market sector any more
  expect(screen.getByText(h.levelCashbackTitle)).toBeOnTheScreen();
  // A 25 ₼ eligible receipt → 0.40 ₼, straight from the central pilot policy.
  expect(screen.getByText(/25\.00 ₼/)).toBeOnTheScreen();
  expect(screen.getByText(/0\.40 ₼/)).toBeOnTheScreen();
  expect(screen.getByText(h.realityBhos)).toBeOnTheScreen();
  expect(h.realityBhos).toContain('keşbeksiz');
});
