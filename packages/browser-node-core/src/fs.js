import getScope from './scope.js'

const scope = getScope()

function toCallback (runPromise) {
  return (...args) => {
    const callback = args.slice(-1)[0]
    const rest = args.slice(0, args.length - 1)
    runPromise(...rest)
      .then(res => callback(null, res))
      .catch(err => callback(err))
  }
}

export const promises = {
  readFile: async (filename, enc = 'binary') => {
    if (typeof scope.$brout === 'undefined') return
    let result = await scope.$brout.fs.readFile(filename)
    if (enc === 'base64') return result
    result = Buffer.from(result, 'base64')
    if (enc === 'binary') return result
    return result.toString(enc)
  },
  writeFile: async (filename, content) => {
    if (typeof scope.$brout === 'undefined') return
    let isBuffer = false
    if (Buffer.isBuffer(content)) {
      content = content.toString('base64')
      isBuffer = true
    }
    return scope.$brout.fs.writeFile(filename, content, isBuffer)
  },
  stat: async filename => {
    if (typeof scope.$brout === 'undefined') return
    return scope.$brout.fs.stat(filename)
  }
}

export const readFile = toCallback(promises.readFile)
export const writeFile = toCallback(promises.writeFile)
export const readFileSync = () => {}
export const writeFileSync = () => {}

export default {
  readFile,
  writeFile,
  readFileSync,
  writeFileSync
}
