// based on: https://github.com/igoradamenko/esbuild-plugin-alias

export default (build, options) => {
  const aliases = Object.keys(options)
  const re = new RegExp(`^${aliases.map(x => escapeRegExp(x)).join('|')}$`)

  build.onResolve({ filter: re }, args => ({
    path: options[args.path]
  }))
}

function escapeRegExp (string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
