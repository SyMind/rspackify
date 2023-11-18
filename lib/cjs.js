const Module = require('module');
const path = require('path');
const debug = require('debug')('rspackify')
const { mergeExports } = require('./webpack');

const nodeModulesPath = path.resolve(__dirname, '../node_modules');

const rspackCorePath = path.join(nodeModulesPath, '@rspack/core');
const rspackMainPath = path.join(rspackCorePath, 'dist/index.js');
const rspackFnPath = path.join(rspackCorePath, 'dist/rspack.js');

const rspackDevServerPath = path.join(nodeModulesPath, '@rspack/dev-server');
const rspackDevServerMainPath = path.join(rspackDevServerPath, 'dist/index.js');
const rspackDevServerFnPath = path.join(rspackDevServerPath, 'dist/server.js');

const defaultResolveFilename = Module._resolveFilename.bind(Module);
Module._resolveFilename = (request, parent, isMain, options) => {
  if (request === 'webpack') {
    request = require.resolve('@rspack/core');
  } else if (request === 'webpack-dev-server') {
    if (!parent.path.includes('@rspack/dev-server')) {
      request = rspackDevServerPath;
    }
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

const prepareOptions = (options) => {
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
  // rules 并不好处理，先暂时使用一个默认值覆盖
  options.module.rules = [
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
      test: /\.module\.css$/i,
      type: "css/module",
    },
    {
      test: /\.css$/i,
      type: "css",
    },
    {
      test: /\.(png|jpe?g|gif)$/i,
      type: "asset/resource",
    }
  ];

  // Removing css-loader style-loader and mini-css-extract-plugin
  if (options.plugins) {
    for (const plugin of options.plugins) {
      if (
        [
          'MiniCssExtractPlugin',
          'InlineChunkHtmlPlugin',
          'InterpolateHtmlPlugin',
          'ModuleNotFoundPlugin',
          'WebpackManifestPlugin',
          'ESLintWebpackPlugin',
          'ReactRefreshPlugin',
          'CaseSensitivePathsPlugin'
        ].includes(plugin.constructor.name)
      ) {
        options.plugins = options.plugins.filter(item => item !== plugin);
      }
      if (plugin.constructor.name === 'HtmlWebpackPlugin') {
        // Using builtins.html instead of html-webpack-plugin
        options.plugins = options.plugins.filter(item => item !== plugin);
        if (!options.builtins) {
          options.builtins = {};
        }
        options.builtins.html = [
          {
            template: plugin.userOptions.template,
            filename: plugin.userOptions.filename,
          }
        ];
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
    const OriginRspackDevServer = module.exports.RspackDevServer;
    module.exports.RspackDevServer = class RspackDevServer extends OriginRspackDevServer {
      constructor (options, compiler) {
        debug('Options provided to Rspack Dev Server %O', options);
        super(options, compiler);
      }
    }
  }
};
