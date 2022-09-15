import { deflateSync, inflateSync, gzip, gunzip, zlibSync, unzlibSync } from './esm/fflate.js'

export const deflateRaw = deflateSync
export const inflateRaw = inflateSync
export const deflate = zlibSync
export const inflate = unzlibSync
export { gzip, gunzip }

export default {
  deflateRaw,
  inflateRaw,
  gzip,
  gunzip,
  deflate,
  inflate
}
