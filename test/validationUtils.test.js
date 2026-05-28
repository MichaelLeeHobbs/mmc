import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const { validationUtils } = loadTemplate('Globals/validationUtils.js')

describe('validationUtils.parseInt', () => {
  it('parses a valid integer string', () => {
    expect(validationUtils.parseInt('42')).toBe(42)
  })

  it('parses a numeric value', () => {
    expect(validationUtils.parseInt(7)).toBe(7)
  })

  it('returns default 0 for NaN when no opts given', () => {
    expect(validationUtils.parseInt('abc')).toBe(0)
  })

  it('returns provided default when value is NaN', () => {
    expect(validationUtils.parseInt('abc', { default: 99 })).toBe(99)
  })

  it('clamps to min when below min', () => {
    expect(validationUtils.parseInt('1', { min: 5 })).toBe(5)
  })

  it('clamps to max when above max', () => {
    expect(validationUtils.parseInt('100', { max: 10 })).toBe(10)
  })

  it('returns value when within bounds', () => {
    expect(validationUtils.parseInt('7', { min: 5, max: 10 })).toBe(7)
  })

  it('parses leading-numeric strings like parseInt radix 10', () => {
    expect(validationUtils.parseInt('12px')).toBe(12)
  })
})
