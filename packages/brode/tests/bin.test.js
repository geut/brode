import { test } from 'uvu'
import * as assert from 'uvu/assert'

import execa from 'execa'

test('basic success hello', async () => {
  const proc = await execa('brode', ['./tests/fixtures/success-hello.js'], {
    preferLocal: true
  })
  assert.is(proc.exitCode, 0)
  assert.is(proc.stdout, 'hello world!')
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
  assert.is(error.stderr, 'fail!')
})

test.run()
