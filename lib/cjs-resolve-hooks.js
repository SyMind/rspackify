const mod = require("module");
const path = require('path');
const debug = require('debug')('rspackify');
const { mergeExports } = require('./webpack');
const prepareOptions = require('./prepareOptions');
const generateReport = require('./generateReport');

/** @typedef {import("webpack").Configuration} Configuration */
/** @typedef {import("html-webpack-plugin").Options} HtmlWebpackPluginOptions */
/** @typedef {import("@rspack/core").HtmlRspackPluginOptions} HtmlRspackPluginOptions */

const rspackMainPath = require.resolve('@rspack/core');
const rspackCoreDir = path.resolve(rspackMainPath, '../..');
const rspackFnPath = path.join(rspackCoreDir, 'dist/rspack.js');

const rspackDevServerMainPath = require.resolve('@rspack/dev-server');
const rspackDevServerDir = path.resolve(rspackDevServerMainPath, '../..');
const rspackDevServerFnPath = path.join(rspackDevServerDir, 'dist/server.js');

// @ts-ignore
const defaultResolveFilename = mod._resolveFilename.bind(mod);
// @ts-ignore
mod._resolveFilename = (request, parent, isMain, options) => {
  switch (request) {
    case 'webpack':
      request = require.resolve('@rspack/core');
      break;
    case 'webpack-dev-server':
      if (!parent.path.includes(rspackDevServerDir)) {
        request = require.resolve('./webpack/webpack-dev-server');
      }
      break;
    case 'html-webpack-plugin':
      request = require.resolve('@rspack/plugin-html');
      break;
    case 'copy-webpack-plugin':
      request = require.resolve('./webpack-contrib/copy-webpack-plugin');
      break;

    // Next.js
    case 'next/dist/compiled/webpack/webpack':
      request = require.resolve('./next-webpack');
      break;
    // packages/react-refresh-utils/ReactRefreshWebpackPlugin.ts
    case 'next/dist/compiled/@next/react-refresh-utils/dist/ReactRefreshWebpackPlugin':
      request = require.resolve('@rspack/plugin-react-refresh');
      break;
    // packages/react-refresh-utils/loader.ts
    case 'next/dist/compiled/@next/react-refresh-utils/dist/loader':
      request = require.resolve('./webpack-contrib/react-refresh-loader');
      break;
    case 'next/dist/compiled/mini-css-extract-plugin':
      request = require.resolve('./webpack-contrib/mini-css-extract-plugin');
      break;
    case './profiling-plugin':
    case './webpack/plugins/profiling-plugin':
      request = require.resolve('./nextjs/profiling-plugin');
      break;
    case './next-drop-client-page-plugin':
    case './webpack/plugins/next-drop-client-page-plugin':
      request = require.resolve('./nextjs/next-drop-client-page-plugin');
      break;
    case './webpack/plugins/app-build-manifest-plugin':
      request = require.resolve('./nextjs/app-build-manifest-plugin');
      break;
    case './webpack/plugins/flight-manifest-plugin':
      request = require.resolve('./nextjs/flight-manifest-plugin');
      break;
    case './webpack/plugins/react-loadable-plugin':
      request = require.resolve('./nextjs/react-loadable-plugin');
      break;
    case './webpack/plugins/next-font-manifest-plugin':
      request = require.resolve('./nextjs/next-font-manifest-plugin');
      break;
    case '../../build/webpack/plugins/nextjs-require-cache-hot-reloader':
    case '../build/webpack/plugins/nextjs-require-cache-hot-reloader':
    case './webpack/plugins/nextjs-require-cache-hot-reloader':
      request = require.resolve('./nextjs/nextjs-require-cache-hot-reloader');
      break;
    case './webpack/plugins/flight-client-entry-plugin':
      request = require.resolve('./nextjs/flight-client-entry-plugin');
      break;
    case './webpack/plugins/next-types-plugin':
      request = require.resolve('./nextjs/next-types-plugin');
      break;
  }
	return defaultResolveFilename(
    request,
    parent,
    isMain,
    options,
  );
};

// @ts-ignore
const extensions = mod._extensions;
const defaultLoader = extensions['.js'];

extensions['.js'] = (module, filePath) => {
  defaultLoader(module, filePath);

  if (filePath === rspackMainPath) {
    // missing exports in rspack
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
     * @param {Configuration & ReadonlyArray<Configuration>} webpackOptions
     * @param {*} callback
     * @returns
     */
    module.exports.rspack = (webpackOptions, callback) => {
      const rspackOptions = prepareOptions(webpackOptions);
      if (debug.enabled) {
        generateReport(webpackOptions, rspackOptions);
      }
      return originRspack(rspackOptions, callback);
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
