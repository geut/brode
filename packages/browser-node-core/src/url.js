import getScope from './scope.js'
import url from './esm/native-url.js'

const scope = getScope()

url.URL = scope.URL

export const URL = url.URL
export * from './esm/native-url.js'
export default url
