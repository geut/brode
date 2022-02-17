import path from 'path'
import { install } from 'esinstall'
import esbuild from 'esbuild'
import trim from 'lodash.trim'
import del from 'del'
import cpy from 'cpy'

import MODULES from './src/supported-modules.js'

const browserifyModules = [
  'assert-browserify',
  'buffer-browserify',
  'cpus',
  'crypto-browserify',
  'eventemitter2',
  'fflate',
  'native-url',
  'path-browserify',
  'vite-compatible-readable-stream',
  'util-browserify',
  'querystring-browserify',
  'browser-hrtime'
]

function alias () {
  return {
    name: 'alias',
    setup (build) {
      build.onResolve({ filter: /.*/, namespace: 'file' }, args => {
        const pathname = trim(args.path, '/')

        if (pathname.startsWith('./common')) {
          return {
            path: args.path,
            external: true
          }
        }

        if (MODULES.includes(pathname)) {
          console.log(pathname, path.resolve(path.join('src', `${pathname}.js`)))
          return {
            path: `../${pathname}.js`,
            external: true
          }
        }
      })
    }
  }
}

;(async () => {
  const webModulesPath = path.resolve(path.join('src', 'web_modules'))

  await install(browserifyModules, {
    dest: webModulesPath,
    external: [...MODULES]
  })

  await esbuild.build({
    entryPoints: browserifyModules.map(mod => path.join(webModulesPath, `${mod}.js`)),
    outdir: 'src/esm',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    plugins: [alias()],
    define: {
      global: 'globalThis'
    }
  }).catch(() => process.exit(1))

  await cpy(path.join(webModulesPath, 'common'), 'src/esm/common')

  await del(webModulesPath)
})()
