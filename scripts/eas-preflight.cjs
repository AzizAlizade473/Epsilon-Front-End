if (process.env.EAS_BUILD_PROFILE === 'production') {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const child = spawnSync(
    process.execPath,
    [path.join(__dirname, 'production-guard.cjs'), '--environment'],
    { stdio: 'inherit' },
  );
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
}
