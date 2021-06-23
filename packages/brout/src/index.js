/* global __coverage__ */

import assert from 'assert'
import path from 'path'
import { promises as fs } from 'fs'
import playwright from 'playwright'
import trim from 'lodash.trim'
import execa from 'execa'
import retry from 'p-retry'
import debounce from 'lodash.debounce'
import tempy from 'tempy'

import { actions, actionsContentScript, STDOUT_SYMBOL } from './actions.js'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const PARSERS = {
  uvu: '../src/parsers/uvu.js',
  tap: '../src/parsers/tap.js'
}

class Runner {
  constructor (fastClose = false) {
    this._closed = false
    this._exitError = null

    if (!fastClose) {
      this._done = debounce(this._done.bind(this), 1000)
    }

    this._promise = {}

    this._promise.wait = new Promise((resolve, reject) => {
      this._promise.resolve = resolve
      this._promise.reject = reject
    })
  }

  get closed () {
    return this._closed
  }

  done (err) {
    if (this._closed) return
    if (err && !this._exitError) {
      if (err === 1) {
        err = new Error('runner error')
        err.hidden = true
      }
      if (typeof err === 'string') {
        err = new Error(err)
      }
      this._exitError = err
    }
    this._done()
  }

  wait () {
    return this._promise.wait
  }

  _done () {
    if (this._closed) return
    this._closed = true
    this._exitError ? this._promise.reject(this._exitError) : this._promise.resolve()
  }
}

const defaultLogger = ({ type, args }) => {
  if (!type) {
    console.log(...args)
    return
  }
  if (type === 'stdout' || type === 'stderr') {
    process[type].write(args.join(' '))
    return
  }
  console[type](...args)
}

function defaultParser ({ target, log }) {
  log({ args: [`Target: ${target}\n`] })
  return log
}

export class Brout {
  constructor (opts = {}) {
    const {
      url = 'http://127.0.0.1:8080',
      target = 'chromium',
      command,
      parser = defaultParser,
      fastClose = false,
      retries = 5,
      timeout = 0,
      coverage = false,
      log = defaultLogger,
      playwrightOptions
    } = opts

    assert(url, 'url is required')
    assert(target, 'target is required')

    this._url = url
    this._target = target
    this._command = command
    this._parser = parser
    this._fastClose = fastClose
    this._retries = retries
    this._timeout = timeout
    this._coverage = coverage === true ? path.join(process.cwd(), '.nyc_output', 'coverage.json') : coverage
    this._log = log
    this._playwrightOptions = playwrightOptions
    this._releases = []
    this._subprocess = null
    this._running = false
    this._tmpdir = null
  }

  async run () {
    if (this._running) return
    if (typeof this._parser === 'string') {
      this._parser = (await import(PARSERS[this._parser] || this._parser)).default
    }

    const targets = this._target.split(',').map(target => trim(target, ' \n\t'))
    this._before()
    this._running = true

    let exitCode = 0
    try {
      await Promise.race([
        this._timeout > 0 && delay(this._timeout * targets.length),
        this._subprocess,
        this._run(targets)
      ].filter(Boolean))
    } catch (err) {
      if (!err.hidden) {
        throw err
      }
      exitCode = 1
    } finally {
      this._running = false
      await this._after()
    }

    return exitCode
  }

  async _run (targets) {
    for (const target of targets) {
      if (!this._running) return
      await this._runBrowser(target)
    }

    if (this._coverage) {
      await execa.command(`nyc merge ${this._tmpdir} ${this._coverage}`, {
        preferLocal: true
      })
    }
  }

  async _runBrowser (target) {
    const browser = await playwright[target].launch(this._playwrightOptions)
    this._releases.push(() => browser.close())

    const runner = new Runner(this._fastClose)

    const parse = this._parser({
      target,
      exit: signal => runner.done(signal),
      log: this._log
    })

    const context = await browser.newContext()
    const page = await context.newPage()
    this._releases.push(() => page.close())

    await this._bindFunctions(runner, page, parse)

    page.on('console', async msg => {
      let args = await Promise.all(msg.args().map(arg => arg.jsonValue()))
      if (runner.closed) return
      let type = msg.type()
      if (msg.text().endsWith(STDOUT_SYMBOL)) {
        type = type === 'error' ? 'stderr' : 'stdout'
        args = args.slice(0, args.length - 1)
      }
      if (type === 'warning') {
        type = 'warn'
      }
      parse({ type, args })
    })

    page.on('pageerror', (err) => runner.done(err))

    retry(async () => {
      await delay(1000)
      return page.goto(this._url, { timeout: this._timeout })
    }, {
      retries: this._retries,
      onFailedAttempt: error => {
        if (error.retriesLeft === 0) throw error
      }
    }).catch(err => runner.done(err))

    try {
      await runner.wait()
      if (!this._coverage) return
      await this._runCoverage(target, page)
    } finally {
      await page.close()
      await browser.close()
    }
  }

  _before () {
    if (this._command) {
      this._subprocess = execa.command(this._command, {
        preferLocal: true
      })
      this._subprocess.stderr.pipe(process.stderr)

      this._releases.push(() => this._subprocess.cancel())
    }
  }

  _after () {
    return Promise.all(this._releases.map(release => release()))
  }

  async _runCoverage (target, page) {
    if (!this._tmpdir) {
      this._tmpdir = tempy.directory()
      if (!this._tmpdir) throw new Error('create tmpdir failed')
      await fs.mkdir(this._tmpdir, { recursive: true })
    }

    const result = await page.evaluate(() => JSON.stringify(typeof __coverage__ !== 'undefined' && __coverage__))
    if (!result) return

    await fs.writeFile(path.join(this._tmpdir, `${target}.json`), JSON.stringify(JSON.parse(result), null, 2), 'utf8')
  }

  async _bindFunctions (runner, page) {
    await page.exposeFunction('__BROUT_CALL__', (action, args) => {
      if (!actions[action]) throw new Error('missing action')
      return actions[action](args, runner)
    })

    await page.addInitScript({
      content: actionsContentScript
    })
  }
}
