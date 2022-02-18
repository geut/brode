import { createRequire } from 'module'

import alias from './alias.js'
import dirname from './dirname.js'

const noop = () => true

const require = createRequire(import.meta.url)

const CORE_MODULES = ['assert', 'buffer', 'crypto', 'console', 'constants', 'events', 'fs', 'module', 'path', 'os', 'url', 'util', 'process', 'timers', 'tty', 'stream', 'zlib']

const STUB = require.resolve('./stub.js')

const getModule = (mod, pathname, filter) => {
  const result = filter(mod)
  if (result === false) return
  if (result === 'stub') return STUB
  if (typeof result === 'string') return result
  return pathname
}

function buildOptions ({ injectGlobal = {}, environmentsFilter, modulesFilter }) {
  const { process: injectProcess = true, buffer: injectBuffer = true, timers: injectTimers = false } = injectGlobal

  const define = {}
  for (const env of Object.keys(process.env)) {
    const key = `process.env.${env}`
    const result = environmentsFilter(env)
    if (result === false) continue
    define[key] = typeof result === 'string' ? result : JSON.stringify(process.env[env])
  }

  define['process.argv'] = JSON.stringify(process.argv)
  define.global = 'globalThis'

  const inject = [require.resolve('./global')]

  if (injectProcess) {
    define.process = '$process'
  }

  if (injectBuffer) {
    define.Buffer = '$Buffer'
  }

  if (injectTimers) {
    define.setTimeout = '$setTimeout'
    define.setInterval = '$setInterval'
    define.clearTimeout = '$clearTimeout'
    define.clearInterval = '$clearInterval'
    define.setImmediate = '$setImmediate'
    define.clearImmediate = '$clearImmediate'
  }

  const modules = {}
  for (const mod of CORE_MODULES) {
    const pathModule = getModule(mod, require.resolve(`@geut/browser-node-core/${mod}`), modulesFilter)
    if (!pathModule) continue
    modules[mod] = pathModule
    modules[`node:${mod}`] = pathModule
  }

  return {
    define,
    inject,
    modules
  }
}

export default function brolyfill (opts = {}) {
  const {
    injectGlobal = {},
    environmentsFilter = noop,
    modulesFilter = noop,
    dirnameFilter = noop
  } = opts

  return {
    name: 'brolyfill',
    setup (build) {
      const options = build.initialOptions
      const { define: defaultDefine = {}, inject: defaultInject = [] } = options
      const { define, inject, modules } = buildOptions({ injectGlobal, environmentsFilter, modulesFilter })
      options.define = { ...define, ...defaultDefine }
      options.inject = [...inject, ...defaultInject]
      alias(build, modules)
      dirname(build, dirnameFilter)
    }
  }
}
