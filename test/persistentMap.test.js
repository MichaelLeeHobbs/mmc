import { describe, it, expect, vi } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

// A JDBC-ResultSet-like object: next() returns true once (one row) then false;
// getString(col) returns the configured row value.
function makeResultSet(rowValue, { rows = 1 } = {}) {
  let n = 0
  return {
    next: () => (n++ < rows),
    getString: () => rowValue,
  }
}

// A fake DB connection that records every SQL + params and returns a queued
// resultSet for queries (executeCachedQuery) or a sentinel for updates.
function makeRecordingConnection() {
  const calls = { query: [], update: [] }
  const queue = []
  const conn = {
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
  return conn
}

function makeGlobalMap() {
  const m = new Map()
  return { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => m.set(k, v) }
}

// Load DBConnection first (declares the base) then PersistentMap.
function load(conn) {
  return loadTemplates(['Globals/$t.js', 'DB/DBConnection.js', 'DB/PersistentMap.js'], {
    channelName: 'TestChannel',
    $sleep: () => {},
    Packages: { java: { util: { ArrayList: function ArrayList() {} } } },
    globalMap: makeGlobalMap(),
    DatabaseConnectionFactory: { createDatabaseConnection: () => conn },
  })
}

const config = {
  mapName: 'my_map',
  name: 'mirthdb',
  user: 'u',
  password: 'p',
  url: 'jdbc:postgresql://h:5432/db',
  dbClass: 'org.postgresql.Driver',
  cacheConnection: true,
  expires: 15,
}

describe('PersistentMap constructor', () => {
  it('sets _mapName and _expires and prunes on construction', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    expect(pm._mapName).toBe('my_map')
    expect(pm._expires).toBe(15)
    // constructor calls prune() -> a DELETE ... expires_at < NOW()
    expect(conn.__calls.update.some((c) => /DELETE FROM my_map WHERE expires_at/.test(c.sql))).toBe(true)
  })

  it('defaults _expires to 30 when not provided', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap({ ...config, expires: undefined })
    expect(pm._expires).toBe(30)
  })

  it('throws when mapName is missing (BUG: via getErrorPrefix TypeError, not the intended message)', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const cfg = { ...config }
    delete cfg.mapName
    // BUG: the guard calls `this.getErrorPrefix(...)` which does NOT exist on
    // DBConnection (the real method is `errorPrefix`). So instead of throwing
    // "... config.mapName is undefined!", it throws a TypeError. We still get a
    // throw, documenting the latent bug.
    expect(() => new sb.PersistentMap(cfg)).toThrow(/getErrorPrefix is not a function/)
  })
})

describe('PersistentMap.initialize', () => {
  it('issues CREATE TABLE IF NOT EXISTS with the map name and unique constraint', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.update.length = 0
    pm.initialize()
    const create = conn.__calls.update.find((c) => /CREATE TABLE IF NOT EXISTS my_map/.test(c.sql))
    expect(create).toBeTruthy()
    expect(create.sql).toContain('my_map_key_unique UNIQUE(key)')
  })

  it('adds search columns when config.searchColumns is set', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap({ ...config, searchColumns: ['mrn'] })
    conn.__calls.update.length = 0
    pm.initialize()
    expect(conn.__calls.update.some((c) => /ALTER TABLE my_map ADD COLUMN IF NOT EXISTS mrn/.test(c.sql))).toBe(true)
    expect(conn.__calls.update.some((c) => /CREATE INDEX IF NOT EXISTS idx_my_map_mrn/.test(c.sql))).toBe(true)
  })
})

describe('PersistentMap.set', () => {
  it('builds an upsert with returning id and binds key/value/timestamps; returns the new id', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('77'))

    const id = pm.set('k1', 'v1')
    expect(id).toBe(77)
    const q = conn.__calls.query[0]
    expect(q.sql).toContain('INSERT INTO my_map (key, value, updated_at, expires_at)')
    expect(q.sql).toContain('ON CONFLICT ON CONSTRAINT my_map_key_unique DO UPDATE')
    expect(q.sql).toContain('returning id;')
    // params: [key, value, updated_at, expires_at]
    expect(q.params[0]).toBe('k1')
    expect(q.params[1]).toBe('v1')
    expect(q.params).toHaveLength(4)
  })

  it('returns -1 when the resultSet has no row', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    expect(pm.set('k', 'v')).toBe(-1)
  })

  it('coerces a non-string key to a string', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('1'))
    pm.set(12345, 'v')
    expect(conn.__calls.query[0].params[0]).toBe('12345')
  })
})

describe('PersistentMap.set2', () => {
  it('appends search columns/values to the upsert', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('5'))

    const id = pm.set2('k', 'v', { search: { mrn: 'M1', acc: 'A1' } })
    expect(id).toBe(5)
    const q = conn.__calls.query[0]
    expect(q.sql).toContain('INSERT INTO my_map (key, value, updated_at, expires_at, mrn, acc)')
    // params: [key, value, updated_at, expires_at, mrn, acc]
    expect(q.params).toHaveLength(6)
    expect(q.params[4]).toBe('M1')
    expect(q.params[5]).toBe('A1')
  })
})

describe('PersistentMap.get / get2 / getAll', () => {
  it('get returns the parsed row_to_json object', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet(JSON.stringify({ key: 'k', value: 'v' })))
    const out = pm.get('k')
    expect(out).toEqual({ key: 'k', value: 'v' })
    expect(conn.__calls.query[0].sql).toContain('select row_to_json(t)')
    expect(conn.__calls.query[0].params).toEqual(['k'])
  })

  it('get returns {} when there is no row', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    expect(pm.get('missing')).toEqual({})
  })

  it('get2 returns the raw value string', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet('rawval'))
    expect(pm.get2('k')).toBe('rawval')
    expect(conn.__calls.query[0].sql).toContain('select value from my_map where key = ?')
  })

  it('get2 returns undefined when there is no row', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    expect(pm.get2('k')).toBeUndefined()
  })

  it('getAll returns the parsed array_to_json array', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__enqueue(makeResultSet(JSON.stringify([{ key: 'a' }, { key: 'b' }])))
    expect(pm.getAll()).toEqual([{ key: 'a' }, { key: 'b' }])
  })
})

describe('PersistentMap.delete / drop', () => {
  it('delete issues a parameterized DELETE by key', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.query.length = 0
    conn.__enqueue(makeResultSet(null, { rows: 0 }))
    pm.delete('k')
    expect(conn.__calls.query[0].sql).toBe('DELETE FROM my_map WHERE key = ?;')
    expect(conn.__calls.query[0].params).toEqual(['k'])
  })

  it('drop().areYouSure requires the literal "YES"', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    // BUG: drop() references this.getErrorPrefix which is undefined on DBConnection,
    // so the wrong-answer branch throws a TypeError (not the intended message).
    expect(() => pm.drop().areYouSure('no')).toThrow()
  })

  it('drop().areYouSure("YES") issues DROP TABLE', () => {
    const conn = makeRecordingConnection()
    const sb = load(conn)
    const pm = new sb.PersistentMap(config)
    conn.__calls.update.length = 0
    pm.drop().areYouSure('YES')
    expect(conn.__calls.update.some((c) => /DROP TABLE IF EXISTS my_map;/.test(c.sql))).toBe(true)
  })
})
