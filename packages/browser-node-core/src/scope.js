export default function getScope () {
  if (typeof self !== 'undefined') { return self }
  if (typeof window !== 'undefined') { return window }
  throw new Error('unable to locate global object')
}
