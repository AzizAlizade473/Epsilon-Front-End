const { describe, it, expect } = require('@jest/globals');
const { validateProduction } = require('../scripts/production-guard.cjs');
const {
  inspect,
  allowedLicense,
} = require('../scripts/check-supply-chain.cjs');
const { validate } = require('../scripts/check-workflows.cjs');
it('rejects floating action tags and privileged PR execution', () => {
  expect(
    validate({
      on: { pull_request_target: {} },
      permissions: { contents: 'read' },
      jobs: {
        check: {
          'timeout-minutes': 5,
          steps: [{ uses: 'actions/checkout@v4' }],
        },
      },
    }),
  ).toEqual(
    expect.arrayContaining([
      'Privileged PR execution forbidden',
      'check: action requires immutable commit SHA',
    ]),
  );
});
const profile = {
  environment: 'production',
  channel: 'production',
  env: { EXPO_PUBLIC_APP_ENV: 'production', EXPO_PUBLIC_API_MODE: 'live' },
};
describe('production build guard', () => {
  it('requires owner configuration for actual build-time validation', () => {
    expect(validateProduction(profile)).toEqual([]);
    expect(validateProduction(profile, {}, true)).toContain(
      'Production API URL is missing or non-production',
    );
  });
  it.each([
    'http://api.epsilonup.app',
    'https://dev.epsilonup.app',
    'https://10.0.2.2',
    'https://api.example.com',
  ])('rejects unsafe production URL %s', (url) => {
    expect(
      validateProduction(profile, { EXPO_PUBLIC_API_URL: url }),
    ).not.toEqual([]);
  });
  it('fails deliberate mock production settings and test controls', () => {
    expect(
      validateProduction(profile, { EXPO_PUBLIC_API_MODE: 'mock' }),
    ).not.toEqual([]);
    expect(
      validateProduction(profile, { EXPO_PUBLIC_E2E: 'true' }),
    ).not.toEqual([]);
  });
});
describe('supply-chain gate', () => {
  const manifest = { dependencies: { sdk: '1.0.0' } };
  const pkg = {
    version: '1.0.0',
    license: 'FSL-1.1-MIT',
    resolved: 'https://registry.npmjs.org/sdk/-/sdk-1.0.0.tgz',
    integrity: 'sha512-fixture',
  };
  it('does not broaden an exception across version/license changes', () => {
    const exceptions = {
      'node_modules/sdk': { version: pkg.version, license: pkg.license },
    };
    expect(
      inspect({ packages: { 'node_modules/sdk': pkg } }, manifest, exceptions),
    ).toEqual([]);
    expect(
      inspect(
        { packages: { 'node_modules/sdk': { ...pkg, version: '1.0.1' } } },
        manifest,
        exceptions,
      ),
    ).not.toEqual([]);
    expect(
      inspect(
        {
          packages: {
            'node_modules/sdk': {
              ...pkg,
              resolved: 'https://untrusted.invalid/sdk',
            },
          },
        },
        manifest,
        exceptions,
      ),
    ).not.toEqual([]);
  });
  it('permits a genuinely allowed SPDX alternative, not copyleft alone', () => {
    expect(allowedLicense('(BSD-3-Clause OR GPL-2.0)')).toBe(true);
    expect(allowedLicense('MPL-2.0')).toBe(false);
  });
});
