#!/usr/bin/env node

const cp = require('child_process');
const path = require('path');

const cjsResolveHooksPath = path.join(__dirname, 'cjs-resolve-hooks');
const [scriptToRun, ...scriptArgs] = process.argv.slice(2);

cp.spawn(scriptToRun, scriptArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Enable Rspack loose validation mode will print out erroneous configurations but will not throw error
    RSPACK_CONFIG_VALIDATE: 'loose',
    // Add the -r option to the child process's NODE_OPTIONS
    // environment variable.
    // Reference: https://nodejs.org/api/cli.html#-r---require-module
    NODE_OPTIONS: `-r ${cjsResolveHooksPath} --no-warnings`,
  },
});
