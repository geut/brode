
import timers from './timers.js'
import { Buffer } from './buffer.js'
import process from './process.js'
import getScope from './scope.js'

const globalObj = {
  Buffer,
  process,
  setTimeout: timers.setTimeout,
  setInterval: timers.setInterval,
  clearTimeout: timers.clearTimeout,
  clearInterval: timers.clearInterval,
  setImmediate: timers.setImmediate,
  clearImmediate: timers.clearImmediate
}

export default new Proxy(getScope(), {
  get (target, name) {
    if (globalObj[name]) return globalObj[name]
    return target[name]
  }
})
