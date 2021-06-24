import { promises as fs } from 'fs'
import pEvent from 'p-event'

export const STDOUT_SYMBOL = '\uFEFF\u200B\u00A0'

export const actions = {
  exit: (args, runner) => {
    const [signal] = args
    runner.done(signal)
  },

  fsReadFile: (args) => {
    const [filepath] = args
    return fs.readFile(filepath, 'base64')
  },

  fsWriteFile: (args) => {
    const [filepath, content, isBuffer] = args
    return fs.writeFile(filepath, isBuffer ? Buffer.from(content, 'base64') : content)
  },

  fsStat: async (args) => {
    const [filepath] = args
    const stat = await fs.stat(filepath)

    return {
      ...stat,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile()
    }
  },

  stdin: async () => {
    if (process.stdin.destroyed) return
    const data = process.stdin.read()
    if (data) return data.toString('base64')
    await pEvent(process.stdin, 'readable', {
      resolutionEvents: ['end']
    })
    if (process.stdin.destroyed) return
    return process.stdin.read().toString('base64')
  }
}

export const actionsContentScript = `
  const call = action => (...args) => __BROUT_CALL__(action, args)
  const uncatch = func => (...args) => func(...args).catch(() => {})

  globalThis.$brout = {
    process: {
      stdout: content => console.log(content, '${STDOUT_SYMBOL}'),
      stderr: content => console.error(content, '${STDOUT_SYMBOL}'),
      stdin: call('stdin'),
      exit: uncatch(call('exit')),
      cwd: '${process.cwd()}',
      versions: ${JSON.stringify(process.versions)}
    },
    fs: {
      readFile: call('fsReadFile'),
      writeFile: call('fsWriteFile'),
      stat: call('fsStat')
    }
  }
`
