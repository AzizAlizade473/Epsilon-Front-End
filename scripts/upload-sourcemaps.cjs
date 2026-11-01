const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
if (process.env.CI !== 'true' && process.env.EAS_BUILD !== 'true') {
  console.error('Source-map upload is allowed only in CI/EAS.');
  process.exit(1);
}
const missing = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'].filter(
  (key) => !process.env[key],
);
if (missing.length) {
  console.error(`Missing build configuration: ${missing.join(', ')}`);
  process.exit(1);
}
const directory = path.resolve(process.argv[2] ?? 'dist/sentry');
const outputRoot = path.resolve('dist') + path.sep;
if (
  !directory.startsWith(outputRoot) ||
  !fs.existsSync(path.join(directory, 'metadata.json'))
) {
  console.error('Expected a completed Expo export under dist/.');
  process.exit(1);
}
const child = spawnSync(
  process.execPath,
  [require.resolve('@sentry/expo-upload-sourcemaps/cli.js'), directory],
  { stdio: 'inherit', env: { ...process.env, SENTRY_LOG_LEVEL: 'warn' } },
);
process.exitCode = child.status ?? 1;
