import util from './util.js'
import assert from './assert.js'

function now () { return new Date().getTime() }

const slice = Array.prototype.slice
let console
const times = {}

if (typeof global !== 'undefined' && global.console) {
  console = global.console
} else if (typeof window !== 'undefined' && window.console) {
  console = window.console
} else {
  console = {}
}

const functions = [
  [log, 'log'],
  [info, 'info'],
  [warn, 'warn'],
  [error, 'error'],
  [time, 'time'],
  [timeEnd, 'timeEnd'],
  [trace, 'trace'],
  [dir, 'dir'],
  [consoleAssert, 'assert']
]

for (let i = 0; i < functions.length; i++) {
  const tuple = functions[i]
  const f = tuple[0]
  const name = tuple[1]

  if (!console[name]) {
    console[name] = f
  }
}

function log () {}

function info () {
  console.log.apply(console, arguments)
}

function warn () {
  console.log.apply(console, arguments)
}

function error () {
  console.warn.apply(console, arguments)
}

function time (label) {
  times[label] = now()
}

function timeEnd (label) {
  const time = times[label]
  if (!time) {
    throw new Error('No such label: ' + label)
  }

  delete times[label]
  const duration = now() - time
  console.log(label + ': ' + duration + 'ms')
}

function trace () {
  const err = new Error()
  err.name = 'Trace'
  err.message = util.format.apply(null, arguments)
  console.error(err.stack)
}

function dir (object) {
  console.log(util.inspect(object) + '\n')
}

function consoleAssert (expression) {
  if (!expression) {
    const arr = slice.call(arguments, 1)
    assert.ok(false, util.format.apply(null, arr))
  }
}

export default console
