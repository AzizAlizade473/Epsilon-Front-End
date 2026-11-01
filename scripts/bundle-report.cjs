const fs = require('node:fs');
const path = require('node:path');
function measure(directory, baseline) {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(directory, 'metadata.json'), 'utf8'),
  );
  const relative = metadata.fileMetadata.android.bundle;
  const file = path.resolve(directory, relative);
  if (
    !file.startsWith(path.resolve(directory) + path.sep) ||
    !file.endsWith('.hbc')
  )
    throw new Error('Expected an Android Hermes bundle within the export');
  const bytes = fs.statSync(file).size;
  return { bytes, baseline, growthPercent: (bytes / baseline - 1) * 100 };
}
module.exports = { measure };
if (require.main === module) {
  const baseline = require('../docs/bundle-baseline.json').androidHermesBytes;
  const result = measure(process.argv[2] ?? 'dist/ci', baseline);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/bundle.json', JSON.stringify(result, null, 2));
  const text = `Android Hermes: ${result.bytes.toLocaleString('en-US')} bytes; baseline ${baseline.toLocaleString('en-US')}; growth ${result.growthPercent.toFixed(2)}% (limit 10%).`;
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  if (result.growthPercent >= 10) process.exitCode = 1;
}
