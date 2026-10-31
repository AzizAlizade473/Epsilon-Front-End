const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

// Keep the security override covered until Expo CLI adopts patched Zod upstream.
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliPackage = expoRequire.resolve('@expo/cli/package.json');
const cliRequire = createRequire(cliPackage);
assert.equal(cliRequire('zod/package.json').version, '4.6.6');
const { validate } = cliRequire('@expo/schema-utils');
const { z } = cliRequire('zod');
const server = path.join(path.dirname(cliPackage), 'build/src/start/server');
const { PluginSchema, DevToolsPluginOutputSchema } = require(
  path.join(server, 'devtools/DevToolsPlugin.schema.js'),
);
const { createMCPDevToolsExtensionSchema } = require(
  path.join(server, 'mcp/createMCPDevToolsExtensionSchema.js'),
);
const plugin = {
  packageName: 'toolchain-fixture',
  packageRoot: process.cwd(),
  cliExtensions: {
    description: 'Compatibility fixture',
    entryPoint: 'fixture.js',
    commands: [
      {
        name: 'inspect',
        title: 'Inspect',
        environments: ['cli', 'mcp'],
        parameters: [
          { name: 'label', type: 'text' },
          { name: 'count', type: 'number' },
          { name: 'confirm', type: 'confirm' },
        ],
      },
    ],
  },
};
assert.doesNotThrow(() => validate(PluginSchema, plugin));
assert.throws(() => validate(PluginSchema, { ...plugin, packageName: '' }));
const schema = createMCPDevToolsExtensionSchema(plugin, z);
assert.equal(
  schema.safeParse({ command: 'inspect', label: 'ok', count: 1, confirm: true })
    .success,
  true,
);
for (const invalid of [
  { command: 'unknown' },
  { command: 'inspect', count: '1' },
  { command: 'inspect', unexpected: true },
])
  assert.equal(schema.safeParse(invalid).success, false);
assert.doesNotThrow(() =>
  validate(DevToolsPluginOutputSchema, [
    { type: 'text', text: 'ok', level: 'info' },
  ]),
);
assert.throws(() =>
  validate(DevToolsPluginOutputSchema, [{ type: 'image', url: 'invalid' }]),
);
process.stdout.write('Expo CLI schema compatibility checks passed.\n');
