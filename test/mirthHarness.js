/**
 * Test harness for loading Mirth Connect / Rhino "code template" sources into a
 * Node `vm` sandbox with mocked Mirth globals.
 *
 * The templates are bare global declarations (e.g. `function tryCatch(){}`,
 * `var stringUtils = {}`). They run on the JVM under Rhino with Java interop
 * (`Packages.*`, `java.*`, E4X `XML`) and Mirth globals (`$c`, `$gc`, `logger`, ...)
 * that do not exist in Node. We never modify the sources; instead we load the
 * source text into a `vm` context whose globals are the mocked Mirth API, then
 * read the top-level `function`/`var` declarations back off the sandbox object.
 *
 * Why this captures bare globals: in `vm.runInContext`, top-level `function foo(){}`
 * and `var bar = {}` declarations become own properties of the context object
 * (the sandbox). So after running the source, `sandbox.tryCatch` / `sandbox.stringUtils`
 * are the declared globals. Files that set `module.exports` are read via
 * `sandbox.module.exports`.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_ROOT = join(__dirname, '..', 'src', 'codeTempaltes')

/**
 * Build a Map-backed Mirth channel/global map accessor.
 * `fn(key)` -> get; `fn(key, value)` -> put and return value.
 * Uses `arguments.length` to distinguish get vs. put, so it MUST be a regular
 * function (not an arrow).
 * @param {Map} map backing store
 * @returns {function}
 */
function makeMapAccessor(map) {
  return function (key, value) {
    if (arguments.length >= 2) {
      map.set(key, value)
      return value
    }
    return map.get(key)
  }
}

/**
 * Create the default set of mocked Mirth globals.
 * @param {object} [overrides={}] - injected/overriding globals (java, Packages, XML, msg,
 *   destinationSet, config, ...). Spread last so callers can override defaults.
 * @returns {object} a flat object of globals to spread into a sandbox.
 */
export function createMirthEnv(overrides = {}) {
  const maps = {
    $c: new Map(),
    $co: new Map(),
    $s: new Map(),
    $gc: new Map(),
    $g: new Map(),
    $r: new Map(),
  }

  const config = overrides.config instanceof Map
    ? overrides.config
    : new Map(Object.entries(overrides.config || {}))

  const loggerCalls = []
  const logFn = (level) => (...args) => { loggerCalls.push({ level, args }) }
  const logger = {
    info: logFn('info'),
    warn: logFn('warn'),
    error: logFn('error'),
    debug: logFn('debug'),
    trace: logFn('trace'),
    __calls: loggerCalls,
  }

  // `config` was a harness-only hint; don't leak it as a sandbox global.
  const { config: _ignoredConfig, ...rest } = overrides

  return {
    $c: makeMapAccessor(maps.$c),
    $co: makeMapAccessor(maps.$co),
    $s: makeMapAccessor(maps.$s),
    $gc: makeMapAccessor(maps.$gc),
    $g: makeMapAccessor(maps.$g),
    $r: makeMapAccessor(maps.$r),
    $cfg: function (key) {
      return config.get(key)
    },
    logger,
    __maps: maps,
    __config: config,
    ...rest,
  }
}

/**
 * Build a sandbox object that has the Mirth env plus a CommonJS-style module/exports.
 * @param {object} env
 * @returns {object} sandbox
 */
function buildSandbox(env) {
  const sandbox = {
    module: { exports: {} },
    console,
    ...createMirthEnv(env),
  }
  // Link `exports` to `module.exports` the way CommonJS does.
  sandbox.exports = sandbox.module.exports
  sandbox.globalThis = sandbox
  return sandbox
}

/**
 * Load a single template source into a fresh vm context and return the sandbox.
 * Read declared globals off the returned sandbox (e.g. `sandbox.tryCatch`,
 * `sandbox.stringUtils`) or `sandbox.module.exports`.
 * @param {string} relPath - path relative to src/codeTempaltes (e.g. 'Globals/tryCatch.js')
 * @param {object} [env={}] - overrides passed to createMirthEnv
 * @returns {object} the sandbox/context object
 */
export function loadTemplate(relPath, env = {}) {
  return loadTemplates([relPath], env)
}

/**
 * Load several template sources into ONE shared vm context, in order. Needed for
 * files that reference globals declared by an earlier file (e.g. HL7Message.es5.js
 * references the `Encoding` global from Encoding.es5.js).
 *
 * The `if (typeof require !== 'undefined')` guards in those files are correctly
 * skipped here because `require` is undefined in the sandbox.
 * @param {string[]} relPaths
 * @param {object} [env={}]
 * @returns {object} the shared sandbox/context object
 */
export function loadTemplates(relPaths, env = {}) {
  const sandbox = buildSandbox(env)
  vm.createContext(sandbox)
  for (const relPath of relPaths) {
    const code = readFileSync(join(TEMPLATES_ROOT, relPath), 'utf8')
    vm.runInContext(code, sandbox, { filename: relPath })
    // Re-link in case a file reassigned module.exports.
    sandbox.exports = sandbox.module.exports
  }
  return sandbox
}
