/* global $brout */

;(async () => {
  console.log('log0')
  console.error('error0')
  console.warn('warn0')
  await $brout.process.stdout('stdout0')
  await $brout.process.stderr('stderr0')
  const cwd = $brout.process.cwd
  console.log(cwd.split('/').pop())
  await $brout.process.exit(0)
})()
