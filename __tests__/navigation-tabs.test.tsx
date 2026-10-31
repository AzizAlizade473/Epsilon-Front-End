import { expect, jest, test } from '@jest/globals';
import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';

import az from '../locales/az.json';

import { RootNavigator } from '@/components/navigation/RootNavigator';
import { initializeI18n } from '@/lib/i18n';
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

test('four tabs stay selected underneath the root Scan modal', async () => {
  await initializeI18n();
  const result = await renderRouter(
    { appDir: 'app', overrides: { _layout: RootNavigator } },
    { initialUrl: '/home' },
  );
  const user = userEvent.setup();
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  await user.press(
    screen.getByRole('tab', { name: az.navigation.restaurants }),
  );
  expect(result.getPathname()).toBe('/restaurants');
  await user.press(screen.getByRole('button', { name: az.navigation.scan }));
  expect(result.getPathname()).toBe('/scan');
  const rootRoutes =
    result.getRouterState()?.routes[0]?.state?.routes ??
    result.getRouterState()?.routes;
  expect(rootRoutes?.at(-1)?.name).toBe('scan');
  await testRouter.back('/restaurants');
  expect(
    screen.getByRole('tab', {
      name: az.navigation.restaurants,
      selected: true,
    }),
  ).toBeOnTheScreen();
});
