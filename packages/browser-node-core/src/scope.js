export default function getScope () {
  // eslint-disable-next-line no-undef
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  if (typeof globalThis !== 'undefined') { return globalThis }
  throw new Error('unable to locate global object')
}
