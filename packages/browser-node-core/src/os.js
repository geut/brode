/* global performance */
import cpus from './esm/cpus.js'

export { cpus }

export const loadavg = () => [0, 0, 0]

export const hostname = () => {
  if (typeof location !== 'undefined') {
    return location.hostname
  } else return ''
}

export const release = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.appVersion
  }
  return ''
}

export const userInfo = () => ({
  uid: 1000,
  gid: 1000,
  username: 'brode',
  homedir: '/home/brode',
  shell: '/bin/bash'
})

export const endianness = () => 'LE'
export const uptime = () => Date.now()
export const type = () => 'Browser'
export const networkInterfaces = () => ({})
export const getNetworkInterfaces = () => ({})
export const arch = () => 'javascript'
export const platform = () => 'browser'
export const tmpdir = () => '/tmp'
export const EOL = '\n'
export const homedir = () => '/'
export const totalmem = () => typeof performance !== 'undefined' ? performance.memory.totalJSHeapSize : Number.MAX_VALUE
export const freemem = () => typeof performance !== 'undefined' ? performance.memory.totalJSHeapSize - performance.memory.usedJSHeapSize : Number.MAX_VALUE

export default {
  cpus,
  loadavg,
  hostname,
  release,
  userInfo,
  endianness,
  uptime,
  type,
  networkInterfaces,
  getNetworkInterfaces,
  arch,
  platform,
  tmpdir,
  EOL,
  homedir,
  totalmem,
  freemem
}
