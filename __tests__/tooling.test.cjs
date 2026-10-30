const { test, expect } = require('@jest/globals');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

test('patched Expo CLI schemas accept valid inputs and reject invalid inputs', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-toolchain.cjs']),
  ).not.toThrow();
});

test('lint rejects unsafe types, invalid hooks, and reversed dependencies', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-lint.cjs']),
  ).not.toThrow();
}, 30000);

test('.env.example documents all required variables without secrets or fake domains', () => {
  const content = fs.readFileSync('.env.example', 'utf-8');
  const requiredKeys = [
    'EXPO_PUBLIC_APP_ENV',
    'EXPO_PUBLIC_API_MODE',
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_MIN_AGE',
    'EXPO_PUBLIC_SUPPORT_EMAIL',
    'EXPO_PUBLIC_PRIVACY_URL',
    'EXPO_PUBLIC_TERMS_URL',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'ENABLE_GOOGLE_SIGNIN',
    'ENABLE_APPLE_SIGNIN',
  ];
  for (const key of requiredKeys) {
    expect(content).toContain(key);
  }
  expect(content).not.toContain('api.epsilon.az');
});

test('app.config.ts satisfies Android-first, security, and runtime requirements', () => {
  const { getConfig } = require('@expo/config');
  const { exp } = getConfig(process.cwd(), { skipSDKVersionRequirement: true });
  expect(exp.name).toBe('Epsilon');
  expect(exp.slug).toBe('epsilon');
  expect(exp.scheme).toBe('epsilon');
  expect(exp.orientation).toBe('portrait');
  expect(exp.userInterfaceStyle).toBe('light');
  expect(exp.android.package).toBe('com.epsilonup.app');
  expect(exp.android.softwareKeyboardLayoutMode).toBe('resize');
  expect(exp.android.allowBackup).toBe(false);
  expect(exp.android.permissions).toEqual(['android.permission.CAMERA']);
  expect(exp.runtimeVersion).toEqual({ policy: 'appVersion' });
  const buildPropertiesPlugin = exp.plugins.find(
    (p) => Array.isArray(p) && p[0] === 'expo-build-properties',
  );
  expect(buildPropertiesPlugin).toBeDefined();
  expect(buildPropertiesPlugin[1].android.usesCleartextTraffic).toBe(false);
  expect(buildPropertiesPlugin[1].android.enableProguardInReleaseBuilds).toBe(
    true,
  );
  expect(
    buildPropertiesPlugin[1].android.enableShrinkResourcesInReleaseBuilds,
  ).toBe(true);
  const pluginNames = exp.plugins.map((p) => (Array.isArray(p) ? p[0] : p));
  expect(pluginNames).toEqual(
    expect.arrayContaining([
      'expo-router',
      'expo-camera',
      'expo-secure-store',
      'expo-localization',
      'expo-splash-screen',
      'expo-build-properties',
    ]),
  );
});
