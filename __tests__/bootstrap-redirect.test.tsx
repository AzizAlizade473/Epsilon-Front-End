import { describe, expect, it, jest } from '@jest/globals';

import Bootstrap from '../app/index';

import {
  resolveBootstrapRoute,
  type AuthState,
  type BootSession,
} from '@/lib/bootstrap';
import * as runtimeProviders from '@/providers/RuntimeProviders';

const validSession: BootSession = {
  accessToken: 'valid-access',
  refreshToken: 'valid-refresh',
  expiresAt: '2026-12-31T00:00:00.000Z',
};

describe('resolveBootstrapRoute', () => {
  it('redirects to /welcome when onboarding is incomplete', () => {
    const auth: AuthState = {
      onboardingComplete: false,
      session: null,
      user: null,
    };
    expect(resolveBootstrapRoute(auth)).toBe('/welcome');
  });

  it('redirects to /phone when onboarding is complete but no session exists', () => {
    const auth: AuthState = {
      onboardingComplete: true,
      session: null,
      user: null,
    };
    expect(resolveBootstrapRoute(auth)).toBe('/phone');
  });

  it('redirects to /profile-setup when session exists but user profile is missing name or birth date', () => {
    const authNoUser: AuthState = {
      onboardingComplete: true,
      session: validSession,
      user: null,
    };
    expect(resolveBootstrapRoute(authNoUser)).toBe('/profile-setup');

    const authNoBirthDate: AuthState = {
      onboardingComplete: true,
      session: validSession,
      user: { firstName: 'Aziz', birthDate: null, phoneVerified: true },
    };
    expect(resolveBootstrapRoute(authNoBirthDate)).toBe('/profile-setup');

    const authNoName: AuthState = {
      onboardingComplete: true,
      session: validSession,
      user: { firstName: null, birthDate: '2000-01-01', phoneVerified: true },
    };
    expect(resolveBootstrapRoute(authNoName)).toBe('/profile-setup');
  });

  it('never requires a phone number: an unverified account goes home', () => {
    const auth: AuthState = {
      onboardingComplete: true,
      session: validSession,
      user: {
        firstName: 'Aziz',
        birthDate: '2000-01-01',
        phoneVerified: false,
      },
    };
    expect(resolveBootstrapRoute(auth)).toBe('/home');
    // Even an older server's `phone` step blocks nothing.
    expect(resolveBootstrapRoute({ ...auth, nextStep: 'phone' })).toBe('/home');
  });

  it('redirects to /home when profile is complete and phone verified', () => {
    const auth: AuthState = {
      onboardingComplete: true,
      session: validSession,
      user: { firstName: 'Aziz', birthDate: '2000-01-01', phoneVerified: true },
    };
    expect(resolveBootstrapRoute(auth)).toBe('/home');
  });
});

describe('Bootstrap screen', () => {
  it('renders Redirect with computed bootstrap route', () => {
    const spy = jest.spyOn(runtimeProviders, 'useAuth').mockReturnValue({
      onboardingComplete: false,
      session: null,
      user: null,
    });

    const element = Bootstrap();
    expect(element).toMatchObject({
      props: { href: '/welcome' },
    });
    spy.mockRestore();
  });
});
