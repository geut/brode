#!/usr/bin/env node
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import sade from 'sade'

import { Brout } from '../src/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))

process.on('unhandledRejection', function (err) {
  console.error(err.message)
})

const readLocalPackageJSON = async () => {
  try {
    return JSON.parse(await fs.promises.readFile(path.resolve(process.cwd(), 'package.json'), 'utf-8'))
  } catch (err) {
    return null
  }
}

sade('brout <url>', true)
  .version(packageJSON.version)
  .describe('Run brout')
  .example("http://127.0.0.1:8080 -c 'webpack serve' --target chromium,firefox")
  .example("-c 'webpack serve' --parser 'uvu'")
  .example("-c 'webpack serve' --parser 'tap'")
  .example("-c 'webpack serve' --parser 'tap' --coverage")
  .example("-c 'webpack serve' --parser 'tap' --devtools --args='arg0=value,arg1=value'")
  .option('-u, --url', 'URL to bind', 'http://127.0.0.1:8080')
  .option('-t, --target', 'Browser target', 'chromium')
  .option('-c, --command', 'Execute a command before start')
  .option('-p, --parser', 'Log parser')
  .option('-r, --retries', 'Retries', 5)
  .option('-T, --timeout', 'Timeout', 0)
  .option('-C, --coverage', 'Add support for istanbul coverage', false)
  .option('--fastClose', 'Fast close')
  .option('--devtools', 'Enable playwright devtool', false)
  .option('--args', 'Set args for playwright', '')
  .action(async (url, opts = {}) => {
    const packageJSON = await readLocalPackageJSON()

    const { target, command, parser, fastClose, retries, timeout, coverage, devtools = false, args = '' } = opts

    assert(typeof args === 'string')

    const brout = new Brout({
      url,
      target,
      parser,
      fastClose,
      retries,
      timeout,
      coverage,
      command: command && packageJSON && packageJSON.scripts[command] ? `npm run ${command}` : command,
      playwrightOptions: {
        devtools,
        args: args.split(',')
      }
    })

    const code = await brout.run()
    process.exit(code)
  })
  .parse(process.argv)
