const getScope = require('./scope.js')

const scope = getScope()

const fs = {}

function toCallback (runPromise) {
  return (...args) => {
    const callback = args.slice(-1)[0]
    const rest = args.slice(0, args.length - 1)
    runPromise(...rest)
      .then(res => callback(null, res))
      .catch(err => callback(err))
  }
}

if (typeof scope.$brout !== 'undefined') {
  fs.promises = {
    readFile: async (filename, enc = 'binary') => {
      let result = await scope.$brout.fs.readFile(filename)
      if (enc === 'base64') return result
      result = Buffer.from(result, 'base64')
      if (enc === 'binary') return result
      return result.toString(enc)
    },
    writeFile: async (filename, content) => {
      let isBuffer = false
      if (Buffer.isBuffer(content)) {
        content = content.toString('base64')
        isBuffer = true
      }
      return scope.$brout.fs.writeFile(filename, content, isBuffer)
    },
    stat: async filename => {
      return scope.$brout.fs.stat(filename)
    },
    readFileSync: () => {},
    writeFileSync: () => {}
  }

  fs.readFile = toCallback(fs.promises.readFile)
  fs.writeFile = toCallback(fs.promises.writeFile)
  fs.readFileSync = fs.promises.readFileSync
  fs.writeFileSync = fs.promises.writeFileSync
}

module.exports = fs
