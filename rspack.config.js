const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';

/**
 * @type {import('@rspack/cli').Configuration}
 */
module.exports = {
  mode: isDev ? 'development' : 'production',
  context: __dirname,
  entry: './client/viewer',
  output: {
    path: `${__dirname}/public`,
    filename: 'viewer.js',
    publicPath: '/'
  },
  experiments: {
    css: true
  },

  devtool: isDev ? 'eval' : 'source-map',
  watch: isDev,

  performance: {
    hints: false
  },
  optimization: {
    minimize: !isDev
  },
  plugins: [new HtmlWebpackPlugin()],
};
