const url = require('native-url')

const scope = (typeof self !== 'undefined' && self) || window

url.URL = scope.URL

module.exports = url
