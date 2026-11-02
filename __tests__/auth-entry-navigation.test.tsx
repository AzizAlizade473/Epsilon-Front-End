import { beforeEach, expect, jest, test } from '@jest/globals';
import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { Stack } from 'expo-router';
import Welcome from '../app/(onboarding)/welcome';
import Login from '../app/(auth)/login';
import Register from '../app/(auth)/register';
import Phone from '../app/(auth)/phone';
import az from '../locales/az.json';
import { initializeI18n } from '@/lib/i18n';
import { resolveDeepLink } from '@/lib/deep-link';
import { authOperation, otpChallenge } from '@/features/auth/store';

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ session: null, onboardingComplete: false }),
  useAuthActions: () => ({}),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: false } }));
jest.mock('@/features/auth/hooks/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({ busy: false, signIn: jest.fn() }),
}));
function Root() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
const routes = {
  _layout: Root,
  welcome: Welcome,
  login: Login,
  register: Register,
  phone: Phone,
};
beforeEach(async () => {
  authOperation.release();
  otpChallenge.clear();
  await initializeI18n('az');
});
test('actual entry routes connect Welcome, Login, Sign Up and Back without stale locks', async () => {
  const result = await renderRouter(routes, { initialUrl: '/welcome' });
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: az.authEntry.login }));
  expect(result.getPathname()).toBe('/login');
  await user.press(screen.getByRole('link', { name: az.authEntry.register }));
  expect(result.getPathname()).toBe('/register');
  await user.press(screen.getByRole('link', { name: az.authEntry.login }));
  expect(result.getPathname()).toBe('/login');
  await testRouter.back('/welcome');
  await user.press(screen.getByRole('button', { name: az.authEntry.register }));
  expect(result.getPathname()).toBe('/register');
});
test('legacy phone visits reach the complete Login screen', async () => {
  const result = await renderRouter(routes, { initialUrl: '/phone' });
  expect(result.getPathname()).toBe('/login');
  expect(
    screen.getByRole('button', { name: az.auth.continueGoogle }),
  ).toBeOnTheScreen();
});
test.each(['login', 'register'] as const)(
  '%s deep links only open the validated entry route',
  (route) => {
    expect(resolveDeepLink(`epsilon://${route}`)).toEqual({
      valid: true,
      path: `/${route}`,
    });
    expect(resolveDeepLink(`https://${route}`).valid).toBe(false);
  },
);
