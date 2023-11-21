import { createTwoFilesPatch } from 'diff';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';

const diffOutput = createTwoFilesPatch('webpack', 'rspack', window.webpackOptions, window.rspackOptions);

const diffHtml = html(diffOutput, {
  drawFileList: true,
  matching: 'lines',
  outputFormat: 'side-by-side',
});
document.getElementById('root').innerHTML = diffHtml;
