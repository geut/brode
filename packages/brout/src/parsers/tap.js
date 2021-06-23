import completed from 'tap-completed'

export default function tapParser ({ target, exit, log }) {
  const tap = completed(results => {
    if (results.ok) {
      exit(0)
    } else {
      exit(1)
    }
  })
  log({ args: [`# target: ${target}`] })
  return function ({ type, args }) {
    tap.write(`${args.join(' ')}\n`)
    log({ type, args })
  }
}
