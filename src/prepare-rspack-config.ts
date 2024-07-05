import { cloneDeep } from 'lodash';
import type { Configuration as WebpackConfiguration, RuleSetRule as WebpackRuleSetRule } from 'webpack';
import type { Configuration as RspackConfiguration, RuleSetRule as RspackRuleSetRule } from '@rspack/core';

function prepareRspackUse(webpackUse: WebpackRuleSetRule['use']): RspackRuleSetRule['use'] {
  if (typeof webpackUse === 'string') {
    if (webpackUse === 'swc-loader') {
      return 'builtin:swc-loader';
    }
    return webpackUse;
  }
  if (Array.isArray(webpackUse)) {
    for (const item of webpackUse) {
      if (item) {
        prepareRspackUse(item);
      }
    }
  }
  return webpackUse as RspackRuleSetRule['use'];
}

function prepareRspackRules(webpackRules: (undefined | null | false | "" | 0 | WebpackRuleSetRule | "...")[]): (RspackRuleSetRule | "...")[] {
  const rspackRules: (RspackRuleSetRule | "...")[] = [];
  for (const webpackRule of webpackRules) {
    if (!webpackRule) {
      continue;
    }
    if (typeof webpackRule === 'string') {
      rspackRules.push(webpackRule);
      continue;
    }
   
    const rspackRule = webpackRule as RspackRuleSetRule;
    if (webpackRule.oneOf) {
      rspackRule.oneOf = prepareRspackRules(webpackRule.oneOf) as RspackRuleSetRule[];
    }
    if (webpackRule.rules) {
      rspackRule.rules = prepareRspackRules(webpackRule.rules) as RspackRuleSetRule[];
    }
    if (webpackRule.use) {
      rspackRule.use = prepareRspackUse(webpackRule.use);
    }
    rspackRules.push(rspackRule);
  }
  return rspackRules;
}

export const prepareRspackConfig = (
    webpackConfig: WebpackConfiguration | WebpackConfiguration[]
): RspackConfiguration | RspackConfiguration[] => {
  if (Array.isArray(webpackConfig)) {
    return webpackConfig.map(config => prepareRspackConfig(config) as RspackConfiguration);
  }

  const config = cloneDeep(webpackConfig);

  if (config.module.rules) {
    config.module.rules = prepareRspackRules(config.module.rules) as any;
  }

  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (
        plugin &&
        [
          // ...
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
