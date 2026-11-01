const { spawnSync } = require('node:child_process');
const path = require('node:path');
// Match preview/production EAS settings; both flags are required by Expo SDK 58.
const result = spawnSync(
  process.execPath,
  [
    path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli'),
    'export',
    '--platform',
    'android',
    ...process.argv.slice(2),
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH: '1',
      EXPO_UNSTABLE_TREE_SHAKING: '1',
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
