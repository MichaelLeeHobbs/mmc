import { describe, it, expect, vi } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

// mirthEventPoller uses $t (inline try-catch). Load $t.js first into the same
// context so the real $t is available, then mirthEventPoller.js.
function load(env) {
  const sb = loadTemplates(['Globals/$t.js', 'Globals/mirthEventPoller.js'], env)
  return sb
}

// Build a Java-Map-like object whose entrySet().toArray() yields {getKey,getValue}.
function makeJavaMap(obj) {
  return {
    entrySet: () => ({
      toArray: () => Object.keys(obj).map((k) => ({ getKey: () => k, getValue: () => obj[k] })),
    }),
  }
}

describe('mirthEventPoller._parseMessageIds', () => {
  function p(str) {
    return load().mirthEventPoller._parseMessageIds(str)
  }

  it('returns [] for empty/null/undefined-ish strings', () => {
    expect(p('')).toEqual([])
    expect(p(null)).toEqual([])
    expect(p('null')).toEqual([])
    expect(p('undefined')).toEqual([])
  })

  it('parses a single id', () => {
    expect(p('123')).toEqual([123])
  })

  it('parses a comma-separated list', () => {
    expect(p('123,456,789')).toEqual([123, 456, 789])
    expect(p(' 1 , 2 , 3 ')).toEqual([1, 2, 3])
  })

  it('parses a range into an inclusive sequence', () => {
    expect(p('123-126')).toEqual([123, 124, 125, 126])
  })

  it('returns [] for a range with non-numeric bounds', () => {
    expect(p('a-b')).toEqual([])
  })

  it('parses a JSON array string', () => {
    expect(p('[123,456]')).toEqual([123, 456])
  })

  it('filters NaN out of a comma list', () => {
    expect(p('1,foo,3')).toEqual([1, 3])
  })
})

describe('mirthEventPoller._parseChannelAttribute', () => {
  function p(str) {
    return load().mirthEventPoller._parseChannelAttribute(str)
  }

  it('parses id and name from Channel[id=...,name=...]', () => {
    const r = p('Channel[id=11111111-2222-3333-4444-555555555555,name=My Channel]\n')
    expect(r.channelId).toBe('11111111-2222-3333-4444-555555555555')
    expect(r.channelName).toBe('My Channel')
  })

  it('returns nulls for empty input', () => {
    expect(p('')).toEqual({ channelId: null, channelName: null })
    expect(p(null)).toEqual({ channelId: null, channelName: null })
  })

  it('returns null name when no name= present', () => {
    const r = p('Channel[id=abc-123]')
    expect(r.channelId).toBe('abc-123')
    expect(r.channelName).toBeNull()
  })
})

describe('mirthEventPoller._parseAttributes', () => {
  it('converts a Java Map of attributes into a trimmed JS object', () => {
    const sb = load()
    const attrs = makeJavaMap({ channel: 'Channel[id=x]', messageId: '  123  ', user: 'bob' })
    expect(sb.mirthEventPoller._parseAttributes(attrs)).toEqual({
      channel: 'Channel[id=x]',
      messageId: '123',
      user: 'bob',
    })
  })

  it('returns {} for null attributes', () => {
    const sb = load()
    expect(sb.mirthEventPoller._parseAttributes(null)).toEqual({})
  })

  it('returns {} (swallows error via $t) when entrySet throws', () => {
    const sb = load()
    const bad = { entrySet: () => { throw new Error('nope') } }
    expect(sb.mirthEventPoller._parseAttributes(bad)).toEqual({})
  })
})

describe('mirthEventPoller._resolveUsername', () => {
  function makeControllers(getUserImpl) {
    return {
      com: {
        mirth: {
          connect: {
            server: {
              controllers: {
                ControllerFactory: {
                  getFactory: () => ({
                    createEventController: () => ({}),
                    createUserController: () => ({ getUser: getUserImpl }),
                    createMessageController: () => ({}),
                  }),
                },
              },
            },
          },
        },
      },
    }
  }

  it('returns null for a falsy userId', () => {
    const sb = load(makeControllers(() => null))
    expect(sb.mirthEventPoller._resolveUsername(null)).toBeNull()
  })

  it('resolves and caches the username from the user controller', () => {
    const getUser = vi.fn(() => ({ getUsername: () => 'alice' }))
    const sb = load(makeControllers(getUser))
    expect(sb.mirthEventPoller._resolveUsername(7)).toBe('alice')
    // second call is served from the $gc cache (controller not hit again)
    expect(sb.mirthEventPoller._resolveUsername(7)).toBe('alice')
    expect(getUser).toHaveBeenCalledTimes(1)
    expect(sb.__maps.$gc.get('mirthEventPoller_user_7')).toBe('alice')
  })

  it('falls back to "userId:<id>" when the lookup yields no user', () => {
    const sb = load(makeControllers(() => null))
    expect(sb.mirthEventPoller._resolveUsername(42)).toBe('userId:42')
  })

  it('falls back to "userId:<id>" when getUser throws (swallowed by $t)', () => {
    const sb = load(makeControllers(() => { throw new Error('boom') }))
    expect(sb.mirthEventPoller._resolveUsername(9)).toBe('userId:9')
  })
})

describe('mirthEventPoller._resolveChannelName', () => {
  it('returns "unknown" for a falsy cid', () => {
    const sb = load({ ChannelUtil: { getChannelName: () => 'x' } })
    expect(sb.mirthEventPoller._resolveChannelName(null)).toBe('unknown')
  })

  it('resolves a channel name via ChannelUtil', () => {
    const sb = load({ ChannelUtil: { getChannelName: (cid) => 'Chan-' + cid } })
    expect(sb.mirthEventPoller._resolveChannelName('abc')).toBe('Chan-abc')
  })

  it('falls back to the cid when ChannelUtil throws (swallowed by $t)', () => {
    const sb = load({ ChannelUtil: { getChannelName: () => { throw new Error('x') } } })
    expect(sb.mirthEventPoller._resolveChannelName('cid-1')).toBe('cid-1')
  })
})

describe('mirthEventPoller.poll', () => {
  it('returns an error message and sets $co flags when eventName is missing', () => {
    const sb = load()
    const out = sb.mirthEventPoller.poll({})
    expect(out).toEqual(['mirthEventPoller: options.eventName is required'])
    expect(sb.__maps.$co.get('hasError')).toBe(true)
    expect(sb.__maps.$co.get('hasResults')).toBe(false)
  })

  it.skip('full poll cycle with events', () => {
    // reason: poll() builds a java.util.Calendar (Calendar.getInstance(),
    //   setTimeInMillis, add(SECOND, -n)) and a com.mirth.connect.model.filters.EventFilter,
    //   then walks a java.util.ArrayList of event objects (getId/getName/getDateTime/
    //   getUserId/getAttributes). Reproducing the full Calendar + EventFilter + ArrayList
    //   semantics faithfully is an integration concern; the missing-eventName guard and the
    //   pure parse/resolve helpers above cover the testable logic.
  })

  it.skip('debugDumpEvents', () => {
    // reason: same Java dependencies as poll() (Calendar, EventFilter, event
    //   ArrayList, MessageController metadata maps) — a thin discovery/debug helper
    //   best validated against a live Mirth instance.
  })
})
