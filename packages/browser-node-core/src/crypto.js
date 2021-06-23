const crypto = require('crypto-browserify')
const getScope = require('./scope.js')
crypto.WebCrypto = getScope().crypto
module.exports = crypto
