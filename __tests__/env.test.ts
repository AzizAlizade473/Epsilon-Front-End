import { describe, expect, test } from '@jest/globals';

import {
  env,
  getEnv,
  parseEnv,
  resetEnvForTesting,
  validateEnv,
} from '@/lib/env';

const development = {
  EXPO_PUBLIC_APP_ENV: 'development',
  EXPO_PUBLIC_API_MODE: 'mock',
  EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3000/v1',
  EXPO_PUBLIC_SUPPORT_EMAIL: 'support@example.test',
  EXPO_PUBLIC_PRIVACY_URL: 'https://example.test/privacy',
  EXPO_PUBLIC_TERMS_URL: 'https://example.test/terms',
};
const production = {
  ...development,
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_API_MODE: 'live',
  EXPO_PUBLIC_API_URL: 'https://api.public-service.com/v1',
};

describe('environment schema', () => {
  test.each(['EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_TERMS_URL'])(
    'rejects missing, malformed or insecure legal configuration for %s without echoing its value',
    (key) => {
      for (const value of ['', 'http://legal.example.test', 'not-a-url']) {
        expect(() => parseEnv({ ...development, [key]: value })).toThrow(key);
      }
    },
  );
  test('permits explicit dev/mock configuration and safe defaults', () => {
    expect(parseEnv(development)).toMatchObject({
      EXPO_PUBLIC_MIN_AGE: 16,
      ENABLE_GOOGLE_SIGNIN: false,
      ENABLE_APPLE_SIGNIN: false,
    });
  });
  test('permits explicit production configuration without a hardcoded domain', () => {
    expect(parseEnv(production).EXPO_PUBLIC_API_URL).toBe(
      production.EXPO_PUBLIC_API_URL,
    );
  });
  test.each([
    undefined,
    '',
    'http://api.public-service.com',
    'https://localhost',
    'https://10.0.0.1',
    'https://staging.public-service.com',
  ])('rejects invalid production URL %s', (url) => {
    expect(() => parseEnv({ ...production, EXPO_PUBLIC_API_URL: url })).toThrow(
      'EXPO_PUBLIC_API_URL',
    );
  });
  test('rejects production mock mode', () => {
    expect(() =>
      parseEnv({ ...production, EXPO_PUBLIC_API_MODE: 'mock' }),
    ).toThrow('EXPO_PUBLIC_API_MODE');
  });
  test.each(['EAS_BUILD_PROFILE', 'EAS_ENVIRONMENT'])(
    'cannot downgrade a production build via %s',
    (key) => {
      expect(() => parseEnv({ ...development, [key]: 'production' })).toThrow(
        'EXPO_PUBLIC_APP_ENV',
      );
    },
  );
  test('rejects a URL designated as non-production', () => {
    expect(() =>
      parseEnv({
        ...production,
        NON_PRODUCTION_API_URLS: production.EXPO_PUBLIC_API_URL,
      }),
    ).toThrow('EXPO_PUBLIC_API_URL');
  });
  test.each([
    ['EXPO_PUBLIC_MIN_AGE', ''],
    ['EXPO_PUBLIC_MIN_AGE', 'NaN'],
    ['EXPO_PUBLIC_MIN_AGE', '16.5'],
    ['EXPO_PUBLIC_SUPPORT_EMAIL', 'invalid'],
    ['EXPO_PUBLIC_PRIVACY_URL', 'javascript:alert(1)'],
    ['EXPO_PUBLIC_TERMS_URL', ''],
    ['EXPO_PUBLIC_API_MODE', 'other'],
    ['EXPO_PUBLIC_APP_ENV', 'test'],
    ['ENABLE_APPLE_SIGNIN', 'yes'],
    ['ENABLE_GOOGLE_SIGNIN', 'true'],
  ])('rejects invalid %s', (key, value) => {
    expect(() => parseEnv({ ...development, [key]: value })).toThrow();
  });
  test('requires a client ID only when Google sign-in is enabled', () => {
    expect(
      parseEnv({
        ...development,
        ENABLE_GOOGLE_SIGNIN: 'true',
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'fixture.apps.googleusercontent.com',
      }).ENABLE_GOOGLE_SIGNIN,
    ).toBe(true);
  });
  test('does not disclose invalid values in errors', () => {
    expect(() =>
      parseEnv({
        ...development,
        EXPO_PUBLIC_API_URL: 'sensitive-invalid-value',
      }),
    ).toThrow('Invalid environment fields: EXPO_PUBLIC_API_URL');
  });
  test('validates fallback to process.env via validateEnv', () => {
    resetEnvForTesting();
    const originalEnv = process.env;
    try {
      process.env = { ...originalEnv, ...development };
      expect(validateEnv()).toMatchObject({
        EXPO_PUBLIC_APP_ENV: 'development',
        EXPO_PUBLIC_API_MODE: 'mock',
        EXPO_PUBLIC_MIN_AGE: 16,
        ENABLE_GOOGLE_SIGNIN: false,
        ENABLE_APPLE_SIGNIN: false,
      });
    } finally {
      process.env = originalEnv;
      resetEnvForTesting();
    }
  });
  test('supports getEnv and env proxy with test resetting', () => {
    resetEnvForTesting();
    const originalEnv = process.env;
    try {
      process.env = { ...originalEnv, ...development };
      expect(getEnv().EXPO_PUBLIC_APP_ENV).toBe('development');
      expect(env.EXPO_PUBLIC_API_MODE).toBe('mock');
    } finally {
      process.env = originalEnv;
      resetEnvForTesting();
    }
  });
});
