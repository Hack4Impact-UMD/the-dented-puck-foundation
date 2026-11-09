// Execute application TypeScript with the installed compiler. Only native/Expo
// host modules are replaced; emulator integration uses the real Firebase SDK.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

exports.createLoader = function createLoader(overrides = {}) {
  const cache = new Map();
  return function load(relative) {
    const filename = path.resolve(__dirname, '../..', relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = new Module(filename, module);
    cache.set(filename, loaded);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    const baseRequire = loaded.require.bind(loaded);
    loaded.require = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('@/')) {
        const local = path.resolve(__dirname, '../../src', name.slice(2));
        if (local.endsWith('.json')) return baseRequire(local);
        const resolved = [local + '.ts', local + '.tsx', local + '/index.ts'].find(fs.existsSync);
        if (!resolved) throw new Error(`Cannot resolve ${name}`);
        return load(path.relative(path.resolve(__dirname, '../..'), resolved));
      }
      return baseRequire(name);
    };
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    loaded._compile(compiled.outputText, filename);
    return loaded.exports;
  };
};
