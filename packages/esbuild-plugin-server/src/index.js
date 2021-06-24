import path from 'path'

import { Server } from './server.js'

export { Server }

const kClose = Symbol('kClose')

export const close = plugin => plugin[kClose]()

export default function server (opts = {}) {
  const { onSetup, onStart, onClose, ...serverOpts } = opts

  let closed = false
  let server
  return {
    name: 'server',
    setup (build) {
      if (closed) return

      const { absWorkingDir = process.cwd() } = build.initialOptions
      build.initialOptions.metafile = true
      server = new Server(build.initialOptions, { ...serverOpts })

      onSetup && onSetup(server)

      server.once('opened', () => {
        onStart && onStart(server)
      })

      server.once('closed', () => {
        onClose && onClose(server)
      })

      build.onEnd(async result => {
        const { errors, outputFiles = [], metafile } = result

        if (errors.length) return

        if (!server.opened || !server.opening) {
          await server.open()
        }

        server.setFiles(Object.keys(metafile.outputs).map(targetPoint => {
          const outputPath = path.resolve(absWorkingDir, targetPoint)
          const file = outputFiles.find(file => file.path === outputPath || file.path === '<stdout>')
          return {
            targetPoint,
            path: outputPath,
            text: file && file.text
          }
        }))
      })
    },
    [kClose] () {
      closed = true
      return server && server.close()
    }
  }
}
