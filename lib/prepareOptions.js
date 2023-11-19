/** @typedef {import("webpack").Configuration} Configuration */
/** @typedef {import("@rspack/core").Configuration} RspackConfiguration */
/** @typedef {import("webpack").RuleSetRule} WebpackRuleSetRule */
/** @typedef {import("@rspack/core").RuleSetRule} RspackRuleSetRule */

/**
 * @param {(WebpackRuleSetRule | "...")[]} webpackRules
 * @returns {*[]}
 */
const prepareRules = webpackRules => {
  const rspackRules = [];
  for (const webpackRule of webpackRules) {
    if (typeof webpackRule === 'string') {
      rspackRules.push(webpackRule);
      continue;
    }
    if (webpackRule.oneOf) {
      webpackRule.oneOf = prepareRules(webpackRule.oneOf);
    }
    if (webpackRule.rules) {
      webpackRule.rules = prepareRules(webpackRule.rules);
    }
    // TODO: Add more detailed checks to see if it's possible to remove babel-loader and use built-in loader instead.
    if (webpackRule.loader) {
      if (webpackRule.loader.includes('css-loader')) {
        delete webpackRule.loader;
        webpackRule.type = 'css/auto';
      }
    }
    if (typeof webpackRule.use === 'string') {
      if (webpackRule.use.includes('css-loader')) {
        delete webpackRule.use;
        webpackRule.type = 'css/auto';
      }
    }

    // TODO:
    delete webpackRule.generator;

    if (Array.isArray(webpackRule.use)) {
      for (const item of webpackRule.use) {
        if ((
          typeof item === 'string' && item.includes('css-loader')) ||
          (typeof item === 'object' && item.loader?.includes('css-loader'))
        ) {
          webpackRule.use.filter(i => i !== item);
          webpackRule.type = 'css/auto';
        }
      }
    }
    rspackRules.push(webpackRule);
  }
  return rspackRules;
}

/**
 * @param {Configuration & ReadonlyArray<Configuration>} options
 */
const prepareOptions = options => {
  if (Array.isArray(options)) {
    options.forEach(entryOptions => prepareOptions(entryOptions));
    return;
  }

  // Remove configuration options which are not supported by Rspack
  if (options.output) {
    delete options.output.pathinfo;
    delete options.output.devtoolModuleFilenameTemplate;
  }
  if ('cache' in options) {
    options.cache = !!options.cache;
  }
  if (options.resolve) {
    delete options.resolve.plugins;
    delete options.resolve.symlinks;
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
    options.module.rules = prepareRules(options.module.rules);
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

  // TODO: compatible with optimization
  if (options.optimization) {
    delete options.optimization.minimizer;
    delete options.optimization.splitChunks;

    // fix: https://github.com/web-infra-dev/rspack/pull/4698
    if (options.optimization.nodeEnv) {
      if (!options.plugins) {
        options.plugins = [];
      }
      const rspack = require('@rspack/core');
      /**
       * @type {any}
       */
      const plugin = new rspack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      });
      options.plugins.push(plugin);
      delete options.optimization.nodeEnv;
    }
  }
}

module.exports = prepareOptions;
