const Module = require('module');
const path = require('path');
const debug = require('debug')('rspackify')
const { mergeExports } = require('./webpack');

/** @typedef {import("webpack").Configuration} Configuration */
/** @typedef {import("webpack").RuleSetRule} RuleSetRule */
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

/**
 *
 * @param {Configuration & ReadonlyArray<Configuration>} options
 */
const prepareOptions = options => {
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

  if (!options.module) {
    options.module = {};
  }

  if (options.module.rules) {
    /**
     *
     * @param {(RuleSetRule | "...")[]} rules
     * @returns {*[]}
     */
    function filterRules(rules) {
      return rules
        .filter(rule => {
          if (typeof rule === 'string') {
            return true;
          }
          return !(
            rule.test instanceof RegExp && (
              rule.test.test('.css') ||
              rule.test.test('.scss') ||
              rule.test.test('.sass') ||
              rule.test.test('.js') ||
              rule.test.test('.mjs') ||
              rule.test.test('.jsx') ||
              rule.test.test('.ts') ||
              rule.test.test('.tsx')
            )
          )
        })
        .map(rule => {
          if (typeof rule === 'string') {
            return;
          }

          if (rule.oneOf) {
            return {
              ...rule,
              oneOf: filterRules(rule.oneOf),
            };
          }

          if (rule.rules) {
            return {
              ...rule,
              rules: filterRules(rule.rules),
            };
          }
          return rule;
        });
    }

    options.module.rules = filterRules(options.module.rules);
    options.module.rules.push(
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'sass-loader',
            options: {
            },
          },
        ],
        type: 'css/auto',
      },
      {
        test: /\.css$/i,
        type: 'css/auto',
      },
      {
        test: /\.js$/,
        type: 'jsx',
      },
      {
        test: /\.ts$/,
        type: 'tsx',
      },
    );
  }

  // Removing css-loader style-loader and mini-css-extract-plugin
  if (options.plugins) {
    for (const plugin of options.plugins) {
      if (
        [
          'MiniCssExtractPlugin',
          'InlineChunkHtmlPlugin',
          'ModuleNotFoundPlugin',
          'WebpackManifestPlugin',
          'ESLintWebpackPlugin',
          'ReactRefreshPlugin',
          'CaseSensitivePathsPlugin'
        ].includes(plugin.constructor.name)
      ) {
        options.plugins = options.plugins.filter(item => item !== plugin);
      }
    }
  }

  // TODO: 处理 minimizer
  if (options.optimization) {
    delete options.optimization.minimizer;
  }
}

extensions['.js'] = (module, filePath) => {
  defaultLoader(module, filePath);

  if (filePath === rspackMainPath) {
    // missing exports in rspack
    module.exports.sources = require('webpack-sources');
    module.exports.Template = require('./webpack/lib/Template');

    // default export should be a rspack function
    const originExports = module.exports;
    module.exports = mergeExports(originExports.rspack, originExports);
    module.exports.default = originExports;
  } else if (filePath === rspackFnPath) {
    const originRspack = module.exports.rspack;

    /**
     * @param {Configuration & ReadonlyArray<Configuration>} options
     * @param {*} callback
     * @returns
     */
    module.exports.rspack = (options, callback) => {
      debug('Original options provided to webpack %O', options);
      if (Array.isArray(options)) {
        options.forEach(entryOptions => prepareOptions(entryOptions));
      } else {
        prepareOptions(options);
      }
      debug('Options provided to Rspack %O', options);

      return originRspack(options, callback);
    };
  } else if (filePath === rspackDevServerMainPath) {
    const originExports = module.exports;
    module.exports = mergeExports(originExports.RspackDevServer, originExports);
    module.exports.default = originExports;
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
