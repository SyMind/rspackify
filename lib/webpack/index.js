/**
 * @template A
 * @template B
 * @param {A} obj input a
 * @param {B} exports input b
 * @returns {A & B} merged
 */
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
