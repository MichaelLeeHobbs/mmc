import { describe, it, expect, vi } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

function load() {
  const sleep = vi.fn()
  const sandbox = loadTemplate('Globals/$sleep.js', {
    java: { lang: { Thread: { sleep } } },
  })
  return { $sleep: sandbox.$sleep, sleep }
}

describe('$sleep', () => {
  it('calls Thread.sleep with the parsed millisecond value', () => {
    const { $sleep, sleep } = load()
    $sleep(250)
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(250)
  })

  it('parses a numeric string argument', () => {
    const { $sleep, sleep } = load()
    $sleep('500')
    expect(sleep).toHaveBeenCalledWith(500)
  })

  it('treats a non-numeric argument as 0 and still sleeps (ms is not < 0)', () => {
    // parseInt('abc') -> NaN -> `|| 0` -> 0; 0 is not < 0 so Thread.sleep(0) runs
    const { $sleep, sleep } = load()
    $sleep('abc')
    expect(sleep).toHaveBeenCalledWith(0)
  })

  it('sleeps for 0 (guard is ms < 0, not <= 0)', () => {
    const { $sleep, sleep } = load()
    $sleep(0)
    expect(sleep).toHaveBeenCalledWith(0)
  })

  it('no-ops for negative values', () => {
    const { $sleep, sleep } = load()
    $sleep(-5)
    expect(sleep).not.toHaveBeenCalled()
  })
})
