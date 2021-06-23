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
      if (enc === 'utf-8') return result
      result = Buffer.from(result)
      if (enc === 'binary') return result
      return result.toString(enc)
    },
    writeFile: async (filename, content) => {
      if (Buffer.isBuffer(content)) {
        content = content.toString('utf-8')
      }
      return scope.$brout.fs.writeFile(filename, content)
    },
    stat: async filename => {
      return scope.$brout.fs.stat(filename)
    }
  }

  fs.readFile = toCallback(fs.promises.readFile)
  fs.writeFile = toCallback(fs.promises.writeFile)
}

module.exports = fs
