const Module = require('module');
const path = require('path');

const defaultResolveFilename = Module._resolveFilename.bind(Module);
Module._resolveFilename = (request, parent, isMain, options) => {
  if (request === 'webpack') {
    request = path.resolve(__dirname, '../node_modules', '@rspack/core');
  }
	return defaultResolveFilename(
    request,
    parent,
    isMain,
    options,
  );
};
