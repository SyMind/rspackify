const mod = require("module");
const path = require('path');
const fs = require('fs');
const debug = require('debug')('rspackify');
const semver = require('semver');
const { findPackageSync } = require('fd-package-json');
const { prepareRspackConfig } = require('./prepare-rspack-config');
const { generateReport } = require('./generate-report');

const { printRspackVersion } = (new class {
  printed = false
  
  printRspackVersion = () => {
    if (this.printed) {
      return;
    }
    this.printed = true;
    const rspack = require('@rspack/core');
    console.log('Powered by Rspack, version:', rspack.rspackVersion)
    console.log()
  }
})

/** @typedef {import("webpack").Configuration} Configuration */
/** @typedef {import("@rspack/core").HtmlRspackPluginOptions} HtmlRspackPluginOptions */

const rspackMainPath = require.resolve('@rspack/core');
const rspackCoreDir = path.resolve(rspackMainPath, '../..');
const rspackFnPath = path.join(rspackCoreDir, 'dist/rspack.js');

const rspackDevServerMainPath = require.resolve('@rspack/dev-server');
const rspackDevServerDir = path.resolve(rspackDevServerMainPath, '../..');

const rspackDevServerMainPathV4 = require.resolve('@rspack/dev-server-v4');
const rspackDevServerDirV4 = path.resolve(rspackDevServerMainPathV4, '../..');

// @ts-ignore
const defaultResolveFilename = mod._resolveFilename.bind(mod);
// @ts-ignore
mod._resolveFilename = (request, parent, isMain, options) => {
  switch (request) {
    case 'webpack':
      printRspackVersion();
      request = require.resolve('@rspack/core');
      break;
    case 'webpack-dev-server':
      if (!parent.path.includes(rspackDevServerDir) && !parent.path.includes(rspackDevServerDirV4)) {
        const webpackDevServerPath = defaultResolveFilename(request, parent, isMain, options);
        const packageJson = findPackageSync(webpackDevServerPath);
        if (packageJson.name !== 'webpack-dev-server') {
          console.warn(
            "Rspackify: Unable to detect your webpack-dev-server version. " +
            "Using the latest @rspack/dev-server, which is based on webpack-dev-server@v5. " +
            "This may lead to compatibility issues."
          );
          request = require.resolve('./webpack/webpack-dev-server');
        } else {
          if (semver.lt(packageJson.version, '5.0.0')) {
            request = require.resolve('./webpack/webpack-dev-server-v4');
          } else {
            request = require.resolve('./webpack/webpack-dev-server');
          }
        }
      }
      break;
    case 'copy-webpack-plugin':
      request = require.resolve('./webpack-contrib/copy-webpack-plugin');
      break;
    case 'mini-css-extract-plugin':
      request = require.resolve('./webpack-contrib/mini-css-extract-plugin');
      break;
    case '@pmmmwh/react-refresh-webpack-plugin':
      request = require.resolve('./webpack-contrib/react-refresh-webpack-plugin');
      break;
    case 'webpack-manifest-plugin':
      request = require.resolve('./webpack-contrib/webpack-manifest-plugin');
      break;
    case 'webpack-virtual-modules':
      request = require.resolve('./webpack-contrib/webpack-virtual-modules');
      break;
    case 'workbox-webpack-plugin':
        request = require.resolve('./webpack-contrib/workbox-webpack-plugin');
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

    // umijs
    case '@umijs/bundler-webpack/compiled/webpack':
    case '../compiled/webpack':
    case '../../compiled/webpack':
      request = require.resolve('@rspack/core');
      break;
    case '@umijs/bundler-webpack/compiled/mini-css-extract-plugin':
      request = require.resolve('./webpack-contrib/mini-css-extract-plugin');
      break;
    case '@umijs/bundler-webpack/compiled/webpack-manifest-plugin':
      equest = require.resolve('./webpack-contrib/webpack-manifest-plugin');
      break;
    case '../../compiled/webpack-virtual-modules':
      request = require.resolve('./webpack-contrib/webpack-virtual-modules');
      break;
    case '@umijs/react-refresh-webpack-plugin/lib':
      request = require.resolve('./webpack-contrib/react-refresh-webpack-plugin');
      break;
    case '@umijs/bundler-webpack/compiled/mini-css-extract-plugin/loader':
      const { CssExtractRspackPlugin } = require('@rspack/core');
      request = CssExtractRspackPlugin.loader;
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
    if (!module.exports.cli) {
      module.exports.cli = require('./webpack/lib/cli');
    }
    if (!module.exports.util.serialization) {
      module.exports.util.serialization = {
        register() {
          console.log('[Rspackify] util.serialization.register is not supported in rspack. A void placeholder will be provided as a substitute.');
        }
      }
    }

    const mergeExports = (obj, exports) => {
      const names = Object.getOwnPropertyNames(exports);
      for (const name of names) {
        obj[name] = exports[name];
      }
      return obj;
    };

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
      const rspackOptions = prepareRspackConfig(webpackOptions);
      if (debug.enabled) {
        generateReport(webpackOptions, rspackOptions);
      }
      return originRspack(rspackOptions, callback);
    };
  }
};
