import crypto from './esm/crypto-browserify.js'
import getScope from './scope.js'

export * from './esm/crypto-browserify.js'

crypto.WebCrypto = getScope().crypto
export const WebCrypto = crypto.WebCrypto
export default crypto
