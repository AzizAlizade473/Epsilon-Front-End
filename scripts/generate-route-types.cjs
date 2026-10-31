const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

// Use the exact generator shipped with the installed Expo CLI, also in CI.
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
const { getTypedRoutesDeclarationFile } = cliRequire(
  '@expo/router-server/build/typed-routes/generate',
);
const { requireContext } = require('expo-router/internal/testing');
const appRoot = path.resolve(__dirname, '../app');
const context = requireContext(appRoot, true, /\.[tj]sx?$/);
const declaration = getTypedRoutesDeclarationFile(context);
if (
  !declaration.includes('/home') ||
  !declaration.includes('/receipt/[receiptId]')
) {
  throw new Error('Expo route type generation is incomplete');
}
const outputDir = path.resolve(__dirname, '../.expo/types');
fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, 'router.d.ts');
if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== declaration) {
  fs.writeFileSync(output, declaration);
}
process.stdout.write('Expo route types generated from app/.\n');
