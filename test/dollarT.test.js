import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

const sandbox = loadTemplate('Globals/$t.js')
const $t = sandbox['$t']

describe('$t', () => {
  // The source declares `function $t` inside `if (typeof $t === 'undefined') { ... }`.
  // Under vm this block-scoped function declaration is still hoisted as a sandbox
  // global in non-strict sloppy mode, so it surfaces on the sandbox. Verified below.
  it('surfaces $t as a sandbox global', () => {
    expect(typeof $t).toBe('function')
  })

  it('returns the callback value on success', () => {
    expect($t(() => 'ok')).toBe('ok')
    expect($t(() => ({ a: { b: { c: 1 } } }).a.b.c)).toBe(1)
  })

  it('returns undefined on throw (optional-chaining stand-in)', () => {
    const obj = {}
    expect($t(() => obj.a.b.c)).toBeUndefined()
    expect($t(() => { throw new Error('x') })).toBeUndefined()
  })
})
