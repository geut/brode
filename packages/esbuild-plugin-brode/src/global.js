import { setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate } from '@geut/browser-node-core/timers'
import { Buffer as Buf } from '@geut/browser-node-core/buffer'
import proc from '@geut/browser-node-core/process'

export const Buffer = Buf
export const process = proc
export { setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate }
