import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import open from 'opener';
import { escape } from 'html-escaper';

const debug = require('debug')('rspackify');

const projectRoot = path.resolve(__dirname, '..');
const assetsRoot = path.join(projectRoot, 'public');

function escapeOptions(options: Record<string, any>): string {
  const text = util.inspect(options, { showHidden: false, depth: 6 })
  // Escapes `<` characters in text to safely use it in `<script>` tag.
  return JSON.stringify(text).replace(/</gu, '\\u003c');
}

function getAssetContent(filename: string): string {
  const assetPath = path.join(assetsRoot, filename);

  if (!assetPath.startsWith(assetsRoot)) {
    throw new Error(`"${filename}" is outside of the assets root`);
  }

  return fs.readFileSync(assetPath, 'utf8');
}

function html(strings: TemplateStringsArray, ...values: string[]): string {
  return strings.map((string, index) => `${string}${values[index] || ''}`).join('');
}

function getScript(filename: string): string {
  return `<!-- ${escape(filename)} -->
<script>${getAssetContent(filename)}</script>`;
}

function getCSS(filename: string): string {
  return `<!-- ${escape(filename)} -->
<style>${getAssetContent(filename)}</style>`;
}

function renderViewer(webpackConfig: any, rspackConfig: any) {
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
      window.webpackOptions = ${escapeOptions(webpackConfig)};
      window.rspackOptions = ${escapeOptions(rspackConfig)};
    </script>
    ${getScript('viewer.js')}
  </body>
</html>`;
}

export function generateReport(webpackConfig: any, rspackConfig: any) {
  const reportHtml = renderViewer(webpackConfig, rspackConfig);

  const reportFilepath = path.resolve(process.cwd(), 'rspackify-report.html');

  fs.mkdirSync(path.dirname(reportFilepath), { recursive: true });
  fs.writeFileSync(reportFilepath, reportHtml);

  debug('saved report to %s', reportFilepath);

  open(`file://${reportFilepath}`);
}
