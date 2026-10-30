const { test, expect } = require('@jest/globals');
const { execFileSync } = require('node:child_process');

test('patched Expo CLI schemas accept valid inputs and reject invalid inputs', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-toolchain.cjs']),
  ).not.toThrow();
});

test('lint rejects unsafe types, invalid hooks, and reversed dependencies', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-lint.cjs']),
  ).not.toThrow();
}, 30000);
