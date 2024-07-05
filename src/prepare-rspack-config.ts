import { cloneDeep } from 'lodash';
import type { Configuration as WebpackConfiguration } from 'webpack';
import type { Configuration as RspackConfiguration } from '@rspack/core';

// const prepareRules = (webpackRules: (WebpackRuleSetRule | "...")[]) => {
//   const rspackRules = [];
//   for (const webpackRule of webpackRules) {
//     if (typeof webpackRule === 'string') {
//       rspackRules.push(webpackRule);
//       continue;
//     }
//     if (webpackRule.oneOf) {
//       webpackRule.oneOf = prepareRules(webpackRule.oneOf);
//     }
//     if (webpackRule.rules) {
//       webpackRule.rules = prepareRules(webpackRule.rules);
//     }
//     // TODO: Add more detailed checks to see if it's possible to remove babel-loader and use built-in loader instead.
//     if (webpackRule.loader) {
//       if (webpackRule.loader.includes('css-loader')) {
//         delete webpackRule.loader;
//         webpackRule.type = 'css/auto';
//       }
//     }
//     if (typeof webpackRule.use === 'string') {
//       if (webpackRule.use.includes('css-loader')) {
//         delete webpackRule.use;
//         webpackRule.type = 'css/auto';
//       }
//     }

//     // TODO:
//     delete webpackRule.generator;

//     if (Array.isArray(webpackRule.use)) {
//       for (const item of webpackRule.use) {
//         if ((
//           typeof item === 'string' && item.includes('css-loader')) ||
//           (typeof item === 'object' && item.loader?.includes('css-loader'))
//         ) {
//           webpackRule.use.filter(i => i !== item);
//           webpackRule.type = 'css/auto';
//         }
//       }
//     }
//     rspackRules.push(webpackRule);
//   }
//   return rspackRules;
// }

export const prepareRspackConfig = (
    webpackConfig: WebpackConfiguration | WebpackConfiguration[]
): RspackConfiguration | RspackConfiguration[] => {
  if (Array.isArray(webpackConfig)) {
    return webpackConfig.map(config => prepareRspackConfig(config) as RspackConfiguration);
  }

  const config = cloneDeep(webpackConfig);

  // if (config.module.rules) {
  //   config.module.rules = prepareRules(config.module.rules);
  // }

  // Removing css-loader style-loader and mini-css-extract-plugin
  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (
        plugin &&
        [
          'ModuleNotFoundPlugin',
        ].includes(plugin.constructor.name)
      ) {
        config.plugins = config.plugins.filter(item => item !== plugin);
      }
    }
  }

  if (config.optimization) {
    // Use Rspack internal minimizer
    delete config.optimization.minimizer;
  }

  return config as any as RspackConfiguration;
}
