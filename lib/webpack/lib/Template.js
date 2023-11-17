/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

"use strict";

const IDENTIFIER_NAME_REPLACE_REGEX = /^([^a-zA-Z$_])/;
const IDENTIFIER_ALPHA_NUMERIC_NAME_REPLACE_REGEX = /[^a-zA-Z0-9$]+/g;

class Template {
  /**
   * @param {string} str the string converted to identifier
   * @returns {string} created identifier
   */
  static toIdentifier(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(IDENTIFIER_NAME_REPLACE_REGEX, "_$1")
      .replace(IDENTIFIER_ALPHA_NUMERIC_NAME_REPLACE_REGEX, "_");
  }
}

module.exports = Template;
