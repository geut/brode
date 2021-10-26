// based on: https://github.com/browserify/timers-browserify and https://github.com/YuzuJS/setImmediate
import getScope from './scope.js'

const scope = getScope()

let nextHandle = 1 // Spec says greater than zero
const tasksByHandle = {}
let currentlyRunningATask = false
const registerImmediate = (handle) => {
  scope.queueMicrotask(() => {
    runIfPresent(handle)
  })
}

function nSetImmediate (callback) {
  if (scope.__EXIT_CODE__ !== undefined) return

  // Callback can either be a function or a string
  if (typeof callback !== 'function') {
      callback = new Function('' + callback) // eslint-disable-line
  }
  // Copy function arguments
  const args = new Array(arguments.length - 1)
  for (let i = 0; i < args.length; i++) {
    args[i] = arguments[i + 1]
  }
  // Store and register the task
  const task = { callback: callback, args: args }
  tasksByHandle[nextHandle] = task
  registerImmediate(nextHandle)
  return nextHandle++
}

function nClearImmediate (handle) {
  delete tasksByHandle[handle]
}

function run (task) {
  const callback = task.callback
  const args = task.args
  switch (args.length) {
    case 0:
      callback()
      break
    case 1:
      callback(args[0])
      break
    case 2:
      callback(args[0], args[1])
      break
    case 3:
      callback(args[0], args[1], args[2])
      break
    default:
      callback.apply(undefined, args)
      break
  }
}

function runIfPresent (handle) {
  // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
  // So if we're currently running a task, we'll need to delay this invocation.
  if (currentlyRunningATask) {
    // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
    // "too much recursion" error.
    setTimeout(runIfPresent, 0, handle)
  } else {
    const task = tasksByHandle[handle]
    if (task) {
      currentlyRunningATask = true
      try {
        run(task)
      } finally {
        clearImmediate(handle)
        currentlyRunningATask = false
      }
    }
  }
}

const clear = (timeout) => {
  if (timeout) {
    timeout.close()
  }
}

class Timeout {
  constructor (id, clearFn) {
    this._id = id
    this._clearFn = clearFn
  }

  unref () {}

  ref () {}

  close () {
    this._clearFn.call(scope, this._id)
  }
}

function nSetTimeout (...args) {
  if (scope.__EXIT_CODE__ !== undefined) return

  return new Timeout(scope.setTimeout(...args), scope.clearTimeout, scope)
}

function nSetInterval (...args) {
  if (scope.__EXIT_CODE__ !== undefined) return

  return new Timeout(scope.setInterval(...args), scope.setInterval, scope)
}

export const setTimeout = nSetTimeout
export const setInterval = nSetInterval
export const clearTimeout = clear
export const clearInterval = clear
export const setImmediate = nSetImmediate
export const clearImmediate = nClearImmediate

export default {
  setTimeout: nSetTimeout,
  setInterval: nSetInterval,
  clearTimeout: clear,
  clearInterval: clear,
  setImmediate: nSetImmediate,
  clearImmediate: nClearImmediate
}
