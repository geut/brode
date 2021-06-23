/* global $brout */

;(async () => {
  console.log('log0')
  console.error('error0')
  console.warn('warn0')
  await $brout.stdout('stdout0')
  await $brout.stderr('stderr0')
  const cwd = await $brout.cwd()
  console.log(cwd.split('/').pop())
  await $brout.exit(0)
})()
