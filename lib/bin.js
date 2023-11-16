#!/usr/bin/env node

const cp = require('child_process');
const path = require('path');

const loaderPath = path.join(__dirname, 'esm.mjs');
const [script, ...args] = process.argv.slice(2);

cp.spawn(script, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Add the --loader option to the child process's NODE_OPTIONS
    // environment variable.
    NODE_OPTIONS: `--no-warnings --experimental-loader ${loaderPath}`,
  },
});
