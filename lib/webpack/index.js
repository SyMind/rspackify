const mergeExports = (obj, exports) => {
  const names = Object.getOwnPropertyNames(exports);
  for (const name of names) {
    obj[name] = exports[name];
  }
  return obj;
};

module.exports = {
  mergeExports
};
