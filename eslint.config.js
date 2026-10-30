const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const fs = require('node:fs');
const path = require('node:path');

const featureRoot = path.join(__dirname, 'src/features');
const features = fs.existsSync(featureRoot)
  ? fs
      .readdirSync(featureRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];
const zones = [
  { target: './src', from: './app' },
  { target: './src/components', from: './src/features' },
  { target: './src/services', from: ['./src/features', './src/components'] },
  {
    target: './src/lib',
    from: ['./src/features', './src/components', './src/services'],
  },
  {
    target: './src/design',
    from: ['./src/features', './src/components', './src/services', './src/lib'],
  },
  ...features.map((name) => ({
    target: `./src/features/${name}`,
    from: './src/features',
    except: [`./${name}`],
    message:
      'Features must not import another feature internals; use shared layers.',
  })),
];

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'android/**',
      'ios/**',
    ],
  },
  expo,
  {
    files: ['eslint.config.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { __dirname: 'readonly' },
    },
  },
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'import/no-cycle': ['error', { ignoreExternal: true }],
      'import/no-restricted-paths': ['error', { basePath: __dirname, zones }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
]);
