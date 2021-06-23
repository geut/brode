import trim from 'lodash.trim'

const fields = [
  {
    name: 'Total',
    parse: (text) => Number(/Total:[\s]*([\d]*)/gi.exec(text)[1])
  },
  {
    name: 'Passed',
    parse: (text) => Number(/Passed:[\s]*([\d]*)/gi.exec(text)[1])
  },
  {
    name: 'Skipped',
    parse: (text) => Number(/Skipped:[\s]*([\d]*)/gi.exec(text)[1])
  },
  {
    name: 'Duration',
    parse: text => Number(/Duration:[\s]*([\\.\d]*)/gi.exec(text)[1])
  }
]

function getResult (lines) {
  const result = {}
  try {
    lines = lines.slice(-4)
    for (const field of fields) {
      let value = lines.find(line => line.includes(field.name))
      if (value === undefined || value === null) return null
      value = field.parse(value)
      if (value === undefined || value === null || Number.isNaN(value)) return null
      result[field.name.toLocaleLowerCase()] = value
    }
    return result
  } catch (err) {
    return null
  }
}

export default function uvuParser ({ target, exit, log }) {
  const lines = []

  const _log = log
  log = ({ type, args }) => {
    // goes everything through stdout/stderr as uvu does
    if (type === 'error') {
      type = 'stderr'
    } else if (type !== 'stdout' || type !== 'stderr') {
      type = 'stdout'
    }
    _log({ type, args })
  }

  return function ({ type, args }) {
    const text = args.join(' ')
    lines.push(text)

    if (text.includes('Duration:') && lines.length >= 4) {
      const result = getResult(lines)
      if (result) {
        exit(result.total === result.passed ? 0 : 1)

        log({ type, args: [`\n${trim(text, '\n')}`] })
        log({ type, args: [`\n  Target:    ${target}\n\n`] })
        return
      }
    }

    log({ type, args })
  }
}
