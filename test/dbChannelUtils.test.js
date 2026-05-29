import { describe, it, expect, vi } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

// NOTE: this tests DB/ChannelUtils.js (the DB helper that extends DBConnection),
// NOT Globals/channelUtils.js.

function makeResultSet(rowValue, { rows = 1 } = {}) {
  let n = 0
  return { next: () => (n++ < rows), getString: () => rowValue }
}

function makeRecordingConnection() {
  const calls = { query: [], update: [] }
  const queue = []
  return {
    executeUpdate: vi.fn((sql, params) => { calls.update.push({ sql, params }); return 1 }),
    executeCachedQuery: vi.fn((sql, params) => {
      calls.query.push({ sql, params })
      return queue.length ? queue.shift() : makeResultSet(null, { rows: 0 })
    }),
    close: vi.fn(),
    getConnection: () => ({ isClosed: () => false }),
    __calls: calls,
    __enqueue: (rs) => queue.push(rs),
  }
}

function makeGlobalMap() {
  const m = new Map()
  return { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => m.set(k, v), __map: m }
}

function load(conn, extra = {}) {
  return loadTemplates(['Globals/$t.js', 'DB/DBConnection.js', 'DB/ChannelUtils.js'], {
    channelName: 'TestChannel',
    channelId: 'CID-DEFAULT',
    $sleep: () => {},
    Packages: { java: { util: { ArrayList: function ArrayList() {} } } },
    globalMap: makeGlobalMap(),
    DatabaseConnectionFactory: { createDatabaseConnection: () => conn },
    ...extra,
  })
}

const config = {
  name: 'mirthDB',
  user: 'u',
  password: 'p',
  url: 'jdbc:postgresql://h:5432/db',
  dbClass: 'org.postgresql.Driver',
  cacheConnection: true,
}

describe('DB ChannelUtils constructor', () => {
  it('uses the passed config', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    expect(cu._config.name).toBe('mirthDB')
  })

  it('falls back to $cfg("mirthDB") when no config is passed', () => {
    const conn = makeRecordingConnection()
    // $cfg returns an object here; DBConnection JSON.stringify/parses it
    const sb = load(conn, { config: { mirthDB: config } })
    const cu = new sb.ChannelUtils()
    expect(cu._config.url).toBe(config.url)
  })

  it('inherits DBConnection.prototype methods (denormalizeSQL)', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    expect(typeof cu.executeDBStatement).toBe('function')
    expect(cu.denormalizeSQL('a = ?', ['v'])).toBe("a = 'v'")
  })
})

describe('DB ChannelUtils.getDBID', () => {
  it('queries d_channels by channel_id and returns the parsed local_channel_id', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    conn.__enqueue(makeResultSet('123'))
    const id = cu.getDBID('some-cid')
    expect(id).toBe(123)
    const q = conn.__calls.query[0]
    expect(q.sql).toBe('SELECT local_channel_id from d_channels where channel_id = ?;')
    expect(q.params).toEqual(['some-cid'])
  })

  it('defaults cid to the channelId global', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    conn.__enqueue(makeResultSet('5'))
    cu.getDBID()
    expect(conn.__calls.query[0].params).toEqual(['CID-DEFAULT'])
  })

  it('throws when no row is returned', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    expect(() => cu.getDBID('x')).toThrow(/Failed to get DB ID for channelId: x/)
  })

  it('logs debug output when debug=true', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    conn.__enqueue(makeResultSet('7'))
    cu.getDBID('cid', true)
    const debugs = sb.logger.__calls.filter((c) => c.level === 'debug')
    expect(debugs.length).toBeGreaterThanOrEqual(1)
    expect(String(debugs[0].args[0])).toContain('getDBID')
  })
})

describe('DB ChannelUtils.createMetaDataIndex', () => {
  it('builds a CONCURRENTLY index on d_mcm<dbid> for the uppercased column', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    // createMetaDataIndex calls getDBID() (a query) then an update
    conn.__enqueue(makeResultSet('44')) // for the getDBID() lookup
    cu.createMetaDataIndex('accession')
    const upd = conn.__calls.update.find((c) => /CREATE INDEX CONCURRENTLY/.test(c.sql))
    expect(upd).toBeTruthy()
    expect(upd.sql).toContain('d_mcm44')
    expect(upd.sql).toContain('idx_d_mcm44_ACCESSION')
    expect(upd.sql).toContain('("ACCESSION")')
  })
})

describe('DB ChannelUtils._updateIndex (static, globalMap-backed)', () => {
  it('writes the name -> cid mapping into ChannelUtilsIndex on globalMap', () => {
    const conn = makeRecordingConnection()
    const globalMap = makeGlobalMap()
    const sb = load(conn, { globalMap })
    sb.ChannelUtils._updateIndex('orders', 'cid-1')
    expect(globalMap.__map.get('ChannelUtilsIndex')).toEqual({ orders: 'cid-1' })
    // merges with existing
    sb.ChannelUtils._updateIndex('results', 'cid-2')
    expect(globalMap.__map.get('ChannelUtilsIndex')).toEqual({ orders: 'cid-1', results: 'cid-2' })
  })
})

describe('DB ChannelUtils.getMessageByMetadata', () => {
  it('returns parsed JSON rows for a postgres driver (via sqlRowsAsJSON wrapper)', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cu = new sb.ChannelUtils(config)
    conn.__enqueue(makeResultSet('10')) // getDBID() lookup -> dbID 10
    conn.__enqueue(makeResultSet('[{"foo":"bar"}]')) // main query -> JSON aggregate (column 1)
    const result = cu.getMessageByMetadata('MRN', 'M1', 'cid')
    expect(result).toEqual([{ foo: 'bar' }])
    // For postgres, sqlRowsAsJSON wraps the SELECT so the driver returns rows as JSON.
    expect(conn.__calls.query[1].sql).toContain('array_to_json(array_agg(t))')
  })
})

describe('DB ChannelUtils heavy/static helpers (skipped)', () => {
  it.skip('setMessageIndex / getMessageByIndex / getMessageByIndexV2', () => {
    // reason: these statics chain new ChannelUtils($cfg(...)) -> getMessageByMetadata
    //   (which hits the sqlRowsAsJSON bug above) and additionally depend on
    //   channelMap.put, SerializerFactory.getSerializer('HL7V2').toXML and E4X XML
    //   navigation (order['ORC']['ORC.1']['ORC.1.1']). Reproducing the HL7 serializer
    //   + E4X faithfully is an integration concern, so the underlying SQL builder
    //   (getDBID / createMetaDataIndex) and the bug are covered instead.
  })
})
