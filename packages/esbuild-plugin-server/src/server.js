import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { NanoresourcePromise } from 'nanoresource-promise/emitter.js'
import staticPlugin from 'fastify-static'
import mime from 'mime-types'
import fastify from 'fastify'
import getPort from 'get-port'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class Server extends NanoresourcePromise {
  constructor (esbuildOptions, opts = {}) {
    super()

    const { port = 3000, host = '127.0.0.1', https = false, template = path.resolve(__dirname, '../static/index.html'), onNotFound, ...staticOptions } = opts

    this._esbuildOptions = esbuildOptions
    this._files = []
    this._port = port
    this._host = host
    this._https = https
    this._static = staticOptions
    this._template = template
    this._onNotFound = onNotFound
    this._fastify = fastify({ logger: { level: 'error' } })
  }

  get buildPaths () {
    if (this._buildPaths) return this._buildPaths

    let { outdir, outfile, absWorkingDir = process.cwd(), write = true } = this._esbuildOptions

    if (!outdir && !outfile) {
      outdir = absWorkingDir
    }

    absWorkingDir = path.resolve(absWorkingDir)

    if (outdir) {
      outdir = path.resolve(absWorkingDir, outdir)
    }

    if (outfile) {
      outfile = path.resolve(absWorkingDir, outfile)
      outdir = path.resolve(absWorkingDir, path.relative(absWorkingDir, outfile).split(path.sep)[0])
    }

    this._buildPaths = {
      outdir,
      outfile,
      absWorkingDir,
      write
    }

    return this._buildPaths
  }

  get fastify () {
    return this._fastify
  }

  get port () {
    return this._port
  }

  get host () {
    return this._host
  }

  get https () {
    return this._https
  }

  get url () {
    return `http${this._https ? 's' : ''}://${this._host}:${this._port}`
  }

  setFiles (files = []) {
    const { write } = this.buildPaths

    this._files = files.map(entry => {
      if (!write) {
        return {
          path: entry.path,
          url: this.getFileURL(entry.path),
          text: entry.text
        }
      }

      return {
        path: entry.path,
        url: this.getFileURL(entry.path)
      }
    })
  }

  getFileURL (filepath) {
    const { outdir, absWorkingDir } = this.buildPaths

    filepath = path.relative(path.resolve(absWorkingDir, outdir), filepath)

    if (filepath.startsWith('/')) {
      return filepath.slice(1)
    } else if (filepath.startsWith('./')) {
      return filepath.slice(2)
    } else {
      return filepath
    }
  }

  async open () {
    await super.open()
    return this.url
  }

  async _open () {
    const { outdir, write, absWorkingDir } = this.buildPaths

    let root
    if (this._static.root) {
      root = Array.isArray(this._static.root) ? this._static.root : [this._static.root]
    } else {
      root = [path.join(process.cwd(), 'public')]
    }

    if (write) {
      root.push(outdir)
    }

    this._fastify.register(staticPlugin, {
      ...this._static,
      root,
      prefix: '/'
    })

    const { format = 'iife' } = this._esbuildOptions

    this._fastify.get('/', async (req, reply) => {
      let html = await fs.readFile(this._template, 'utf-8')
      const tags = this._files.filter(entry => entry.path.endsWith('.js')).map(entry => `<script src="${entry.url}" ${format === 'esm' && 'type="module"'}></script>`).join('\n')
      html = html.replace('</body>', `${tags}\n</body>`)
      reply.type(mime.lookup('.html')).send(html)
    })

    this._fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.includes('favicon.ico')) {
        return fs.readFile(path.resolve(__dirname, '../static/favicon.ico'))
      }

      if (write) {
        if (this._onNotFound) return this._onNotFound(request, reply)
      }

      const entryResource = this._files.find(entry => request.url.startsWith(`/${entry.url}`))
      if (entryResource) {
        reply.type(mime.lookup(request.url)).send(entryResource.text)
        return
      }

      let resource = request.url
      if (path.isAbsolute(resource)) {
        resource = resource.slice(1)
      }

      const file = await fs.readFile(path.resolve(absWorkingDir, resource)).catch(() => {})
      if (file) {
        reply.type(mime.lookup(resource)).send(file)
        return
      }

      if (this._onNotFound) return this._onNotFound(request, reply)
      console.log('not found')
      reply.callNotFound()
    })

    this._port = await getPort({ port: this._port })
    await this._fastify.listen(this._port)
  }

  close () {
    return this._fastify.close()
  }
}
