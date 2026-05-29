import { describe, it, expect, vi } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

function load() {
  const sleep = vi.fn()
  const sandbox = loadTemplate('Globals/$retry.js', {
    java: { lang: { Thread: { sleep } } },
  })
  return { $retry: sandbox.$retry, sleep }
}

describe('$retry', () => {
  it('returns the callback result on first success without sleeping', () => {
    const { $retry, sleep } = load()
    const cb = vi.fn(() => 'ok')
    const result = $retry(cb)
    expect(result).toBe('ok')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('retries until it succeeds and returns that value', () => {
    const { $retry } = load()
    let attempts = 0
    const cb = vi.fn(() => {
      attempts++
      if (attempts < 3) throw new Error('not yet ' + attempts)
      return 'finally'
    })
    const result = $retry(cb, { retries: 5 })
    expect(result).toBe('finally')
    expect(cb).toHaveBeenCalledTimes(3)
  })

  it('retries exactly `retries` times then returns undefined by default', () => {
    const { $retry } = load()
    const cb = vi.fn(() => { throw new Error('always') })
    const result = $retry(cb, { retries: 4 })
    expect(result).toBeUndefined()
    expect(cb).toHaveBeenCalledTimes(4)
  })

  it('defaults to 5 retries', () => {
    const { $retry } = load()
    const cb = vi.fn(() => { throw new Error('always') })
    $retry(cb)
    expect(cb).toHaveBeenCalledTimes(5)
  })

  it('honors backoff: sleeps backoff*attempt between attempts, not after the last', () => {
    const { $retry, sleep } = load()
    const cb = vi.fn(() => { throw new Error('always') })
    $retry(cb, { retries: 3, backoff: 100 })
    // attempts 1 and 2 sleep (attempt < retries); attempt 3 does not
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenNthCalledWith(1, 100) // 100 * 1
    expect(sleep).toHaveBeenNthCalledWith(2, 200) // 100 * 2
  })

  it('uses default backoff of 1000 when not specified', () => {
    const { $retry, sleep } = load()
    const cb = vi.fn(() => { throw new Error('always') })
    $retry(cb, { retries: 2 })
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(1000)
  })

  it('rethrows the last error when throwOnFail is true', () => {
    const { $retry } = load()
    let n = 0
    const cb = vi.fn(() => { n++; throw new Error('err ' + n) })
    expect(() => $retry(cb, { retries: 3, throwOnFail: true }))
      .toThrow('err 3')
    expect(cb).toHaveBeenCalledTimes(3)
  })
})
