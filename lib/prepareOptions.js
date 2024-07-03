const cloneDeep = require('lodash/cloneDeep');

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
 * @param {Configuration & ReadonlyArray<Configuration>} webpackOptions
 */
const prepareOptions = webpackOptions => {
  const options = cloneDeep(webpackOptions);

  if (Array.isArray(options)) {
    return options.map(entryOptions => prepareOptions(entryOptions));
  }

  if (Array.isArray(options.target)) {
    options.target = options.target.filter(t => t !== 'es6');
  }

  if (!options.module) {
    options.module = {};
  }

  // if (options.module.rules) {
  //   options.module.rules = prepareRules(options.module.rules);
  // }

  // Removing css-loader style-loader and mini-css-extract-plugin
  if (options.plugins) {
    for (const plugin of options.plugins) {
      if (
        [
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

  if (options.optimization) {
    // Use Rspack internal minimizer
    delete options.optimization.minimizer;
  }

  return options;
}

module.exports = prepareOptions;
