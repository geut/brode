import { EventEmitter } from './events.js'
import getScope from './scope.js'

const scope = getScope()

const perf = performance || {}
const performanceNow =
  performance.now ||
  performance.mozNow ||
  performance.msNow ||
  performance.oNow ||
  performance.webkitNow ||
  function () { return (new Date()).getTime() }

function hrtime (previousTimestamp) {
  const clocktime = performanceNow.call(perf) * 1e-3
  let seconds = Math.floor(clocktime)
  let nanoseconds = Math.floor((clocktime % 1) * 1e9)
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0]
    nanoseconds = nanoseconds - previousTimestamp[1]
    if (nanoseconds < 0) {
      seconds--
      nanoseconds += 1e9
    }
  }
  return [seconds, nanoseconds]
}

const BROUT_ENABLED = typeof scope.$brout !== 'undefined'

class Process extends EventEmitter {
  constructor () {
    super()

    this.title = 'browser'
    this.browser = true
    this.env = {}
    this.argv = []
    this.version = ''
    this.versions = BROUT_ENABLED
      ? scope.$brout.process.versions
      : {
          http_parser: '0.0',
          node: '0.0',
          v8: '0.0',
          uv: '0.0',
          zlib: '0.0',
          ares: '0.0',
          icu: '0.0',
          modules: '0',
          openssl: '0.0'
        }
    this.hrtime = hrtime
    this.pid = 0
    this.exitCode = null
    this.connected = true
    this._startTime = Date.now()
    this._errorCallback = null
    this._cwd = BROUT_ENABLED ? scope.$brout.process.cwd : '/'

    this._initEvents()
  }

  get stdout () {
    if (this._stdout) return this._stdout
    const tty = require('./tty')
    this._stdout = new tty.WritableStream()
    return this._stdout
  }

  get stderr () {
    if (this._stderr) return this._stderr
    const tty = require('./tty')
    this._stderr = new tty.WritableStream()
    this._stderr._setStderr()
    return this._stderr
  }

  get stdin () {
    if (this._stdin) return this._stdin
    const tty = require('./tty')
    this._stdin = new tty.ReadableStream()
    return this._stdin
  }

  listenerCount (eventName) {
    return this.listeners(eventName).length
  }

  exit (code) {
    this.exitCode = code
    scope.__EXIT_CODE__ = code
    this.emit('exit', [code])
    if (BROUT_ENABLED) {
      scope.$brout.process.exit(code)
      return
    }
    if (code === 1) {
      throw new Error('process.exit(1) called.')
    }
  }

  setUncaughtExceptionCaptureCallback (cb) {
    this._errorCallback = cb
  }

  hasUncaughtExceptionCaptureCallback () {
    return this._errorCallback !== null
  }

  cwd () {
    return this._cwd
  }

  uptime () {
    return Math.floor((Date.now() - this._startTime) / 1000)
  }

  memoryUsage () {
    if (!performance && !performance.memory) {
      return {
        rss: 0,
        heapTotal: Number.MAX_SAFE_INTEGER,
        heapUsed: 0,
        external: 0
      }
    }

    const { memory } = performance

    return {
      rss: 0,
      heapTotal: memory.totalJSHeapSize,
      heapUsed: memory.usedJSHeapSize,
      external: 0
    }
  }

  nextTick (handler, ...args) {
    if (this.exitCode !== null) return

    if (typeof handler !== 'function') {
      throw new TypeError('handler is not a function')
    }

    queueMicrotask(() => {
      try {
        handler(...args)
      } catch (err) {
        if (this.hasListeners('uncaughtException')) {
          this.emit('uncaughtException', err)
          return
        }

        throw err
      }
    })
  }

  _getActiveHandles () {
    return []
  }

  _getActiveRequests () {
    return []
  }

  _initEvents () {
    if (!scope.addEventListener) {
      return
    }

    scope.addEventListener('error', err => {
      if (this._errorCallback) {
        err.preventDefault()
        this._errorCallback(err)
        return
      }

      if (this.hasListeners('uncaughtException')) {
        err.preventDefault()
        this.emit('uncaughtException', err)
        return
      }

      process.nextTick(() => process.exit(1))
    })

    scope.addEventListener('rejectionhandled', ev => this.emit('rejectionHandled', ev.reason, ev.promise))

    scope.addEventListener('unhandledrejection', ev => {
      if (this.hasListeners('unhandledRejection')) {
        ev.preventDefault()
        this.emit('unhandledRejection', ev.reason, ev.promise)
        return
      }

      console.warn('UnhandledPromiseRejectionWarning:', ev.reason)
    })
  }
}

const p = new Process()
export default p
