import path from 'path'
import { install } from 'esinstall'
import esbuild from 'esbuild'
import trim from 'lodash.trim'
import del from 'del'
import cpy from 'cpy'

import MODULES from './src/supported-modules.js'

const SRC_PATH = path.resolve('./src')

const browserifyModules = [
  {
    name: 'buffer-browserify'
  },
  {
    name: 'cpus'
  },
  {
    name: 'crypto-browserify'
  },
  {
    name: 'eventemitter2',
    onResolve: (_, pathname) => {
      if (pathname === 'process') {
        return {
          path: pathname,
          namespace: 'eventemitter2'
        }
      }
    },
    onLoad: (args) => {
      if (args.path === 'process') {
        return {
          resolveDir: SRC_PATH,
          contents: `
            import getScope from './scope.js'

            const scope = getScope()

            const proc = scope[Symbol.for('brodeProcess')]

            export default {
              nextTick (handler, ...args) {
                if (proc && proc.exitCode !== null) return

                if (typeof handler !== 'function') {
                  throw new TypeError('handler is not a function')
                }

                queueMicrotask(() => {
                  try {
                    handler(...args)
                  } catch (err) {
                    if (proc && proc.hasListeners('uncaughtException')) {
                      proc.emit('uncaughtException', err)
                      return
                    }

                    throw err
                  }
                })
              },

              emitWarning(msg) {
                console.log(msg)
              }
            }
          `
        }
      }
    }
  },
  {
    name: 'fflate'
  },
  {
    name: 'native-url'
  },
  {
    name: 'path-browserify'
  },
  {
    name: 'vite-compatible-readable-stream'
  },
  {
    name: 'util-browserify'
  },
  {
    name: 'querystring-browserify'
  }
]

function alias (m) {
  return {
    name: 'alias',
    setup (build) {
      build.onResolve({ filter: /.*/, namespace: 'file' }, async args => {
        const pathname = trim(args.path, '/')

        if (pathname.startsWith('./common')) {
          return {
            path: args.path,
            external: true
          }
        }

        if (m.onResolve) {
          const result = await m.onResolve(args, pathname)
          if (result) return result
        }

        if (MODULES.includes(pathname)) {
          console.log(pathname, path.join(SRC_PATH, `${pathname}.js`))
          return {
            path: `../${pathname}.js`,
            external: true
          }
        }
      })

      if (m.onLoad) {
        build.onLoad({ filter: /.*/, namespace: m.name }, m.onLoad)
      }
    }
  }
}

;(async () => {
  const webModulesPath = path.join(SRC_PATH, 'web_modules')

  await del(path.join(SRC_PATH, 'esm'))

  await install(browserifyModules.map(m => m.name), {
    dest: webModulesPath,
    external: [...MODULES]
  })

  console.log('ESBUILD: start')

  await Promise.all(browserifyModules.map(async m => {
    await esbuild.build({
      entryPoints: [path.join(webModulesPath, `${m.name}.js`)],
      outdir: path.join(SRC_PATH, 'esm'),
      bundle: true,
      format: 'esm',
      platform: 'browser',
      plugins: [alias(m)],
      define: m.define || {
        global: 'globalThis'
      }
    })
  }))

  console.log('ESBUILD: done')

  await cpy(path.join(webModulesPath, 'common'), 'src/esm/common')

  await del(webModulesPath)
})()
