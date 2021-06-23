import { test } from 'uvu'
import * as assert from 'uvu/assert'

test('Math.sqrt()', () => {
  assert.is(Math.sqrt(4), 3)
})

test.run()
