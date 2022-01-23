import assert from 'assert'
// import util from 'util'

import esbuild from 'esbuild'
import { readPackageUpAsync } from 'read-pkg-up'
// import pem from 'pem'

import brode from '@geut/esbuild-plugin-brode'
import server from '@geut/esbuild-plugin-server'
import { Brout } from '@geut/brout'

const defaultParser = ({ log }) => opts => log(opts)

// const createCertificate = util.promisify(pem.createCertificate)

export class Brode {
  constructor (filepath, opts = {}) {
    assert(filepath)

    const { target, parser = defaultParser, devtools, retries, timeout, cwd = process.cwd(), args = '' } = opts

    this._filepath = filepath

    this._broutOptions = {
      target,
      parser,
      retries,
      timeout,
      playwrightOptions: {
        devtools,
        args: ['--autoplay-policy=no-user-gesture-required', '--ignore-https-errors', '--ignore-certificate-errors', ...args.split(',')]
      }
    }

    this._cwd = cwd
  }

  async run () {
    const { packageJson } = (await readPackageUpAsync() || {})

    let format = 'cjs'
    if ((packageJson && packageJson.type === 'module' && !this._filepath.endsWith('.cjs')) || this._filepath.endsWith('.mjs')) {
      format = 'esm'
    }

    // const keys = await createCertificate({ days: 1, selfSigned: true })

    let serverInstance
    await esbuild.build({
      entryPoints: [this._filepath],
      absWorkingDir: this._cwd,
      outbase: './',
      write: false,
      platform: 'browser',
      target: ['es2020'],
      treeShaking: true,
      bundle: true,
      format,
      sourcemap: true,
      plugins: [
        server({
          logger: false,
          onSetup (server) {
            serverInstance = server
          }
          // https: {
          //   cert: keys.certificate,
          //   key: keys.serviceKey
          // }
        }),
        brode({
          dirnameFilter: () => true
        })
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
