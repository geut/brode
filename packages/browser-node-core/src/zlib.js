import * as fflate from './esm/fflate.js'

function isBuffer (b) {
  return b != null && b._isBuffer === true
}

function handleCallbackBuffer (from, cb) {
  return (err, buf) => {
    if (buf && isBuffer(from)) return cb(err, Buffer.from(buf))
    cb(err, buf)
  }
}

function handleBuffer (from, buf) {
  if (buf && isBuffer(from)) return buf
  return buf
}

export const constants = {}

export function deflate (buf, options = {}, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  const { level, memLevel: mem, ...fflateOpts } = options
  return fflate.deflate(buf, { level, mem, ...fflateOpts }, handleCallbackBuffer(buf, cb))
}

export function deflateSync (buf, options = {}) {
  const { level, memLevel: mem, ...fflateOpts } = options
  return handleBuffer(fflate.deflateSync(buf, { level, mem, ...fflateOpts }))
}

export const deflateRaw = deflate
export const deflateRawSync = deflateSync

export function gunzip (buf, options = {}, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  return fflate.gunzip(buf, options, handleCallbackBuffer(buf, cb))
}

export function gunzipSync (buf, options = {}, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  return fflate.gunzipSync(buf, options, handleCallbackBuffer(buf, cb))
}

export function gzip (buf, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  const { level, memLevel: mem, ...fflateOpts } = options
  return fflate.gzip(buf, { level, mem, ...fflateOpts }, handleCallbackBuffer(buf, cb))
}

export function gzipSync (buf, options = {}) {
  const { level, memLevel: mem, ...fflateOpts } = options
  return handleBuffer(buf, fflate.gzipSync(buf, { level, mem, ...fflateOpts }))
}

export function inflate (buf, options = {}, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  const { chunkSize: size, ...fflateOpts } = options
  return fflate.inflate(buf, { size, ...fflateOpts }, handleCallbackBuffer(buf, cb))
}

export function inflateSync (buf, options = {}) {
  const { chunkSize: size, ...fflateOpts } = options
  return handleBuffer(buf, fflate.inflateSync(buf, { size, ...fflateOpts }))
}

export const inflateRaw = inflate
export const inflateRawSync = inflateSync

export function unzip (buf, options = {}, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  return fflate.unzip(buf, options, handleCallbackBuffer(buf, cb))
}

export function unzipSync (buf, options = {}, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  return fflate.unzipSync(buf, options, handleCallbackBuffer(buf, cb))
}

export { fflate }

export default {
  constants,
  fflate,
  deflate,
  deflateSync,
  deflateRaw,
  deflateRawSync,
  gunzip,
  gunzipSync,
  gzip,
  gzipSync,
  inflate,
  inflateSync,
  inflateRaw,
  inflateRawSync,
  unzip,
  unzipSync
}
