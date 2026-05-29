import { describe, it, expect, vi } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

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
  return { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => m.set(k, v) }
}

function load(conn, extra = {}) {
  return loadTemplates(['Globals/$t.js', 'DB/DBConnection.js', 'DB/PersistentChannelMap.js'], {
    channelName: 'TestChannel',
    $sleep: () => {},
    Packages: { java: { util: { ArrayList: function ArrayList() {} } } },
    globalMap: makeGlobalMap(),
    DatabaseConnectionFactory: { createDatabaseConnection: () => conn },
    ...extra,
  })
}

const config = {
  name: 'mirthdb',
  user: 'u',
  password: 'p',
  url: 'jdbc:postgresql://h:5432/db',
  dbClass: 'org.postgresql.Driver',
  cacheConnection: true,
  expires: 10,
}

describe('PersistentChannelMap constructor', () => {
  it('uses the passed config and sets _expires', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    expect(m._expires).toBe(10)
  })

  it('defaults _expires to 30', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap({ ...config, expires: undefined })
    expect(m._expires).toBe(30)
  })

  it('falls back to $cfg("persistent_channel_map") when no config is given', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn, { config: { persistent_channel_map: JSON.stringify(config) } })
    const m = new sb.PersistentChannelMap()
    expect(m._config.name).toBe('mirthdb')
  })
})

describe('PersistentChannelMap.initialize', () => {
  it('creates the shared persistent_channel_map table + indexes and prunes', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.update.length = 0
    m.initialize()
    const create = conn.__calls.update.find((c) => /CREATE TABLE IF NOT EXISTS persistent_channel_map/.test(c.sql))
    expect(create).toBeTruthy()
    expect(create.sql).toContain('unique_persistent_channel_map_channel_name_key unique(channel_name, key)')
    expect(conn.__calls.update.some((c) => /CREATE INDEX IF NOT EXISTS idx_channel_name_key/.test(c.sql))).toBe(true)
    expect(conn.__calls.update.some((c) => /CREATE INDEX IF NOT EXISTS idx_value/.test(c.sql))).toBe(true)
    // prune() at the end
    expect(conn.__calls.update.some((c) => /DELETE FROM persistent_channel_map\n\s*WHERE expires_at/.test(c.sql))).toBe(true)
  })
})

describe('PersistentChannelMap.set', () => {
  it('upserts with channel_name defaulting to channelName and binds 5 params', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('42'))
    const id = m.set('k', 'v')
    expect(id).toBe(42)
    const q = conn.__calls.query[0]
    expect(q.sql).toContain('INSERT INTO persistent_channel_map (channel_name, key, value, updated_at, expires_at)')
    expect(q.sql).toContain('ON CONFLICT ON CONSTRAINT unique_persistent_channel_map_channel_name_key DO UPDATE')
    // params: [channel_name, key, value, updated_at, expires_at]
    expect(q.params[0]).toBe('TestChannel')
    expect(q.params[1]).toBe('k')
    expect(q.params[2]).toBe('v')
    expect(q.params).toHaveLength(5)
  })

  it('honors an explicit channel_name', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('1'))
    m.set('k', 'v', 'OtherChannel')
    expect(conn.__calls.query[0].params[0]).toBe('OtherChannel')
  })

  it('prunes before setting', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.update.length = 0
    conn.__enqueue(makeResultSet('1'))
    m.set('k', 'v')
    expect(conn.__calls.update.some((c) => /DELETE FROM persistent_channel_map/.test(c.sql))).toBe(true)
  })
})

describe('PersistentChannelMap.get', () => {
  it('selects by channel_name + key and parses row_to_json', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet(JSON.stringify({ key: 'k', value: 'v' })))
    const out = m.get('k')
    expect(out).toEqual({ key: 'k', value: 'v' })
    const q = conn.__calls.query[0]
    expect(q.sql).toContain('where channel_name = ? and key = ?')
    expect(q.params).toEqual(['TestChannel', 'k'])
  })

  it('returns {} when there is no row', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    expect(m.get('k')).toEqual({})
  })
})

describe('PersistentChannelMap.delete', () => {
  it('deletes by channel_name + key and returns the deleted id', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('9'))
    const id = m.delete('k')
    expect(id).toBe(9)
    const q = conn.__calls.query[0]
    expect(q.sql).toContain('DELETE FROM persistent_channel_map')
    expect(q.sql).toContain('WHERE channel_name = ? and key = ?')
    expect(q.params).toEqual(['TestChannel', 'k'])
  })

  it('returns -1 when nothing was deleted', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    expect(m.delete('k')).toBe(-1)
  })
})

describe('PersistentChannelMap.search', () => {
  it('builds an ilike search scoped to the channel and parses json_agg', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const m = new sb.PersistentChannelMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet(JSON.stringify([{ key: 'a' }])))
    const out = m.search('needle')
    expect(out).toEqual([{ key: 'a' }])
    const q = conn.__calls.query[0]
    expect(q.sql).toContain("value ilike '%needle%'")
    expect(q.params).toEqual(['TestChannel'])
  })
})
