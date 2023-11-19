const Module = require('module');
const path = require('path');
const debug = require('debug')('rspackify');
const { mergeExports } = require('./webpack');
const prepareOptions = require('./prepareOptions');

/** @typedef {import("webpack").Configuration} Configuration */
/** @typedef {import("html-webpack-plugin").Options} HtmlWebpackPluginOptions */
/** @typedef {import("@rspack/core").HtmlRspackPluginOptions} HtmlRspackPluginOptions */

const nodeModulesPath = path.resolve(__dirname, '../node_modules');

const rspackCorePath = path.join(nodeModulesPath, '@rspack/core');
const rspackMainPath = path.join(rspackCorePath, 'dist/index.js');
const rspackFnPath = path.join(rspackCorePath, 'dist/rspack.js');

const rspackDevServerPath = path.join(nodeModulesPath, '@rspack/dev-server');
const rspackDevServerMainPath = path.join(rspackDevServerPath, 'dist/index.js');
const rspackDevServerFnPath = path.join(rspackDevServerPath, 'dist/server.js');

// @ts-ignore
const defaultResolveFilename = Module._resolveFilename.bind(Module);
// @ts-ignore
Module._resolveFilename = (request, parent, isMain, options) => {
  if (request === 'webpack') {
    request = require.resolve('@rspack/core');
  } else if (request === 'webpack-dev-server') {
    if (!parent.path.includes('@rspack/dev-server')) {
      request = rspackDevServerPath;
    }
  } else if (request === 'html-webpack-plugin') {
    request = require.resolve('@rspack/plugin-html');
  }
	return defaultResolveFilename(
    request,
    parent,
    isMain,
    options,
  );
};

// @ts-ignore
const extensions = Module._extensions;
const defaultLoader = extensions['.js'];

extensions['.js'] = (module, filePath) => {
  defaultLoader(module, filePath);

  if (filePath === rspackMainPath) {
    // missing exports in rspack
    if (!module.exports.sources) {
      module.exports.sources = require('webpack-sources');
    }
    if (!module.exports.Template) {
      module.exports.Template = require('./webpack/lib/Template');
    }
    if (!module.exports.IgnorePlugin) {
      module.exports.IgnorePlugin = class RspackifyIgnorePlugin {
        apply() {
          console.log('[Rspackify] IgnorePlugin is not supported in rspack. A void placeholder will be provided as a substitute.');
        }
      };
    }
    if (!module.exports.RuntimeModule) {
      module.exports.RuntimeModule = class RspackifyRuntimeModule {
        constructor() {
          console.log('[Rspackify] RuntimeModule is not supported in rspack. A void placeholder will be provided as a substitute.');
        }
      };
    }
    if (!module.exports.util) {
      // The util is not supported in rspack
      module.exports.util = {};
    }
    if (!module.exports.util.serialization) {
      module.exports.util.serialization = {
        register() {
          console.log('[Rspackify] util.serialization.register is not supported in rspack. A void placeholder will be provided as a substitute.');
        }
      }
    }

    // default export should be a rspack function
    const originExports = module.exports;
    module.exports = mergeExports(originExports.rspack, originExports);
    module.exports.default = module.exports;
  } else if (filePath === rspackFnPath) {
    const originRspack = module.exports.rspack;

    /**
     * @param {Configuration & ReadonlyArray<Configuration>} options
     * @param {*} callback
     * @returns
     */
    module.exports.rspack = (options, callback) => {
      debug('Original options provided to webpack %O', options);
      prepareOptions(options);
      debug('Options provided to Rspack %O', options);

      return originRspack(options, callback);
    };
  } else if (filePath === rspackDevServerMainPath) {
    const originExports = module.exports;
    module.exports = mergeExports(originExports.RspackDevServer, originExports);
    module.exports.default = module.exports;
  } else if (filePath === rspackDevServerFnPath) {
    const RspackDevServer = module.exports.RspackDevServer;
    module.exports.RspackDevServer = class RspackifyRspackDevServer extends RspackDevServer {
      constructor (options, compiler) {
        debug('Options provided to RspackDevServer %O', options);
        super(options, compiler);
      }
    };
  } else if (filePath === require.resolve('@rspack/plugin-html')) {
    const HTMLRspackPlugin = module.exports.default;
    module.exports = HTMLRspackPlugin;
    module.exports.HTMLRspackPlugin = class RspackifyHTMLRspackPlugin extends HTMLRspackPlugin {
      /**
       * @param {HtmlWebpackPluginOptions} options
       */
      constructor ({
        filename,
        template,
        templateContent,
        templateParameters,
        inject,
        publicPath,
        scriptLoading,
        chunks,
        excludedChunks,
        sri,
        minify,
        title,
        favicon,
        // meta,
      }) {
        /** @type { HtmlRspackPluginOptions } */
        const htmlRspackPluginOptions = {
          // The HtmlRspackPlugin does not support filenames of the 'function' type.
          filename: typeof filename === 'string' ? filename : undefined,
          template,
          // The HtmlRspackPlugin does not support templateContent of the 'string' type.
          templateContent: typeof templateContent === 'string' ? templateContent : undefined,
          templateParameters: typeof templateParameters === 'object' ? templateParameters : undefined,
          inject,
          publicPath,
          scriptLoading,
          // The HtmlRspackPlugin does not support chunks of the 'all' value.
          chunks: Array.isArray(chunks) ? chunks : undefined,
          excludedChunks,
          sri,
          // The HtmlRspackPlugin only support minify of the 'boolean' type.
          minify: typeof minify === 'boolean' ? minify : undefined,
          title,
          favicon: typeof favicon ==='string'? favicon : undefined,
          // meta: typeof meta === 'object' ?  meta : undefined,
        };
        debug('Options provided to HTMLRspackPlugin %O', htmlRspackPluginOptions);
        super(htmlRspackPluginOptions);
      }
    };
  }
};
