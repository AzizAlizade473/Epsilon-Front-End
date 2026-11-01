const fs = require('node:fs');
const path = require('node:path');
const allowed = new Set([
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Apache-2.0',
]);
function allowedLicense(expression) {
  return expression
    .replace(/[()]/g, '')
    .split(' OR ')
    .some((option) =>
      option.split(' AND ').every((license) => allowed.has(license.trim())),
    );
}
function inspect(lock, manifest, exceptions) {
  const errors = [];
  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (
      !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version) ||
      lock.packages[`node_modules/${name}`]?.version !== version
    )
      errors.push(`Unpinned or mismatched direct dependency: ${name}`);
  }
  for (const [location, pkg] of Object.entries(lock.packages)) {
    if (!location) continue;
    if (
      !pkg.integrity ||
      !pkg.resolved?.startsWith('https://registry.npmjs.org/')
    )
      errors.push(`Unverified dependency origin/integrity: ${location}`);
    if (pkg.dev) continue;
    const exception = exceptions[location];
    if (
      !allowedLicense(pkg.license ?? '') &&
      !(
        exception?.version === pkg.version && exception?.license === pkg.license
      )
    )
      errors.push(
        `License review required: ${location}@${pkg.version} (${pkg.license ?? 'missing'})`,
      );
  }
  return errors;
}
module.exports = { inspect, allowedLicense };
if (require.main === module) {
  const root = path.join(__dirname, '..');
  const read = (file) =>
    JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const errors = inspect(
    read('package-lock.json'),
    read('package.json'),
    read('scripts/license-exceptions.json').packages,
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      'Production licenses, exact approved exceptions, direct pins and registry integrity passed.',
    );
}
