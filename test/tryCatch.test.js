import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const { tryCatch } = loadTemplate('Globals/tryCatch.js')

describe('tryCatch', () => {
  it('returns [data, null] on success', () => {
    const result = tryCatch(() => 42)
    expect(result).toEqual([42, null])
  })

  it('returns [null, error] on throw', () => {
    const err = new Error('boom')
    const result = tryCatch(() => { throw err })
    expect(result[0]).toBeNull()
    expect(result[1]).toBe(err)
  })

  it('applies mapError transform to the caught error', () => {
    const result = tryCatch(
      () => { throw new Error('boom') },
      (e) => 'mapped:' + e.message
    )
    expect(result).toEqual([null, 'mapped:boom'])
  })

  it('ignores a non-function mapError and returns the raw error', () => {
    const err = new Error('boom')
    const result = tryCatch(() => { throw err }, 'not-a-fn')
    expect(result[1]).toBe(err)
  })
})
