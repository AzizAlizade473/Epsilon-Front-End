const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
// Execute the actual shared validator, so CI and the application enforce SEC-9 together.
const source = fs.readFileSync(
  path.join(__dirname, '../src/lib/production-url.ts'),
  'utf8',
);
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: exportsObject, URL },
);
function validateProduction(
  profile,
  supplied = {},
  requireEnvironment = false,
) {
  const failures = [];
  const values = { ...profile.env, ...supplied };
  if (profile.extends)
    failures.push(
      'Production profile inheritance requires explicit security review',
    );
  if (profile.environment !== 'production' || profile.channel !== 'production')
    failures.push('Production environment/channel must be explicit');
  if (
    values.EXPO_PUBLIC_APP_ENV !== 'production' ||
    values.EXPO_PUBLIC_API_MODE !== 'live'
  )
    failures.push('Production must use production/live');
  if (
    values.ENABLE_CRASH_REPORTING_DEV === 'true' ||
    values.EXPO_PUBLIC_E2E === 'true'
  )
    failures.push('Development/test flags are forbidden in production');
  if (values.EXPO_PUBLIC_API_URL || requireEnvironment) {
    if (
      !exportsObject.isProductionApiUrl(
        values.EXPO_PUBLIC_API_URL ?? '',
        (values.NON_PRODUCTION_API_URLS ?? '').split(',').filter(Boolean),
      )
    )
      failures.push('Production API URL is missing or non-production');
  }
  for (const name of Object.keys(values))
    if (
      name.startsWith('EXPO_PUBLIC_') &&
      /AUTH_TOKEN|PRIVATE|PASSWORD|SECRET|SERVICE_ACCOUNT/.test(name)
    )
      failures.push('Private secret must not use a public variable');
  for (const name of ['EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_TERMS_URL'])
    if (
      (values[name] || requireEnvironment) &&
      !exportsObject.isProductionApiUrl(values[name] ?? '')
    )
      failures.push(`${name} requires an owner-approved public HTTPS URL`);
  if (
    (values.EXPO_PUBLIC_SUPPORT_EMAIL || requireEnvironment) &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.EXPO_PUBLIC_SUPPORT_EMAIL ?? '')
  )
    failures.push('Production support email is required');
  if (
    (values.EXPO_PUBLIC_ANDROID_PACKAGE || requireEnvironment) &&
    !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(
      values.EXPO_PUBLIC_ANDROID_PACKAGE ?? '',
    )
  )
    failures.push('Explicit approved Android application ID is required');
  if (
    values.ENABLE_GOOGLE_SIGNIN === 'true' &&
    !/^[\w-]+\.apps\.googleusercontent\.com$/.test(
      values.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    )
  )
    failures.push('Enabled Google sign-in requires a web OAuth client ID');
  return failures;
}
module.exports = { validateProduction };
if (require.main === module) {
  const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../eas.json'), 'utf8'),
  );
  const full = process.argv.includes('--environment');
  const failures = validateProduction(
    config.build.production,
    full ? process.env : {},
    full,
  );
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      full
        ? 'SEC-9 production environment passed.'
        : 'SEC-9 production profile passed; external EAS values require build-time validation.',
    );
}
