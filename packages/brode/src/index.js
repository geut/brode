import assert from 'node:assert'

import esbuild from 'esbuild'
import { readPackageUpAsync } from 'read-pkg-up'

import brolyfill from '@geut/esbuild-plugin-brolyfill'
import server from '@geut/esbuild-plugin-server'
import { Brout } from '@geut/brout'

const defaultParser = ({ log }) => opts => log(opts)

export class Brode {
  constructor (filepath, opts = {}) {
    assert(filepath)

    const { target, parser = defaultParser, devtools, retries, timeout } = opts

    this._broutOptions = {
      target,
      parser,
      retries,
      timeout,
      playwrightOptions: {
        devtools,
        args: ['--autoplay-policy=no-user-gesture-required']
      }
    }

    this._filepath = filepath
  }

  async run () {
    const { packageJson } = (await readPackageUpAsync() || {})

    let format = 'cjs'
    if ((packageJson && packageJson.type === 'module' && !this._filepath.endsWith('.cjs')) || this._filepath.endsWith('.mjs')) {
      format = 'esm'
    }

    let serverInstance
    await esbuild.build({
      entryPoints: [this._filepath],
      write: false,
      platform: 'browser',
      target: ['es2020'],
      bundle: true,
      format,
      sourcemap: true,
      plugins: [
        server({
          log: false,
          onStart (server) {
            serverInstance = server
          }
        }),
        brolyfill()
      ]
    })

    const url = serverInstance.url

    const brout = new Brout({
      url,
      ...this._broutOptions
    })

    let exitCode = 0
    try {
      exitCode = await brout.run()
    } finally {
      await serverInstance.close()
    }
    return exitCode
  }
}
