#!/usr/bin/env node

const cp = require('child_process');
const path = require('path');

const cjsResolveHooksPath = path.join(__dirname, 'cjs-resolve-hooks');
const [scriptToRun, ...scriptArgs] = process.argv.slice(2);

cp.spawn(scriptToRun, scriptArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Add the -r option to the child process's NODE_OPTIONS
    // environment variable.
    // Reference: https://nodejs.org/api/cli.html#-r---require-module
    NODE_OPTIONS: `-r ${cjsResolveHooksPath} --no-warnings`,
  },
});
