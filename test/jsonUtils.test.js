import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const { jsonUtils } = loadTemplate('Globals/jsonUtils.js')

describe('jsonUtils.stringify (pure cases)', () => {
  it('stringifies primitives like JSON.stringify', () => {
    expect(jsonUtils.stringify(null)).toBe('null')
    expect(jsonUtils.stringify(42)).toBe('42')
    expect(jsonUtils.stringify('hi')).toBe('"hi"')
    expect(jsonUtils.stringify(true)).toBe('true')
  })

  it('renders non-finite numbers as null', () => {
    expect(jsonUtils.stringify(Infinity)).toBe('null')
    expect(jsonUtils.stringify(NaN)).toBe('null')
  })

  it('stringifies a flat object compactly', () => {
    expect(jsonUtils.stringify({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}')
  })

  it('stringifies arrays and nulls function/undefined entries', () => {
    expect(jsonUtils.stringify([1, undefined, 2])).toBe('[1,null,2]')
  })

  it('omits function and undefined object values', () => {
    expect(jsonUtils.stringify({ a: 1, b: undefined, c: () => {} })).toBe('{"a":1}')
  })

  it('escapes special characters in strings', () => {
    expect(jsonUtils.stringify('a\n"b"\t')).toBe('"a\\n\\"b\\"\\t"')
  })

  it('honors numeric indentation', () => {
    expect(jsonUtils.stringify({ a: 1 }, 2)).toBe('{\n  "a": 1\n}')
  })

  it('replaces circular references with a marker', () => {
    const obj = { a: 1 }
    obj.self = obj
    expect(jsonUtils.stringify(obj)).toBe('{"a":1,"self":"[Circular Reference]"}')
  })
})

describe('jsonUtils.stringifyCircular', () => {
  it('matches JSON.stringify for non-circular data (default indent 2)', () => {
    const obj = { a: 1, b: [2, 3] }
    expect(jsonUtils.stringifyCircular(obj)).toBe(JSON.stringify(obj, null, 2))
  })

  it('honors a custom indent', () => {
    expect(jsonUtils.stringifyCircular({ a: 1 }, 0)).toBe('{"a":1}')
  })

  it('drops circular references instead of throwing', () => {
    const obj = { a: 1 }
    obj.self = obj
    const out = jsonUtils.stringifyCircular(obj, 0)
    expect(out).toBe('{"a":1}')
  })
})
