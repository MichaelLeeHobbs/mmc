import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const { arrayUtils } = loadTemplate('Globals/arrayUtils.js')

/** Build a fake Java List ({ size(), get(i) }) backed by a JS array. */
function fakeList(items) {
  return {
    size: () => items.length,
    get: (i) => items[i],
  }
}

describe('arrayUtils.fromArrayList', () => {
  it('converts a fake Java List to a JS array', () => {
    expect(arrayUtils.fromArrayList(fakeList(['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])
  })

  it('handles an empty list', () => {
    expect(arrayUtils.fromArrayList(fakeList([]))).toEqual([])
  })
})

describe('arrayUtils.toObject', () => {
  it('maps to object with keys starting at 1 by default', () => {
    expect(arrayUtils.toObject(['a', 'b', 'c'])).toEqual({ 1: 'a', 2: 'b', 3: 'c' })
  })

  it('honors a custom startIdx', () => {
    expect(arrayUtils.toObject(['a', 'b'], 0)).toEqual({ 0: 'a', 1: 'b' })
    expect(arrayUtils.toObject(['a', 'b'], 5)).toEqual({ 5: 'a', 6: 'b' })
  })

  it('returns empty object for empty array', () => {
    expect(arrayUtils.toObject([])).toEqual({})
  })
})
