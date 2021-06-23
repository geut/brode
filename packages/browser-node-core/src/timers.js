// based on: https://github.com/browserify/timers-browserify and https://github.com/YuzuJS/setImmediate
const getScope = require('./scope.js')

const scope = getScope()

let nextHandle = 1 // Spec says greater than zero
const tasksByHandle = {}
let currentlyRunningATask = false
const doc = scope.document
let registerImmediate

function nSetImmediate (callback) {
  if (process.exitCode !== null) return

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

function installNextTickImplementation () {
  registerImmediate = function (handle) {
    process.nextTick(function () { runIfPresent(handle) })
  }
}

function canUsePostMessage () {
  // The test against `importScripts` prevents this implementation from being installed inside a web worker,
  // where `global.postMessage` means something completely different and can't be used for this purpose.
  if (scope.postMessage && !scope.importScripts) {
    let postMessageIsAsynchronous = true
    const oldOnMessage = scope.onmessage
    scope.onmessage = function () {
      postMessageIsAsynchronous = false
    }
    scope.postMessage('', '*')
    scope.onmessage = oldOnMessage
    return postMessageIsAsynchronous
  }
}

function installPostMessageImplementation () {
  // Installs an event handler on `global` for the `message` event: see
  // * https://developer.mozilla.org/en/DOM/window.postMessage
  // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

  const messagePrefix = 'setImmediate$' + Math.random() + '$'
  const onGlobalMessage = function (event) {
    if (event.source === scope &&
                typeof event.data === 'string' &&
                event.data.indexOf(messagePrefix) === 0) {
      runIfPresent(+event.data.slice(messagePrefix.length))
    }
  }

  if (scope.addEventListener) {
    scope.addEventListener('message', onGlobalMessage, false)
  } else {
    scope.attachEvent('onmessage', onGlobalMessage)
  }

  registerImmediate = function (handle) {
    scope.postMessage(messagePrefix + handle, '*')
  }
}

function installMessageChannelImplementation () {
  const channel = new MessageChannel()
  channel.port1.onmessage = function (event) {
    const handle = event.data
    runIfPresent(handle)
  }

  registerImmediate = function (handle) {
    channel.port2.postMessage(handle)
  }
}

function installReadyStateChangeImplementation () {
  const html = doc.documentElement
  registerImmediate = function (handle) {
    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    let script = doc.createElement('script')
    script.onreadystatechange = function () {
      runIfPresent(handle)
      script.onreadystatechange = null
      html.removeChild(script)
      script = null
    }
    html.appendChild(script)
  }
}

function installSetTimeoutImplementation () {
  registerImmediate = function (handle) {
    setTimeout(runIfPresent, 0, handle)
  }
}

// Don't get fooled by e.g. browserify environments.
if ({}.toString.call(scope.process) === '[object process]') {
  // For Node.js before 0.9
  installNextTickImplementation()
} else if (canUsePostMessage()) {
  // For non-IE10 modern browsers
  installPostMessageImplementation()
} else if (scope.MessageChannel) {
  // For web workers, where supported
  installMessageChannelImplementation()
} else if (doc && 'onreadystatechange' in doc.createElement('script')) {
  // For IE 6–8
  installReadyStateChangeImplementation()
} else {
  // For older browsers
  installSetTimeoutImplementation()
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
  if (process.exitCode !== null) return

  return new Timeout(scope.setTimeout(...args), scope.clearTimeout, scope)
}

function nSetInterval (...args) {
  if (process.exitCode !== null) return

  return new Timeout(scope.setInterval(...args), scope.setInterval, scope)
}

module.exports = {
  setTimeout: nSetTimeout,
  setInterval: nSetInterval,
  clearTimeout: clear,
  clearInterval: clear,
  setImmediate: nSetImmediate,
  clearImmediate: nClearImmediate
}
