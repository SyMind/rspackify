const { RspackDevServer } = require('@rspack/dev-server');
const debug = require('debug')('rspackify');

class RspackifyRspackDevServer extends RspackDevServer {
    constructor (options, compiler) {
      debug('Options provided to RspackDevServer %O', options);
      super(options, compiler);
    }
};

module.exports = RspackifyRspackDevServer;
