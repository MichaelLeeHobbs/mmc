import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const { assert } = loadTemplate('Globals/assert.js')

describe('assert', () => {
  it('does not throw on a truthy condition', () => {
    expect(() => assert(true)).not.toThrow()
    expect(() => assert(1)).not.toThrow()
    expect(() => assert('x')).not.toThrow()
    expect(() => assert({})).not.toThrow()
  })

  it('throws on a falsy condition', () => {
    expect(() => assert(false)).toThrow()
    expect(() => assert(0)).toThrow()
    expect(() => assert('')).toThrow()
    expect(() => assert(null)).toThrow()
    expect(() => assert(undefined)).toThrow()
    expect(() => assert(NaN)).toThrow()
  })

  it('uses the default message when none is supplied', () => {
    expect(() => assert(false)).toThrow('Assertion failed')
  })

  it('uses the provided message', () => {
    expect(() => assert(false, 'custom boom')).toThrow('custom boom')
  })

  it('exposes assert.ok as an alias for assert', () => {
    expect(assert.ok).toBe(assert)
    expect(() => assert.ok(false, 'ok msg')).toThrow('ok msg')
    expect(() => assert.ok(true)).not.toThrow()
  })

  describe('assert.array', () => {
    it('does not throw when all conditions pass', () => {
      expect(() => assert.array([
        [true, 'a'],
        [1, 'b'],
        [() => true, 'c'],
      ])).not.toThrow()
    })

    it('does not throw for an empty array', () => {
      expect(() => assert.array([])).not.toThrow()
    })

    it('throws a combined message listing each failed condition', () => {
      let thrown
      try {
        assert.array([
          [true, 'passing'],
          [false, 'failed one'],
          [0, 'failed two'],
        ])
      } catch (e) {
        thrown = e
      }
      // Note: errors are thrown from inside the vm sandbox realm, so a Node-realm
      // `toBeInstanceOf(Error)` does not hold; assert on name/message instead.
      expect(thrown.name).toBe('Error')
      expect(thrown.message).toBe('Assertions failed:\n- failed one\n- failed two')
    })

    it('evaluates function conditions and includes thrown error messages', () => {
      let thrown
      try {
        assert.array([
          [() => { throw new Error('kaboom') }, 'fn threw'],
          [() => false, 'fn returned false'],
        ])
      } catch (e) {
        thrown = e
      }
      expect(thrown.message).toBe(
        'Assertions failed:\n- fn threw: kaboom\n- fn returned false'
      )
    })
  })
})
