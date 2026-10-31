import { beforeEach, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { Text } from '@/components/ui/Text';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { resolveBootstrapRoute, type AuthState } from '@/lib/bootstrap';

let mockAuth: AuthState;
const mockRedirect = jest.fn();
jest.mock('@/providers/AuthProvider', () => ({ useAuth: () => mockAuth }));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = {
    session: {
      accessToken: 'test',
      refreshToken: 'test',
      expiresAt: '2027-01-01T00:00:00Z',
    },
    onboardingComplete: true,
    user: { firstName: 'Test', birthDate: null, phoneVerified: false },
    requirePhoneVerification: true,
  };
});
it('blocks direct entry to finished tabs for authenticated but incomplete users', async () => {
  await render(
    <AuthBoundary mode="complete">
      <Text>Protected</Text>
    </AuthBoundary>,
  );
  expect(mockRedirect).toHaveBeenCalledWith('/profile-setup');
  expect(screen.queryByText('Protected')).toBeNull();
});
it('resumes profile then mandatory phone and finally completed home from server fields', () => {
  expect(resolveBootstrapRoute(mockAuth)).toBe('/profile-setup');
  mockAuth.user = {
    firstName: 'Test',
    birthDate: '2000-01-01',
    phoneVerified: false,
  };
  expect(resolveBootstrapRoute(mockAuth)).toBe('/phone-verify');
  mockAuth.user.phoneVerified = true;
  expect(resolveBootstrapRoute(mockAuth)).toBe('/home');
});
it('allows optional phone verification to be skipped without claiming the phone is verified', async () => {
  mockAuth.user = {
    firstName: 'Test',
    birthDate: '2000-01-01',
    phoneVerified: false,
  };
  mockAuth.requirePhoneVerification = false;
  await render(
    <AuthBoundary mode="complete">
      <Text>Protected</Text>
    </AuthBoundary>,
  );
  expect(screen.getByText('Protected')).toBeOnTheScreen();
  expect(mockAuth.user.phoneVerified).toBe(false);
});
it('blocks returning to Welcome or phone sign-in while an authenticated account needs onboarding', async () => {
  await render(
    <AuthBoundary mode="signedOut">
      <Text>Welcome</Text>
    </AuthBoundary>,
  );
  expect(mockRedirect).toHaveBeenCalledWith('/profile-setup');
});
it('does not let a stale home instruction bypass mandatory phone verification', () => {
  mockAuth.user = {
    firstName: 'Test',
    birthDate: '2000-01-01',
    phoneVerified: false,
  };
  mockAuth.nextStep = 'home';
  expect(resolveBootstrapRoute(mockAuth)).toBe('/phone-verify');
});
