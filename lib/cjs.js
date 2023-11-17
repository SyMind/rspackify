const Module = require('module');
const path = require('path');
const { mergeExports } = require('./webpack');

const nodeModulesPath = path.resolve(__dirname, '../node_modules');
const rspackCorePath = path.join(nodeModulesPath, '@rspack/core');
const rspackMainPath = path.join(rspackCorePath, 'dist/index.js');

const defaultResolveFilename = Module._resolveFilename.bind(Module);
Module._resolveFilename = (request, parent, isMain, options) => {
  if (request === 'webpack') {
    request = path.resolve(__dirname, '../node_modules', '@rspack/core');
  }
	return defaultResolveFilename(
    request,
    parent,
    isMain,
    options,
  );
};

const extensions = Module._extensions;
const defaultLoader = extensions['.js'];
extensions['.js'] = (module, filePath) => {
  defaultLoader(module, filePath);

  if (filePath === rspackMainPath) {
    // 缺失的导出
    module.exports.sources = require('webpack-sources');

    // 默认导出应当是 rspack 函数
    const originExports = module.exports;
    module.exports = mergeExports(originExports.rspack, originExports);
    module.exports.default = module.exports;
  }
};
