import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { Brout } from '../src/index.js'
import tapParser from '../src/parsers/tap.js'
import uvuParser from '../src/parsers/uvu.js'

const logger = logs => ({ type, args }) => {
  logs.push({ type, content: args.join(' ') })
}

test('basic', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/basic.js --config ./tests/webpack.config.js',
    log: logger(logs)
  })

  const exit = await brout.run()
  assert.is(exit, 0)
  assert.equal(logs, [
    { type: undefined, content: 'Target: chromium\n' },
    { type: 'log', content: 'log0' },
    { type: 'error', content: 'error0' },
    { type: 'warn', content: 'warn0' },
    { type: 'stdout', content: 'stdout0' },
    { type: 'stderr', content: 'stderr0' },
    { type: 'log', content: 'brout' }
  ])
})

test('basic fail', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/basic-fail.js --config ./tests/webpack.config.js',
    log: logger(logs)
  })

  try {
    await brout.run()
    assert.unreachable()
  } catch (err) {
    assert.is(err.message, 'error0')
  }

  assert.equal(logs, [
    { type: undefined, content: 'Target: chromium\n' },
    { type: 'error', content: 'Error: error0' }
  ])
})

test.skip('tap', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/tap.js --config ./tests/webpack.config.js',
    parser: tapParser,
    log: logger(logs)
  })

  const exit = await brout.run()
  assert.is(exit, 0)
  assert.equal(logs, [
    { type: undefined, content: '# target: chromium' },
    { type: 'log', content: 'TAP version 13' },
    { type: 'log', content: '# should result to the answer' },
    { type: 'log', content: 'ok 1 - answer should be 42' },
    { type: 'log', content: '' },
    { type: 'log', content: '1..1' },
    { type: 'log', content: '# tests 1' },
    { type: 'log', content: '# pass  1' },
    { type: 'log', content: '# fail  0' },
    { type: 'log', content: '# skip  0' }
  ])
})

test.skip('tap fail', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/tap-fail.js --config ./tests/webpack.config.js',
    parser: tapParser,
    log: logger(logs)
  })

  const exit = await brout.run()
  assert.is(exit, 1)
  assert.equal(logs, [
    { type: undefined, content: '# target: chromium' },
    { type: 'log', content: 'TAP version 13' },
    { type: 'log', content: '# should result to the answer' },
    { type: 'log', content: 'not ok 1 - answer should be 42' },
    { type: 'log', content: '  ---' },
    { type: 'log', content: '    actual: 42' },
    { type: 'log', content: '    expected: 43' },
    { type: 'log', content: '    operator: "equal"' },
    {
      type: 'log',
      content: '    at: " eval (webpack-internal:///./tests/fixtures/tap-fail.js:7:5)"'
    },
    { type: 'log', content: '  ...' },
    { type: 'log', content: '' },
    { type: 'log', content: '1..1' },
    { type: 'log', content: '# tests 1' },
    { type: 'log', content: '# pass  0' },
    { type: 'log', content: '# fail  1' },
    { type: 'log', content: '# skip  0' }
  ])
})

test('uvu', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/uvu.js --config ./tests/webpack.config.js',
    parser: uvuParser,
    log: logger(logs)
  })

  const exit = await brout.run()
  assert.is(exit, 0)
  assert.equal(logs.filter(({ content }) => !content.includes('Duration')), [
    { type: 'stdout', content: '\x1B[90m• \x1B[39m' },
    { type: 'stdout', content: '\x1B[32m  (1 / 1)\n\x1B[39m' },
    { type: 'stdout', content: '\n  Total:     1' },
    { type: 'stdout', content: '\x1B[32m\n  Passed:    1\x1B[39m' },
    { type: 'stdout', content: '\n  Skipped:   0' },
    { type: 'stdout', content: '\n  Target:    chromium\n\n' }
  ])
})

test('uvu fail', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/uvu-fail.js --config ./tests/webpack.config.js',
    parser: uvuParser,
    log: logger(logs)
  })

  const exit = await brout.run()
  assert.is(exit, 1)
  assert.equal(logs.filter(({ content }) => !content.includes('Duration') && !content.includes('webpack')), [
    { type: 'stdout', content: '\x1B[31m✘ \x1B[39m' },
    { type: 'stdout', content: '\x1B[31m  (0 / 1)\n\x1B[39m' },
    { type: 'stdout', content: '\n  Total:     1' },
    { type: 'stdout', content: '\x1B[31m\n  Passed:    0\x1B[39m' },
    { type: 'stdout', content: '\n  Skipped:   0' },
    { type: 'stdout', content: '\n  Target:    chromium\n\n' }
  ])
})

test.run()
