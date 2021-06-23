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

  await expect(brout.run()).resolves.toBe(0)
  expect(logs).toMatchSnapshot()
})

test('basic fail', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/basic-fail.js --config ./tests/webpack.config.js',
    log: logger(logs)
  })

  await expect(brout.run()).rejects.toThrow('error0')
  expect(logs).toMatchSnapshot()
})

test('tap', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/tap.js --config ./tests/webpack.config.js',
    parser: tapParser,
    log: logger(logs)
  })

  await expect(brout.run()).resolves.toBe(0)
  expect(logs).toMatchSnapshot()
})

test('tap fail', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/tap-fail.js --config ./tests/webpack.config.js',
    parser: tapParser,
    log: logger(logs)
  })

  await expect(brout.run()).resolves.toBe(1)
  expect(logs).toMatchSnapshot()
})

test('uvu', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/uvu.js --config ./tests/webpack.config.js',
    parser: uvuParser,
    log: logger(logs)
  })

  await expect(brout.run()).resolves.toBe(0)
  expect(logs.filter(({ content }) => !content.includes('Duration'))).toMatchSnapshot()
})

test('uvu fail', async () => {
  const logs = []

  const brout = new Brout({
    url: 'http://127.0.0.1:3000',
    command: 'webpack serve ./tests/fixtures/uvu-fail.js --config ./tests/webpack.config.js',
    parser: uvuParser,
    log: logger(logs)
  })

  await expect(brout.run()).resolves.toBe(1)
  expect(logs.filter(({ content }) => !content.includes('Duration'))).toMatchSnapshot()
})
