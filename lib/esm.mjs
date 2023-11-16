import { parse as parseUrl, fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import { dirname, resolve as pathResolve } from 'path';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(fileURLToPath(import.meta.url));

require('./cjs');
const nodeInternalDefaultResolve = require('../dist-raw/node-internal-modules-esm-resolve').defaultResolve;
const nodeInternalDefaultGetFormat = require('../dist-raw/node-internal-modules-esm-get_format').defaultGetFormat;

function isFileUrlOrNodeStyleSpecifier(parsed) {
  // We only understand file:// URLs, but in node, the specifier can be a node-style `./foo` or `foo`
  const { protocol } = parsed;
  return protocol === null || protocol === 'file:';
}

const runMainHackUrl = pathToFileURL(pathResolve(__dirname, '../dist-raw/runmain-hack.js')).toString();

/**
 * Named "probably" as a reminder that this is a guess.
 * node does not explicitly tell us if we're resolving the entrypoint or not.
 */
function isProbablyEntrypoint(specifier, parentURL) {
  return (parentURL === undefined || parentURL === runMainHackUrl) && specifier.startsWith('file://');
}

// Side-channel between `resolve()` and `load()` hooks
const rememberIsProbablyEntrypoint = new Set();
const rememberResolvedViaCommonjsFallback = new Set();

export async function resolve(specifier, context, defaultResolve) {
  const defer = async () => {
    const r = await defaultResolve(specifier, context, defaultResolve);
    return r;
  };

  // See: https://github.com/nodejs/node/discussions/41711
  // nodejs will likely implement a similar fallback.  Till then, we can do our users a favor and fallback today.
  async function entrypointFallback(cb) {
    try {
      const resolution = await cb();
      if (resolution?.url && isProbablyEntrypoint(specifier, context.parentURL))
        rememberIsProbablyEntrypoint.add(resolution.url);
      return resolution;
    } catch (esmResolverError) {
      if (!isProbablyEntrypoint(specifier, context.parentURL)) throw esmResolverError;
      try {
        let cjsSpecifier = specifier;
        // Attempt to convert from ESM file:// to CommonJS path
        try {
          if (specifier.startsWith('file://')) cjsSpecifier = fileURLToPath(specifier);
        } catch { }
        const resolution = pathToFileURL(createRequire(process.cwd()).resolve(cjsSpecifier)).toString();
        rememberIsProbablyEntrypoint.add(resolution);
        rememberResolvedViaCommonjsFallback.add(resolution);
        return { url: resolution, format: 'commonjs' };
      } catch (commonjsResolverError) {
        throw esmResolverError;
      }
    }
  }

  return addShortCircuitFlag(async () => {
    const parsed = parseUrl(specifier);
    const { protocol, hostname } = parsed;

    if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
      return entrypointFallback(defer);
    }

    if (protocol !== null && protocol !== 'file:') {
      return entrypointFallback(defer);
    }

    // Malformed file:// URL?  We should always see `null` or `''`
    if (hostname) {
      // TODO file://./foo sets `hostname` to `'.'`.  Perhaps we should special-case this.
      return entrypointFallback(defer);
    }

    // pathname is the path to be resolved

    return entrypointFallback(() => nodeInternalDefaultResolve(specifier, context, defaultResolve));
  });
}

async function addShortCircuitFlag(fn) {
  const ret = await fn();
  // Not sure if this is necessary; being lazy.  Can revisit in the future.
  if (ret == null) return ret;
  return {
    ...ret,
    shortCircuit: true,
  };
}

export async function getFormat(url, context, defaultGetFormat) {
  const defer = (overrideUrl = url) => defaultGetFormat(overrideUrl, context, defaultGetFormat);

  // See: https://github.com/nodejs/node/discussions/41711
  // nodejs will likely implement a similar fallback.  Till then, we can do our users a favor and fallback today.
  async function entrypointFallback(cb) {
    try {
      return await cb();
    } catch (getFormatError) {
      if (!rememberIsProbablyEntrypoint.has(url)) throw getFormatError;
      return { format: 'commonjs' };
    }
  }

  const parsed = parseUrl(url);

  if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
    return entrypointFallback(defer);
  }

  const { pathname } = parsed;
  assert(pathname !== null, 'ESM getFormat() hook: URL should never have null pathname');

  const nodeSays = await entrypointFallback(defer);
  return nodeSays;
}

// `load` from new loader hook API (See description at the top of this file)
export async function load(url, context, defaultLoad) {
  return addShortCircuitFlag(async () => {
    // If we get a format hint from resolve() on the context then use it
    // otherwise call the old getFormat() hook using node's old built-in defaultGetFormat() that ships with ts-node
    const format =
      context.format ?? (await getFormat(url, context, nodeInternalDefaultGetFormat)).format;

    let source = undefined;
    if (format !== 'builtin' && format !== 'commonjs') {
      // Call the new defaultLoad() to get the source
      const { source: rawSource } = await defaultLoad(
        url,
        {
          ...context,
          format,
        },
        defaultLoad
      );

      if (rawSource === undefined || rawSource === null) {
        throw new Error(`Failed to load raw source: Format was '${format}' and url was '${url}''.`);
      }

      // Emulate node's built-in old defaultTransformSource() so we can re-use the old transformSource() hook
      const defaultTransformSource = async (source, _context, _defaultTransformSource) => ({
        source,
      });

      // Call the old hook
      const { source: transformedSource } = await transformSource(rawSource, { url, format }, defaultTransformSource);
      source = transformedSource;
    }

    return { format, source };
  });
}
