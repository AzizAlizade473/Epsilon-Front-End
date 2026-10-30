const assert = require('node:assert/strict');
const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const eslint = new ESLint();
  const cases = [
    [
      'src/lib/probe.ts',
      'export const value: any = 1;',
      '@typescript-eslint/no-explicit-any',
    ],
    [
      'src/services/probe.ts',
      "import Bootstrap from '../../app/index'; export default Bootstrap;",
      'import/no-restricted-paths',
    ],
    [
      'app/probe.tsx',
      "import { useState } from 'react'; export function Example({ enabled }: { enabled: boolean }) { if (enabled) useState(0); return null; }",
      'react-hooks/rules-of-hooks',
    ],
  ];
  for (const [filePath, code, rule] of cases) {
    // Cycle analysis reads the module graph from disk, including the source.
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, code, { flag: 'wx' });
    try {
      const [result] = await eslint.lintFiles(filePath);
      assert.ok(
        result.messages.some(
          (message) => message.ruleId === rule && message.severity === 2,
        ),
        `Missing rejection: ${rule}`,
      );
    } finally {
      fs.unlinkSync(filePath);
    }
  }
  const validPath = 'src/lib/probe-valid.ts';
  fs.writeFileSync(validPath, 'export const value: number = 1;', {
    flag: 'wx',
  });
  try {
    const [valid] = await eslint.lintFiles(validPath);
    assert.equal(valid.errorCount, 0);
  } finally {
    fs.unlinkSync(validPath);
  }
  process.stdout.write('Lint enforcement checks passed.\n');
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
