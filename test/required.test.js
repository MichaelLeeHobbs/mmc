import { describe, it, expect, vi } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

// required() is a thin deprecated wrapper that logs a deprecation warning and
// delegates to channelUtils.required(libs). We load channelUtils.js (to declare
// the global `channelUtils`) then required.js into the same context, then replace
// channelUtils.required with a spy to observe delegation.
function load() {
  return loadTemplates(['Globals/channelUtils.js', 'Globals/required.js'], {
    channelName: 'TestChannel',
  })
}

describe('required (deprecated wrapper)', () => {
  it('delegates to channelUtils.required with the same libs and returns its value', () => {
    const sb = load()
    const spy = vi.fn(() => 'delegated-result')
    sb.channelUtils.required = spy

    const out = sb.required(['$t', 'assert', 'fetch'])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(['$t', 'assert', 'fetch'])
    expect(out).toBe('delegated-result')
  })

  it('logs a deprecation warning including the channel name', () => {
    const sb = load()
    sb.channelUtils.required = vi.fn()
    sb.required(['x'])

    const infoCalls = sb.logger.__calls.filter((c) => c.level === 'info')
    expect(infoCalls.length).toBe(1)
    const msg = String(infoCalls[0].args[0])
    expect(msg).toContain('DEPRECATED')
    expect(msg).toContain('channelUtils.required()')
    expect(msg).toContain('TestChannel')
  })

  it('propagates errors thrown by channelUtils.required', () => {
    const sb = load()
    sb.channelUtils.required = vi.fn(() => { throw new Error('missing lib') })
    expect(() => sb.required(['nope'])).toThrow('missing lib')
  })
})
