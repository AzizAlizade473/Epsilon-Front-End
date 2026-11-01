const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
async function main() {
  if (process.arch !== 'x64' || !['linux', 'win32'].includes(process.platform))
    throw new Error(
      'Secret scanner supports Linux/Windows x64; scan was not performed',
    );
  const windows = process.platform === 'win32';
  const artifact = windows
    ? 'gitleaks_8.30.1_windows_x64.zip'
    : 'gitleaks_8.30.1_linux_x64.tar.gz';
  const expected = windows
    ? 'd29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e'
    : '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb';
  const directory = path.resolve('.tools/gitleaks-8.30.1');
  fs.mkdirSync(directory, { recursive: true });
  const archive = path.join(directory, artifact);
  if (!fs.existsSync(archive)) {
    const response = await fetch(
      `https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/${artifact}`,
    );
    if (!response.ok) throw new Error('Could not obtain pinned secret scanner');
    fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  }
  if (
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(archive))
      .digest('hex') !== expected
  )
    throw new Error('Secret scanner checksum mismatch');
  const unpack = spawnSync('tar', ['-xf', archive, '-C', directory], {
    stdio: 'inherit',
  });
  if (unpack.error || unpack.status !== 0)
    throw new Error('Could not unpack verified secret scanner');
  fs.mkdirSync('reports', { recursive: true });
  const scan = spawnSync(
    path.join(directory, windows ? 'gitleaks.exe' : 'gitleaks'),
    [
      'git',
      '.',
      ...(process.argv.includes('--staged')
        ? ['--staged']
        : ['--log-opts=--all']),
      '--redact=100',
      '--no-banner',
      '--exit-code=1',
      '--report-format=json',
      '--report-path=reports/secret-scan.json',
    ],
    { stdio: 'inherit' },
  );
  if (scan.error) throw scan.error;
  process.exitCode = scan.status ?? 1;
}
main().catch(() => {
  console.error('Secret scan could not complete; refusing a passing result.');
  process.exitCode = 1;
});
