import getScope from './scope.js'
import * as url from './esm/native-url.js'

const scope = getScope()

export const URL = scope.URL

export * from './esm/native-url.js'

export default {
  ...url,
  URL
}
