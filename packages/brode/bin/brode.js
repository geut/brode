#!/usr/bin/env node

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import sade from 'sade'

import { Brode } from '../src/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))

process.on('unhandledRejection', function (err) {
  console.error(err.message)
})

sade('brode <filepath>', true)
  .version(packageJSON.version)
  .describe('Run brode')
  .example('script.js')
  .option('-t, --target', 'Browser target', 'chromium')
  .option('-p, --parser', 'Log parser')
  .option('-d, --devtools', 'Enable devtool', false)
  .option('-r, --retries', 'Retries', 5)
  .option('-T, --timeout', 'Timeout', 0)
  .action(async (filepath, opts = {}) => {
    const brode = new Brode(filepath, opts)

    const code = await brode.run()
    process.exit(code)
  })
  .parse(process.argv)
