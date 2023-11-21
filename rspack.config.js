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
  builtins: {
		html: [
			{
				template: './client/index.html'
			}
		]
	},

  devtool: isDev ? 'eval' : 'source-map',
  watch: isDev,

  performance: {
    hints: false
  },
  optimization: {
    minimize: !isDev
  },
};
