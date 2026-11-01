const { test, expect, jest: jestApi } = require('@jest/globals');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(output, { exports });
  return exports.decorativeSvgProps;
}
test('decorative browser SVGs render valid ARIA without native boolean DOM warnings', () => {
  const props = load('src/lib/decorative-svg.web.ts');
  const error = jestApi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const html = renderToStaticMarkup(React.createElement('svg', props));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('accessible=');
    expect(error).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
  }
});
test('native SVGs retain their non-accessible/non-focusable semantics', () => {
  expect(load('src/lib/decorative-svg.ts')).toEqual({
    accessible: false,
    focusable: false,
  });
});
