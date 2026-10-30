import { describe, expect, test } from '@jest/globals';

import { isProductionApiUrl } from '@/lib/production-url';

// Test fixture only: never a configured Epsilon endpoint; no network request.
const publicFixture = 'https://api.public-service.com/v1';

describe('SEC-9 production API URL', () => {
  test('accepts an explicit public HTTPS domain and base path', () => {
    expect(isProductionApiUrl(publicFixture)).toBe(true);
  });
  test.each([
    '',
    ' ',
    'not a URL',
    'http://api.public-service.com',
    'https://localhost',
    'https://localhost.',
    'https://app.localhost',
    'https://127.0.0.1',
    'https://127.1',
    'https://2130706433',
    'https://0x7f000001',
    'https://0177.0.0.1',
    'https://0.0.0.0',
    'https://10.1.2.3',
    'https://172.16.0.1',
    'https://192.168.1.1',
    'https://169.254.169.254',
    'https://100.64.0.1',
    'https://8.8.8.8',
    'https://[::1]',
    'https://[::]',
    'https://[::ffff:127.0.0.1]',
    'https://[fc00::1]',
    'https://[fe80::1]',
    'https://server',
    'https://api.local',
    'https://api.internal',
    'https://api.home.arpa',
    'https://api.example.com',
    'https://api.invalid',
    'https://127.0.0.1.nip.io',
    'https://localtest.me',
    'https://dev.public-service.com',
    'https://api-staging.public-service.com',
    'https://api.public-service.com/mock/v1',
    'https://api.public-service.com/%64ev',
    'https://api.public-service.com?mode=mock',
    'https://api.public-service.com#test',
    'https://user:password@api.public-service.com',
    'https://api.public-service.com:3000',
    ' https://api.public-service.com',
  ])('rejects unsafe configuration %s', (value) => {
    expect(isProductionApiUrl(value)).toBe(false);
  });
  test('rejects an otherwise public host explicitly configured for staging', () => {
    expect(
      isProductionApiUrl(publicFixture, [
        'https://api.public-service.com/other',
      ]),
    ).toBe(false);
  });
});
