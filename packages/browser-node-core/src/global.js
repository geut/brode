
const timers = require('./timers.js')
const { Buffer } = require('./buffer.js')
const process = require('./process.js')
const getScope = require('./scope.js')

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

module.exports = new Proxy(getScope(), {
  get (target, name) {
    if (globalObj[name]) return globalObj[name]
    return target[name]
  }
})
