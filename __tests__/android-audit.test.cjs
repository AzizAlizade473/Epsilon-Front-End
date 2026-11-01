const { expect, test } = require('@jest/globals');
const { auditManifest, auditConfig } = require('../scripts/audit-android.cjs');
const { getConfig } = require('@expo/config');
function manifest() {
  return {
    manifest: {
      $: { package: 'com.epsilonup.app' },
      'uses-permission': [
        { $: { 'android:name': 'android.permission.INTERNET' } },
        { $: { 'android:name': 'android.permission.CAMERA' } },
      ],
      application: [
        {
          'meta-data': [
            {
              $: {
                'android:name': 'io.sentry.auto-init',
                'android:value': 'false',
              },
            },
          ],
          $: {
            'android:allowBackup': 'false',
            'android:usesCleartextTraffic': 'false',
          },
          activity: [
            {
              $: {
                'android:name': '.MainActivity',
                'android:exported': 'true',
              },
              'intent-filter': [
                {
                  category: [
                    {
                      $: { 'android:name': 'android.intent.category.LAUNCHER' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
test('configuration/assets audit passes without claiming a native-build result', () => {
  expect(
    auditConfig(getConfig(process.cwd()).exp).every(
      (check) => check.status === 'pass',
    ),
  ).toBe(true);
});
test('merged manifest rejects unexpected permissions, exported receivers and unsafe app flags', () => {
  expect(
    auditManifest(manifest()).every((check) => check.status === 'pass'),
  ).toBe(true);
  const unsafe = manifest();
  unsafe.manifest['uses-permission'].push({
    $: { 'android:name': 'android.permission.READ_SMS' },
  });
  unsafe.manifest.application[0].$['android:allowBackup'] = 'true';
  unsafe.manifest.application[0].receiver = [
    { $: { 'android:name': '.UnsafeReceiver', 'android:exported': 'true' } },
  ];
  const checks = auditManifest(unsafe);
  expect(
    checks.find((check) => check.check === 'merged-manifest-permissions')
      .status,
  ).toBe('fail');
  expect(
    checks.find((check) => check.check === 'merged-manifest-backup').status,
  ).toBe('fail');
  expect(
    checks.find((check) => check.check === 'exported-components').status,
  ).toBe('fail');
});
