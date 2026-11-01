const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const path = require('node:path');
const normalPermissions = new Set([
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.WAKE_LOCK',
  'com.google.android.c2dm.permission.RECEIVE',
]);
const featurePermissions = new Set([
  'android.permission.CAMERA',
  'android.permission.POST_NOTIFICATIONS',
]);
const result = (check, pass, detail) => ({
  check,
  status: pass ? 'pass' : 'fail',
  detail,
});
function pngExists(root, file) {
  if (!file || !fs.existsSync(path.resolve(root, file))) return false;
  const bytes = fs.readFileSync(path.resolve(root, file));
  return (
    bytes.length > 24 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.readUInt32BE(16) === 1024 &&
    bytes.readUInt32BE(20) === 1024
  );
}
function auditConfig(config, root = process.cwd()) {
  const android = config.android ?? {};
  const build = config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
  )?.[1];
  const splash = config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  )?.[1];
  const crash = config.plugins?.find(
    (plugin) =>
      Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo',
  )?.[1];
  return [
    result(
      'crash-native-auto-init',
      crash?.useNativeInit === false && !crash?.authToken,
      'Native crash auto-init stays disabled and no upload token is embedded in plugin options.',
    ),
    result(
      'feature-permissions',
      (android.permissions ?? []).includes('android.permission.CAMERA') &&
        android.permissions.every((name) => featurePermissions.has(name)),
      'Only CAMERA and optional POST_NOTIFICATIONS are requested feature permissions.',
    ),
    result(
      'backup',
      android.allowBackup === false,
      'Explicit allowBackup=false.',
    ),
    result(
      'cleartext',
      build?.android?.usesCleartextTraffic === false,
      'Native build configuration disables cleartext.',
    ),
    result(
      'blocked-permissions',
      [
        'READ_SMS',
        'RECEIVE_SMS',
        'READ_CONTACTS',
        'GET_ACCOUNTS',
        'VIBRATE',
        'SCHEDULE_EXACT_ALARM',
      ].every((name) =>
        android.blockedPermissions?.includes(`android.permission.${name}`),
      ),
      'Unused sensitive/notification capabilities remain blocked.',
    ),
    result(
      'icon-assets',
      [
        config.icon,
        android.adaptiveIcon?.foregroundImage,
        android.adaptiveIcon?.monochromeImage,
      ].every((file) => pngExists(root, file)),
      'Legacy/adaptive/monochrome assets are real 1024px PNGs; branding is a documented placeholder.',
    ),
    result(
      'static-splash',
      splash?.backgroundColor === '#FFFFFF' && pngExists(root, splash?.image),
      'A static image on white; no new splash animation.',
    ),
  ];
}
function auditManifest(document) {
  const manifest = document.manifest ?? {};
  const application = manifest.application?.[0] ?? {};
  const attrs = application.$ ?? {};
  const packageName = manifest.$?.package ?? '';
  const nativeCrashInit = application['meta-data']?.find(
    (item) => item.$?.['android:name'] === 'io.sentry.auto-init',
  )?.$?.['android:value'];
  const permissions = (manifest['uses-permission'] ?? [])
    .map((item) => item.$?.['android:name'])
    .filter(Boolean);
  const unexpected = permissions.filter(
    (name) =>
      !featurePermissions.has(name) &&
      !normalPermissions.has(name) &&
      name !== `${packageName}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
  );
  const exported = [
    'activity',
    'activity-alias',
    'service',
    'receiver',
    'provider',
  ].flatMap((kind) =>
    (application[kind] ?? [])
      .filter((item) => item.$?.['android:exported'] === 'true')
      .map((item) => ({ kind, item })),
  );
  const onlyMain =
    exported.length === 1 &&
    exported[0].kind === 'activity' &&
    exported[0].item.$?.['android:name']?.endsWith('.MainActivity') &&
    exported[0].item['intent-filter']?.some((filter) =>
      filter.category?.some(
        (category) =>
          category.$?.['android:name'] === 'android.intent.category.LAUNCHER',
      ),
    );
  return [
    result(
      'merged-manifest-crash-auto-init',
      nativeCrashInit === 'false',
      'Native crash collection must remain disabled before JS consent/scrubbing.',
    ),
    result(
      'merged-manifest-backup',
      attrs['android:allowBackup'] === 'false',
      'Final merged manifest must explicitly disable backups.',
    ),
    result(
      'merged-manifest-cleartext',
      attrs['android:usesCleartextTraffic'] === 'false',
      'Final merged manifest must explicitly disable cleartext.',
    ),
    result(
      'merged-manifest-permissions',
      unexpected.length === 0,
      unexpected.length
        ? `Unexpected permissions: ${unexpected.join(', ')}`
        : 'Only approved feature and necessary normal/signature network permissions.',
    ),
    result(
      'exported-components',
      Boolean(onlyMain),
      'Only the launcher MainActivity may be exported; SDK exceptions require an explicit security review.',
    ),
  ];
}
async function main() {
  const { exp } = require('@expo/config').getConfig(process.cwd(), {
    skipSDKVersionRequirement: true,
  });
  const checks = auditConfig(exp);
  const index = process.argv.indexOf('--manifest');
  if (index >= 0 && process.argv[index + 1]) {
    const file = path.resolve(process.argv[index + 1]);
    checks.push(
      ...auditManifest(
        await require('@expo/config-plugins').AndroidConfig.Manifest.readAndroidManifestAsync(
          file,
        ),
      ),
    );
  } else
    checks.push({
      check: 'release-merged-manifest',
      status: 'not_verified',
      detail:
        'Supply a preview/release merged manifest with --manifest PATH. Prebuild/configuration is not release-build proof.',
    });
  console.log(JSON.stringify({ checks, deviceQa: 'not_verified' }, null, 2));
  if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
  else if (
    process.argv.includes('--require-native') &&
    checks.some((check) => check.status === 'not_verified')
  )
    process.exitCode = 2;
}
module.exports = { auditConfig, auditManifest };
if (require.main === module)
  main().catch(() => {
    console.error('Android audit could not read configuration/manifest.');
    process.exitCode = 1;
  });
