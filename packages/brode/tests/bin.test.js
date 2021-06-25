import execa from 'execa'

test('basic success hello', async () => {
  const proc = await execa('brode', ['./tests/fixtures/success-hello.js'], {
    preferLocal: true
  })
  expect(proc.exitCode).toBe(0)
  expect(proc.stdout).toBe('hello world!')
})

test('basic fail hello', async () => {
  let error
  try {
    await execa('brode', ['./tests/fixtures/fail-hello.js'], {
      preferLocal: true
    })
  } catch (err) {
    error = err
  }

  expect(error.stderr).toBe('fail!')
})
