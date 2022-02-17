// based on https://github.com/cabinjs/browser-hrtime

const perfomancePolyfill = () => {
  // based on https://gist.github.com/paulirish/5438650 copyright Paul Irish 2015.
  if ('performance' in window === false) {
    window.performance = {}
  }

  Date.now = (Date.now || (() => { // thanks IE8
    return new Date().getTime()
  }))

  if ('now' in window.performance === false) {
    let nowOffset = Date.now()

    if (performance.timing && performance.timing.navigationStart) {
      nowOffset = performance.timing.navigationStart
    }

    window.performance.now = () => Date.now() - nowOffset
  }
}

const hrtime = (previousTimestamp) => {
  perfomancePolyfill()
  const baseNow = Math.floor((Date.now() - performance.now()) * 1e-3)
  const clocktime = performance.now() * 1e-3
  let seconds = Math.floor(clocktime) + baseNow
  let nanoseconds = Math.floor((clocktime % 1) * 1e9)

  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0]
    nanoseconds = nanoseconds - previousTimestamp[1]
    if (nanoseconds < 0) {
      seconds--
      nanoseconds += 1e9
    }
  }
  return [seconds, nanoseconds]
}

const NS_PER_SEC = 1e9
hrtime.bigint = (time) => {
  const diff = hrtime(time)
  return (diff[0] * NS_PER_SEC + diff[1])
}

export { hrtime, hrtime as default }
