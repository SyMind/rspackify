const Module = require('module');

const defaultResolveFilename = Module._resolveFilename.bind(Module);
Module._resolveFilename = (request, parent, isMain, options) => {
  if (request === 'webpack') {
    request = '@rspack/core';
  }
	return defaultResolveFilename(
    request,
    parent,
    isMain,
    options,
  );
};
