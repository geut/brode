import { promises as fs } from 'fs'
import path from 'path'

export default (build, dirnameFilter = () => false) => {
  let { absWorkingDir = process.cwd() } = build.initialOptions

  absWorkingDir = path.resolve(absWorkingDir)

  build.onLoad({ filter: /\.(js|mjs|cjs)$/, namespace: 'file' }, async args => {
    const isNodeModule = args.path.includes('/node_modules/')
    if (!dirnameFilter(args.path, absWorkingDir)) return
    if (!args.path.includes(absWorkingDir) && !isNodeModule) return

    const contents = await fs.readFile(args.path, 'utf-8')

    let filepath
    if (isNodeModule) {
      filepath = `/web_modules/${args.path.split('/node_modules/').pop()}`
    } else {
      filepath = path.relative(absWorkingDir, args.path)
    }

    // eslint-disable-next-line no-template-curly-in-string
    const url = '`${globalThis.location.origin}' + filepath + '`'

    return {
      contents: contents
        .replace(/__BRODE_FILENAME__/g, `'${filepath}'`)
        .replace(/import.meta.url/g, url)
        .replace(/__dirname/g, `'${path.dirname(filepath)}'`)
        .replace(/__filename/g, `'${filepath}'`)
    }
  })
}
