const Module = require('module');
const path = require('path');
const { mergeExports } = require('./webpack');

const nodeModulesPath = path.resolve(__dirname, '../node_modules');
const rspackCorePath = path.join(nodeModulesPath, '@rspack/core');
const rspackMainPath = path.join(rspackCorePath, 'dist/index.js');
const rspackFnPath = path.join(rspackCorePath, 'dist/rspack.js');

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
    module.exports.default = originExports;
  } else if (filePath === rspackFnPath) {
    const originRspack = module.exports.rspack;
    module.exports.rspack = (options, callback) => {
      // 移除 rspack 不支持的配置
      if (options.output) {
        delete options.output.pathinfo;
        delete options.output.devtoolModuleFilenameTemplate;
      }
      if ('cache' in options) {
        options.cache = !!options.cache;
      }
      if (options.resolve) {
        delete options.resolve.plugins;
      }
      if (options.module) {
        delete options.module.strictExportPresence;
      }
      if ('bail' in options) {
        delete options.bail;
      }
      if ('performance' in options) {
        delete options.performance;
      }
      return originRspack(options, callback);
    };
  }
};
