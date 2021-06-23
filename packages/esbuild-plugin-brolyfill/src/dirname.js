import { promises as fs } from 'fs'
import path from 'path'

export default (build, inject = true) => {
  const entryFormat = build.initialOptions.format

  build.onLoad({ filter: /\.(js|mjs|cjs)$/, namespace: 'file' }, async args => {
    if (args.path.includes('/node_modules/')) return
    if (!args.path.includes(process.cwd())) return

    let contents = await fs.readFile(args.path, 'utf-8')
    let format = 'cjs'
    if (args.path.endsWith('.mjs') || (args.path.endsWith('.js') && entryFormat === 'esm')) {
      format = 'esm'
    }

    const relativePath = args.path.replace(process.cwd(), '')

    contents = contents.replace(/__BRODE_FILENAME__/g, `'${relativePath}'`)

    if (!inject) return { contents }

    if (format === 'esm') {
      return {
        contents: contents.replace(/import.meta.url/g, `'file://${relativePath}'`)
      }
    }

    return {
      contents: contents
        .replace(/__dirname/g, `'${path.dirname(relativePath)}'`)
        .replace(/__filename/g, `'${relativePath}'`)
    }
  })
}
