/* global performance */
const cpus = require('cpus')

module.exports = {
  cpus,

  loadavg: () => [0, 0, 0],

  hostname: () => {
    if (typeof location !== 'undefined') {
      return location.hostname
    } else return ''
  },

  release: () => {
    if (typeof navigator !== 'undefined') {
      return navigator.appVersion
    }
    return ''
  },

  userInfo: () => ({
    uid: 1000,
    gid: 1000,
    username: 'brode',
    homedir: '/home/brode',
    shell: '/bin/bash'
  }),

  endianness: () => 'LE',
  uptime: () => Date.now(),
  type: () => 'Browser',
  networkInterfaces: () => ({}),
  getNetworkInterfaces: () => ({}),
  arch: () => 'javascript',
  platform: () => 'browser',
  tmpdir: () => '/tmp',
  tmpDir: () => '/tmp',
  EOL: '\n',
  homedir: () => '/',
  totalmem: () => performance ? performance.memory.totalJSHeapSize : Number.MAX_VALUE,
  freemem: () => performance ? performance.memory.totalJSHeapSize - performance.memory.usedJSHeapSize : Number.MAX_VALUE
}
