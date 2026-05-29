import { describe, it, expect, vi } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// A minimal java.lang.StringBuilder used by batchJson's readMessage().
function makeJava() {
  return {
    lang: {
      StringBuilder: function StringBuilder() {
        let buf = ''
        this.append = (s) => { buf += s; return this }
        this.toString = () => buf
      },
    },
  }
}

// A reader whose readLine() returns each queued line then null (EOF).
function makeReader(lines) {
  const q = lines.slice()
  return { readLine: () => (q.length ? q.shift() : null) }
}

function load(env) {
  return loadTemplate('Globals/channelUtils.js', { java: makeJava(), ...env })
}

describe('channelUtils.batchText', () => {
  it('returns lines one at a time in FIFO order (reversed internally so pop is FIFO)', () => {
    const sb = load({ reader: makeReader(['a', 'b', 'c']) })
    const cu = sb.channelUtils
    expect(cu.batchText()).toBe('a')
    expect(cu.batchText()).toBe('b')
    expect(cu.batchText()).toBe('c')
    // exhausted -> '' (messages array empty)
    expect(cu.batchText()).toBe('')
  })

  it('trims each line', () => {
    const sb = load({ reader: makeReader(['  x  ', '\ty\t']) })
    const cu = sb.channelUtils
    expect(cu.batchText()).toBe('x')
    expect(cu.batchText()).toBe('y')
  })

  it('noReverse=true preserves read order via pop (LIFO of the source lines)', () => {
    const sb = load({ reader: makeReader(['a', 'b', 'c']) })
    const cu = sb.channelUtils
    // With noReverse the array is [a,b,c]; pop() yields c,b,a
    expect(cu.batchText(true)).toBe('c')
    expect(cu.batchText(true)).toBe('b')
    expect(cu.batchText(true)).toBe('a')
  })

  it('returns "" immediately when there are no lines', () => {
    const sb = load({ reader: makeReader([]) })
    expect(sb.channelUtils.batchText()).toBe('')
  })

  it('caches the parsed messages in $gc("messages")', () => {
    const sb = load({ reader: makeReader(['a', 'b']) })
    sb.channelUtils.batchText()
    // lines [a,b] -> reversed [b,a] -> pop() returns 'a', remaining cached is ['b']
    expect(sb.__maps.$gc.get('messages')).toEqual(['b'])
  })
})

describe('channelUtils.batchJson', () => {
  it('parses a JSON array and returns elements FIFO with a trailing null sentinel', () => {
    const sb = load({ reader: makeReader(['[{"id":1},{"id":2}]']) })
    const cu = sb.channelUtils
    // messages become stringified, '' appended, reversed -> pop yields first object first
    expect(JSON.parse(cu.batchJson())).toEqual({ id: 1 })
    expect(JSON.parse(cu.batchJson())).toEqual({ id: 2 })
    // trailing '' sentinel -> getMessages().pop() || null  ->  '' is falsy -> null
    expect(cu.batchJson()).toBeNull()
  })

  it('wraps a single (non-array) JSON object into a one-element array', () => {
    const sb = load({ reader: makeReader(['{"only":true}']) })
    const cu = sb.channelUtils
    expect(JSON.parse(cu.batchJson())).toEqual({ only: true })
    expect(cu.batchJson()).toBeNull()
  })

  it('noReverse unshifts the sentinel so it is popped first', () => {
    const sb = load({ reader: makeReader(['[1,2]']) })
    const cu = sb.channelUtils
    // noReverse: messages = ['', '1', '2']; pop yields '2','1', then ''->null
    expect(cu.batchJson(true)).toBe('2')
    expect(cu.batchJson(true)).toBe('1')
    expect(cu.batchJson(true)).toBeNull()
  })

  it('on invalid JSON returns a valid JSON error object string', () => {
    // readMessage()'s catch stores the parse error via `$gc('batchJsonError', e.message)`
    // and returns `[{error: e.message}]`. getMessages() JSON.stringifies each element, so
    // batchJson() pops a VALID JSON string describing the failure.
    const sb = load({ reader: makeReader(['not json']) })
    const cu = sb.channelUtils
    const first = cu.batchJson()
    expect(typeof first).toBe('string')
    expect(first).toContain('"error":')
    const parsed = JSON.parse(first)
    expect(parsed.error).toContain('Failed to parse message!')
  })
})

describe('channelUtils.mapMessageRoute', () => {
  function makeSourceMap(entries) {
    const m = new Map(Object.entries(entries))
    return { get: (k) => m.get(k) }
  }

  it('builds a route string from sourceChannelIds/MessageIds and writes $c("route")', () => {
    const ChannelUtil = { getChannelName: (id) => 'name-of-' + id }
    const connectorMessage = { getMessageId: () => 99 }
    const sb = load({
      sourceMap: makeSourceMap({
        sourceChannelIds: { toArray: () => ['cid1', 'cid2'] },
        sourceMessageIds: { toArray: () => [11, 22] },
      }),
      ChannelUtil,
      connectorMessage,
      channelName: 'ThisChannel',
    })
    const route = sb.channelUtils.mapMessageRoute()
    expect(route).toContain('name-of-cid1:11')
    expect(route).toContain('name-of-cid2:22')
    expect(route).toContain('(ThisChannel:99)')
    expect(sb.__maps.$c.get('route')).toBe(route)
  })

  it('handles scalar (non-toArray) source ids by wrapping them', () => {
    const ChannelUtil = { getChannelName: (id) => 'C(' + id + ')' }
    const connectorMessage = { getMessageId: () => 5 }
    const sb = load({
      sourceMap: makeSourceMap({ sourceChannelId: 'soloCid', sourceMessageId: 'soloMid' }),
      ChannelUtil,
      connectorMessage,
      channelName: 'Chan',
    })
    const route = sb.channelUtils.mapMessageRoute()
    expect(route).toContain('C(soloCid):soloMid')
    expect(route).toContain('(Chan:5)')
  })

  it('with no source ids produces just the current-channel tail', () => {
    const ChannelUtil = { getChannelName: () => 'X' }
    const connectorMessage = { getMessageId: () => 7 }
    const sb = load({
      sourceMap: makeSourceMap({}),
      ChannelUtil,
      connectorMessage,
      channelName: 'Cur',
    })
    const route = sb.channelUtils.mapMessageRoute()
    expect(route).toContain('(Cur:7)')
    expect(sb.__maps.$c.get('route')).toBe(route)
  })

  it('records the error message in $c("route") on failure', () => {
    // sourceMap.get throws -> caught -> $c('route', e.message + ...)
    const sb = load({
      sourceMap: { get: () => { throw new Error('kaboom') } },
      ChannelUtil: { getChannelName: () => 'x' },
      connectorMessage: { getMessageId: () => 1 },
      channelName: 'C',
    })
    const result = sb.channelUtils.mapMessageRoute()
    expect(result).toBeUndefined()
    expect(String(sb.__maps.$c.get('route'))).toContain('kaboom')
  })
})

describe('channelUtils.routeJsonMsg', () => {
  function makeSourceMap(entries) {
    const m = new Map(Object.entries(entries))
    return { get: (k) => m.get(k) }
  }

  it('routes by channel name via router.routeMessage when cid is not a UUID', () => {
    const router = { routeMessage: vi.fn(() => 'routed-name'), routeMessageByChannelId: vi.fn() }
    const sb = load({
      sourceMap: makeSourceMap({}),
      ChannelUtil: { getChannelName: (id) => 'n' + id },
      connectorMessage: { getMessageId: () => 42 },
      channelId: 'CID',
      channelName: 'CName',
      router,
    })
    const out = sb.channelUtils.routeJsonMsg('Some Channel Name', {})
    expect(router.routeMessage).toHaveBeenCalledTimes(1)
    expect(router.routeMessageByChannelId).not.toHaveBeenCalled()
    expect(out).toBe('routed-name')
    const sentJson = JSON.parse(router.routeMessage.mock.calls[0][1])
    expect(sentJson.metadata.channelId).toBe('CID')
    expect(sentJson.metadata.messageId).toBe(42)
    expect(sentJson.metadata.sourceChannelIds).toContain('CID')
  })

  it('routes by channel id via routeMessageByChannelId when cid is a UUID', () => {
    const router = { routeMessage: vi.fn(), routeMessageByChannelId: vi.fn(() => 'routed-id') }
    const uuid = '12345678-1234-1234-1234-123456789012'
    const sb = load({
      sourceMap: makeSourceMap({}),
      ChannelUtil: { getChannelName: (id) => 'n' + id },
      connectorMessage: { getMessageId: () => 1 },
      channelId: 'CID',
      channelName: 'CName',
      router,
    })
    const out = sb.channelUtils.routeJsonMsg(uuid, {})
    expect(router.routeMessageByChannelId).toHaveBeenCalledWith(uuid, expect.any(String))
    expect(router.routeMessage).not.toHaveBeenCalled()
    expect(out).toBe('routed-id')
  })
})

describe('channelUtils controller-heavy methods (skipped passthroughs)', () => {
  it.skip('getSourceMsg', () => {
    // reason: requires Packages.com.mirth.connect.server.controllers.ControllerFactory
    //   + ImmutableMessage + a live connectorMessage/channelId; the method only
    //   dispatches getRawData()/getEncodedData()/etc on a Java ImmutableConnectorMessage,
    //   which cannot be faithfully reproduced with mocks without re-implementing it.
  })

  it.skip('required (delegated copy)', () => {
    // reason: covered indirectly via required.test.js; the full path needs
    //   ObjectXMLSerializer + ConfigurationController + XmlUtil.toJson over a
    //   serialized server config XML — a heavy Java pipeline best left to integration.
  })

})

describe('channelUtils.responseHandler', () => {
  // The response-transformer globals are injected. The function RETURNS the value
  // it assigns to `responseStatus`, so the branch outcome is observable via the
  // return value (and via $c('RESULT')).
  function loadRH(env) {
    return load({
      ERROR: 'ERROR',
      QUEUED: 'QUEUED',
      response: {},
      msg: {},
      ...env,
    })
  }

  it('throws when not called from a response transformer (no response/msg)', () => {
    const sb = loadRH({ response: null, msg: null, responseStatus: 'ERROR', connectorMessage: { getSendAttempts: () => 0 } })
    expect(() => sb.channelUtils.responseHandler([])).toThrow('response transformer')
  })

  it('does nothing when responseStatus is not ERROR', () => {
    const sb = loadRH({ responseStatus: 'SENT', connectorMessage: { getSendAttempts: () => 0 } })
    const out = sb.channelUtils.responseHandler([])
    expect(out).toBeUndefined()
  })

  it('maxAttempts 0 sets responseStatus to the configured status immediately', () => {
    const sb = loadRH({
      responseStatus: 'ERROR',
      responseErrorMessage: 'connection refused',
      connectorMessage: { getSendAttempts: () => 3 },
    })
    const out = sb.channelUtils.responseHandler([
      { key: 'connection refused', responseStatus: 'SENT', maxAttempts: 0 },
    ])
    expect(out).toBe('SENT')
    expect(String(sb.__maps.$c.get('RESULT'))).toBe('connection refused')
  })

  it('requeues (QUEUED) when maxAttempts is greater than attempts', () => {
    const sb = loadRH({
      responseStatus: 'ERROR',
      responseErrorMessage: 'timeout happened',
      connectorMessage: { getSendAttempts: () => 1 },
    })
    const out = sb.channelUtils.responseHandler([
      { key: 'timeout', responseStatus: 'SENT', maxAttempts: 5 },
    ])
    expect(out).toBe('QUEUED')
  })

  it('requeues indefinitely (QUEUED) when maxAttempts is negative', () => {
    const sb = loadRH({
      responseStatus: 'ERROR',
      responseErrorMessage: 'flaky',
      connectorMessage: { getSendAttempts: () => 100 },
    })
    const out = sb.channelUtils.responseHandler([
      { key: 'flaky', responseStatus: 'SENT', maxAttempts: -1 },
    ])
    expect(out).toBe('QUEUED')
  })

  it('invokes a handler fn and uses its returned responseStatus when attempts exceed maxAttempts', () => {
    const handler = vi.fn(() => ({ responseStatus: 'SENT', result: 'handled-ok' }))
    const sb = loadRH({
      responseStatus: 'ERROR',
      responseErrorMessage: 'special case',
      connectorMessage: { getSendAttempts: () => 9 },
    })
    const out = sb.channelUtils.responseHandler([
      { key: 'special', responseStatus: 'IGNORED', maxAttempts: 2, handler },
    ])
    expect(handler).toHaveBeenCalledTimes(1)
    expect(out).toBe('SENT')
    expect(String(sb.__maps.$c.get('RESULT'))).toBe('handled-ok')
  })

  it('records debug info in $co("responseHandlerDebug")', () => {
    const sb = loadRH({
      responseStatus: 'ERROR',
      responseErrorMessage: 'connection refused',
      connectorMessage: { getSendAttempts: () => 3 },
    })
    sb.channelUtils.responseHandler([{ key: 'connection refused', responseStatus: 'SENT', maxAttempts: 0 }])
    const dbg = sb.__maps.$co.get('responseHandlerDebug')
    expect(dbg.attempts).toBe(3)
    expect(dbg.responseStatus).toBe('ERROR')
  })
})
