// Expo SDK 58's Jest preset transforms static modules but leaves import() to
// Node's ESM VM. Enable the installed Babel CommonJS plugin's own async import
// transform, preserving lazy evaluation and Jest module mocks. Test runtime only.
module.exports = function jestDynamicImport() {
  return {
    pre() {
      this.file.set('@babel/plugin-proposal-dynamic-import', '7.0.0');
    },
  };
};
