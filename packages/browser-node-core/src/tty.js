
/**
 * based on: https://github.com/jvilk/bfs-process/blob/master/ts/tty.ts
 */

const { Writable, Readable } = require('stream')

const getGlobal = function () {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  throw new Error('unable to locate global object')
}

const scope = getGlobal()

const BROUT_ENABLED = typeof scope.$brout !== 'undefined'

class ReadableStream extends Readable {
  constructor () {
    super()

    this.isRaw = false
  }

  get isTTY () {
    return true
  }

  setRawMode (mode) {
    if (this.isRaw !== mode) {
      this.isRaw = mode
      this.emit('modeChange')
    }
  }

  _readFromBrout () {
    scope.$brout.process.stdin()
      .then(data => {
        if (data) {
          this.push(Buffer.from(data, 'base64'))
        } else {
          this.push(null)
        }
      })
      .catch(() => this.push(null))
  }

  _read () {
    if (BROUT_ENABLED) {
      this._readFromBrout()
    } else {
      this.push(null)
    }
  }
}

class WritableStream extends Writable {
  constructor () {
    super()

    this.isRaw = false
    this.columns = 80
    this.rows = 120
    if (BROUT_ENABLED) {
      this._log = scope.$brout.process.stdout
    } else {
      this._log = console.log
    }
  }

  get isTTY () {
    return true
  }

  setRawMode (mode) {
    if (this.isRaw !== mode) {
      this.isRaw = mode
      this.emit('modeChange')
    }
  }

  changeColumns (columns) {
    if (columns !== this.columns) {
      this.columns = columns
      this.emit('resize')
    }
  }

  changeRows (rows) {
    if (rows !== this.rows) {
      this.rows = rows
      this.emit('resize')
    }
  }

  _setStderr () {
    if (BROUT_ENABLED) {
      this._log = scope.$brout.process.stderr
    } else {
      this._log = console.error
    }
  }

  _write (chunk, enc, cb) {
    this._log(enc === 'buffer' ? chunk.toString('utf-8') : chunk)
    cb(null)
  }
}

module.exports = {
  isatty (fd) {
    return fd && (fd instanceof ReadableStream || fd instanceof WritableStream)
  },
  WritableStream,
  ReadableStream
}
