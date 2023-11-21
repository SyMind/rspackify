const path = require('path');
const fs = require('fs');
const open = require('opener');
const util = require('util');
const debug = require('debug')('rspackify');

const { escape } = require('html-escaper');

const projectRoot = path.resolve(__dirname, '..');
const assetsRoot = path.join(projectRoot, 'public');

function escapeOptions(options) {
  const text = util.inspect(options, { showHidden: false, depth: 16 })
  // Escapes `<` characters in text to safely use it in `<script>` tag.
  return JSON.stringify(text).replace(/</gu, '\\u003c');
}

function getAssetContent(filename) {
  const assetPath = path.join(assetsRoot, filename);

  if (!assetPath.startsWith(assetsRoot)) {
    throw new Error(`"${filename}" is outside of the assets root`);
  }

  return fs.readFileSync(assetPath, 'utf8');
}

function html(strings, ...values) {
  return strings.map((string, index) => `${string}${values[index] || ''}`).join('');
}

function getScript(filename) {
  return `<!-- ${escape(filename)} -->
<script>${getAssetContent(filename)}</script>`;
}

function getCSS(filename) {
  return `<!-- ${escape(filename)} -->
<style>${getAssetContent(filename)}</style>`;
}

function renderViewer(webpackOptions, rspackOptions) {
  return html`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Rspackify</title>
    ${getCSS('viewer.css')}
  </head>

  <body>
    <div id="root"></div>
    <script>
      window.webpackOptions = ${escapeOptions(webpackOptions)};
      window.rspackOptions = ${escapeOptions(rspackOptions)};
    </script>
    ${getScript('viewer.js')}
  </body>
</html>`;
}

function generateReport(webpackOptions, rspackOptions) {
  const reportHtml = renderViewer(webpackOptions, rspackOptions);

  const reportFilepath = path.resolve(process.cwd(), 'report.html');

  fs.mkdirSync(path.dirname(reportFilepath), { recursive: true });
  fs.writeFileSync(reportFilepath, reportHtml);

  debug('saved report to %s', reportFilepath);

  open(`file://${reportFilepath}`);
}

module.exports = generateReport;
