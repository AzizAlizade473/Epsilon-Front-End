import { afterEach, expect, jest, test } from '@jest/globals';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/services/query';
import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import az from '../locales/az.json';

import { RootNavigator } from '@/components/navigation/RootNavigator';
import { initializeI18n } from '@/lib/i18n';
const client = createQueryClient();
afterEach(() => client.clear());
const mockGetPermission = jest.fn(() => Promise.resolve(null));
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [null, jest.fn(), mockGetPermission],
}));
function TestRoot() {
  return (
    <QueryClientProvider client={client}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
jest.mock('@/features/home/screens/HomeScreen', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/features/restaurants/screens/RestaurantsScreen', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: {},
    onboardingComplete: true,
    user: { firstName: 'Test', birthDate: '2000-01-01', phoneVerified: true },
    requirePhoneVerification: true,
  }),
}));

test('exactly four tabs include Scan and omit Cashback', async () => {
  await initializeI18n();
  const result = await renderRouter(
    { appDir: 'app', overrides: { _layout: TestRoot } },
    { initialUrl: '/home' },
  );
  const user = userEvent.setup();
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  await user.press(
    screen.getByRole('tab', { name: az.navigation.restaurants }),
  );
  expect(result.getPathname()).toBe('/restaurants');
  expect(
    screen.queryByRole('tab', { name: az.navigation.cashback }),
  ).toBeNull();
  await user.press(screen.getByRole('tab', { name: az.navigation.scan }));
  expect(result.getPathname()).toBe('/scan');
  expect(
    screen.getByRole('tab', { name: az.navigation.scan, selected: true }),
  ).toBeOnTheScreen();
  await user.press(
    screen.getByRole('tab', { name: az.navigation.restaurants }),
  );
  expect(
    screen.getByRole('tab', {
      name: az.navigation.restaurants,
      selected: true,
    }),
  ).toBeOnTheScreen();
});
