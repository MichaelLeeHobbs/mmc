# DBConnection / ChannelUtils — API Reference & Examples

A small family of **DB-backed building blocks** for **Mirth Connect / Rhino**, all layered on one
reusable base class:

```
DBConnection                 ← base: connection caching + statement execution + error wrapping
├── ChannelUtils             ← query Mirth's own database (local channel id, message-by-metadata)
├── PersistentMap            ← a DB-backed key/value map, reachable from any channel, with expiry
└── PersistentChannelMap     ← the same, but partitioned per channel
```

Source files:

- [`src/codeTempaltes/DB/DBConnection.js`](../src/codeTempaltes/DB/DBConnection.js)
- [`src/codeTempaltes/DB/ChannelUtils.js`](../src/codeTempaltes/DB/ChannelUtils.js)
- [`src/codeTempaltes/DB/PersistentMap.js`](../src/codeTempaltes/DB/PersistentMap.js)
- [`src/codeTempaltes/DB/PersistentChannelMap.js`](../src/codeTempaltes/DB/PersistentChannelMap.js)

Every example below is taken from, and verified against, the live code through the repo's vm test
harness (`test/dbConnection.test.js`, `test/dbChannelUtils.test.js`, `test/persistentMap.test.js`,
`test/persistentChannelMap.test.js`). Values shown in `//` comments are the actual results.

> **SQL dialect:** the queries are written for **PostgreSQL** (Mirth's own backing store and the
> default `org.postgresql.Driver`). `sqlRowsAsJSON`, `row_to_json`, `array_to_json`, `::timestamp`
> casts, and `ON CONFLICT` are Postgres features. Other drivers work for `DBConnection` itself, but
> the JSON-returning helpers on the subclasses assume Postgres.

---

## Table of contents

1. [Install order & runtime globals](#1-install-order--runtime-globals)
2. [The config object](#2-the-config-object)
3. [`DBConnection`](#3-dbconnection)
4. [`ChannelUtils`](#4-channelutils)
5. [`PersistentMap`](#5-persistentmap)
6. [`PersistentChannelMap`](#6-persistentchannelmap)
7. [Error handling](#7-error-handling)
8. [Gotchas](#8-gotchas)

---

## 1. Install order & runtime globals

These are **Code Templates** (Type: *Function*). Because the subclasses do
`Object.create(DBConnection.prototype)`, **`DBConnection` must load before** `ChannelUtils`,
`PersistentMap`, or `PersistentChannelMap`. Within one Code Template Library, order the templates so
`DBConnection` comes first (or keep it in the same library and let Mirth resolve the library at
deploy time).

The code leans on globals Mirth provides at runtime:

| Global | Used for |
| --- | --- |
| `globalMap` | caches the live JDBC connection across channels (keyed by `cacheName`) |
| `DatabaseConnectionFactory` | `createDatabaseConnection(dbClass, url, user, password)` |
| `channelName`, `channelId` | default cache key, default channel id, error prefixes |
| `$cfg(key)` | pulls a JSON config string out of the Configuration Map |
| `$t`, `$sleep` | inline try (`closeConnection`) and backoff sleep (retry path) |
| `Packages.java.util.ArrayList` | accepts a Java `ArrayList` param list as well as a JS array |
| `channelMap`, `XML`, `SerializerFactory` | only for the `ChannelUtils` index/XML statics |

---

## 2. The config object

Every class takes the same connection config (an object, or a JSON **string** — `DBConnection`
`JSON.parse`s strings and deep-copies objects so it never mutates yours):

```javascript
var config = {
  name: 'mirthdb',                               // REQUIRED — must be unique per distinct connection
  user: 'mirthdb',                               // REQUIRED
  password: 'mirthdb',                           // REQUIRED
  url: 'jdbc:postgresql://postgres:5432/mirthdb',// REQUIRED
  dbClass: 'org.postgresql.Driver',              // driver class (Postgres is the supported dialect)
  cacheConnection: true,                         // reuse the connection across calls/channels
  cacheName: undefined                           // optional override (see below)
};
```

- **Required fields** are `name`, `url`, `user`, `password`. A missing one throws
  `config.<field> is undefined!` at construction; a missing `config` entirely throws
  `config is undefined!`.
- **`cacheName`** defaults to `cachedConnection:<channelName>:<name>`. The connection is stored in
  `globalMap` under this key, so **two `DBConnection`s with the same `cacheName` share one live
  connection** — across channels. Give unrelated connections distinct `name`s (or explicit
  `cacheName`s) to avoid collisions.
- **`cacheConnection: false`** closes the connection in a `finally` after every statement.

`PersistentMap` / `PersistentChannelMap` add `expires` (days, default 30) and `initialize`
(boolean). `PersistentMap` also requires `mapName`.

---

## 3. `DBConnection`

The base class. Use it directly for ad-hoc queries, or `extend` it for your own DB helper.

### `new DBConnection(config)`

```javascript
var db = new DBConnection(config);
// or from the Configuration Map:
var db = new DBConnection($cfg('mirthDB'));   // a JSON string is parsed for you
```

### `executeDBStatement(statement, isQuery, paramList[, _retry])`

The workhorse. `isQuery` chooses the underlying Mirth call:

- `isQuery === true` → `executeCachedQuery(...)` → returns a **JDBC ResultSet**.
- `isQuery === false` → `executeUpdate(...)` → returns the **affected row count**.

`paramList` is a JS array (or a Java `ArrayList`) bound to `?` placeholders.

```javascript
// Query — returns a ResultSet you iterate with .next()/.getString(n)
var rs = db.executeDBStatement('select value from kv where key = ?', true, ['mrn']);
if (rs.next()) { var value = rs.getString(1); }

// Update/DDL — returns the row count
var rows = db.executeDBStatement('update kv set value = ? where key = ?', false, ['v', 'mrn']);
```

It transparently retries up to 10 times (with `$sleep(retry * 100)` backoff) on a fixed set of
transient JDBC errors (`I/O error`, `This connection has been closed.`,
`FATAL: sorry, too many clients already`, `FATAL: terminating connection due to administrator
command`, `The connection attempt failed.`). Any other error — or exhausting retries — is rethrown
wrapped with a denormalized statement and a channel/class prefix (see [§7](#7-error-handling)).

### `executeDBStatements(paramsArr)`

Runs an array of `[statement, isQuery, paramList]` tuples in order, returning the array of results.

```javascript
var results = db.executeDBStatements([
  ['select 1', true, []],
  ['update x set a = 1', false, []]
]);
// results === [<ResultSet>, <rowCount>]
```

### `denormalizeSQL(sql, params)`

Inlines params into a `?`-placeholder statement for logging — **strings quoted, numbers bare**. For
debugging only; never feed the result back to the DB.

```javascript
db.denormalizeSQL('select * from t where a = ? and b = ?', ['x', 5]);
// "select * from t where a = 'x' and b = 5"
```

### `sqlRowsAsJSON(sql)`

Wraps a `SELECT` so the driver returns all rows as a single JSON string in column 1. Returns
`undefined` for drivers without a wrapper (callers then fall back to the raw SQL). Only Postgres is
wrapped today:

```javascript
db.sqlRowsAsJSON('select key, value from kv');
// "select array_to_json(array_agg(t)) from (select key, value from kv) as t;"
```

### `closeConnection()`

Closes the cached connection (errors swallowed via `$t`). Called automatically in the `finally` of
`executeDBStatement` when `cacheConnection` is `false`.

### Connection caching, in one paragraph

The first statement calls `DatabaseConnectionFactory.createDatabaseConnection(...)` and stores the
connection in `globalMap[cacheName]`. Subsequent statements **reuse** it as long as
`getConnection().isClosed()` is false; if it's closed, a **fresh** connection is created to replace
it. This is why a single `cacheName` can serve many channels without re-opening sockets.

### Extending it

```javascript
function MyRepo(config) { DBConnection.call(this, config); }
MyRepo.prototype = Object.create(DBConnection.prototype);

MyRepo.prototype.countOrders = function () {
  var rs = this.executeDBStatement('select count(*) from orders', true, []);
  return rs.next() ? parseInt(rs.getString(1)) : 0;
};
```

---

## 4. `ChannelUtils`

`extends DBConnection` with conveniences for querying **Mirth's own database** — translating a
channel GUID to its internal `local_channel_id`, and pulling stored messages back out by metadata.

### `new ChannelUtils(config)`

`config` defaults to `$cfg('mirthDB')` when omitted.

```javascript
var cu = new ChannelUtils(config);          // or new ChannelUtils()  -> uses $cfg('mirthDB')
```

### `getDBID(cid[, debug])`

Resolves a channel GUID to its internal numeric id (`d_channels.local_channel_id`). `cid` defaults
to the current `channelId`. Throws if the channel isn't found.

```javascript
var id = cu.getDBID('a1b2c3d4-...');   // e.g. 42
```

### `createMetaDataIndex(metadata[, debug])`

Creates a (concurrent) index on the channel's custom-metadata table `d_mcm<dbid>` for the given
column — so `getMessageByMetadata` lookups stay fast.

```javascript
cu.createMetaDataIndex('MRN');
```

### `getMessageByMetadata(key, value, cid[, debug])`

Looks up stored messages by a custom-metadata column (`key`) and `value`, for channel `cid`. On
Postgres (via `sqlRowsAsJSON`) it returns a **parsed JSON array** of message rows; with no match it
returns `[]`. (On a non-Postgres driver it returns the raw ResultSet instead.)

```javascript
var rows = cu.getMessageByMetadata('MRN', 'M1', 'a1b2c3d4-...');
// [ { message_id: 1, metadata_id: 1, content: '<HL7…>', ... }, ... ]   or   []
```

### Static index helpers

These statics chain `new ChannelUtils($cfg(dbConfig))` and a small `globalMap`-backed name→channel
index (`ChannelUtilsIndex`) so one channel can fetch another channel's stored messages by a friendly
`name`.

| Static | Purpose |
| --- | --- |
| `ChannelUtils._updateIndex(name, cid)` | record `name → channelId` in the global `ChannelUtilsIndex` |
| `ChannelUtils.setMessageIndex(key, value, name, dbConfig)` | ensure the metadata index exists, write `key→value` to the channel map, and register this channel under `name` |
| `ChannelUtils.getMessageByIndex(key, value, name, dbConfig, options)` | resolve `name`→cid, fetch via `getMessageByMetadata`, then optionally `sort` (by `message_id`), `parseXml`, and `filter` on `ORC.1.1` |
| `ChannelUtils.getMessageByIndexV2({key, value, channelID, dbConfig, parseXml, sort, filter, debug})` | same as above but a single options object and an explicit `channelID` |

```javascript
// Producer channel (e.g. a Postprocessor): index this message under "orders"
ChannelUtils.setMessageIndex('MRN', msg['PID']['PID.3']['PID.3.1'].toString(), 'orders', 'mirthDB');

// Consumer channel: pull the matching orders back, parsed to XML, ORC.1.1 in {NW, XO}
var orders = ChannelUtils.getMessageByIndexV2({
  key: 'MRN', value: '12345', channelID: someCid, dbConfig: 'mirthDB',
  parseXml: true, sort: true, filter: ['NW', 'XO']
});
```

> `parseXml` uses `SerializerFactory.getSerializer('HL7V2').toXML(...)` and then navigates
> `order['ORC']['ORC.1']['ORC.1.1']` via E4X — so it only makes sense for stored **HL7 v2**
> content.

---

## 5. `PersistentMap`

`extends DBConnection`. A DB-backed key/value map that **survives restarts** and is reachable from
**any** channel (unlike Mirth's in-memory maps), with per-entry expiry. Each instance is bound to a
table named by `config.mapName`.

### Lifecycle

```javascript
// Deploy Script — create the table once
var pm = new PersistentMap(JSON.parse($cfg('john_doe_memorial_persistent_map')));
pm.initialize();

// Anywhere later (transformer/filter/etc.)
var $p = new PersistentMap(JSON.parse($cfg('john_doe_memorial_persistent_map')));
$p.set('lastSeenMRN', '12345');
var entry = $p.get('lastSeenMRN');   // { key: 'lastSeenMRN', value: '12345' }
```

The constructor calls `prune()` (deletes expired rows) on every instantiation, and will call
`initialize()` itself if `config.initialize === true`. It throws `config.mapName is undefined!` if
`mapName` is missing.

### Methods

| Method | Returns | Notes |
| --- | --- | --- |
| `initialize()` | — | `CREATE TABLE IF NOT EXISTS <mapName>` (+ any `config.searchColumns`) |
| `addSearchColumn(columnName)` | — | adds an indexed `varchar(64)` column for structured search |
| `set(key, value[, expires_at])` | inserted **id**, or `-1` | upsert; `expires_at` defaults to now + `expires` days |
| `set2(key, value, {expires_at, search})` | inserted **id**, or `-1` | like `set` but also writes the `search` column map |
| `get(key)` | `{key, value}` or `{}` | `{}` when the key is absent |
| `get2(key)` | the value string, or `undefined` | bare value, no JSON wrapper |
| `getAll()` | `[{key, value}, ...]` or `[]` | every row |
| `getManyBySearch(column, query)` | `[{key, value}, ...]` or `[]` | exact match on a search **column** |
| `search(query)` | `[{key, value}, ...]` or `[]` | `value ILIKE '%query%'` (can be slow on large maps) |
| `delete(key)` | — | removes one key |
| `prune()` | — | deletes rows past `expires_at` (errors swallowed) |
| `drop()` | `{areYouSure(answer)}` | guarded `DROP TABLE` — see below |

```javascript
var id = $p.set('order:42', JSON.stringify(order));   // e.g. 7
$p.get('order:42');        // { key: 'order:42', value: '{...}' }
$p.get2('order:42');       // '{...}'    (just the value)
$p.getAll();               // [ { key: 'order:42', value: '{...}' }, ... ]
$p.search('12345');        // rows whose value contains '12345'
$p.delete('order:42');
```

### Structured search columns

```javascript
// config includes "searchColumns": ["mrn"]  ->  initialize() adds + indexes the column
$p.set2('order:42', JSON.stringify(order), { search: { mrn: '12345' } });
$p.getManyBySearch('mrn', '12345');   // [ { key: 'order:42', value: '{...}' } ]
```

### Dropping the table (guarded)

`drop()` returns an object whose `areYouSure(answer)` only executes the `DROP TABLE` when `answer`
is the literal string `'YES'`; anything else throws.

```javascript
$p.drop().areYouSure('YES');   // drops the table
$p.drop().areYouSure('no');    // throws: ...drop().areYouSure(answer) - expected answer === "YES" found "no"
```

---

## 6. `PersistentChannelMap`

`extends DBConnection`. Same idea as `PersistentMap`, but **one shared table**
(`persistent_channel_map`) **partitioned by `channel_name`** — so every channel gets its own
namespace within the same table. `config` defaults to `JSON.parse($cfg('persistent_channel_map'))`.

Every read/write `prune()`s first, and `channel_name` defaults to the current `channelName` (pass it
explicitly to reach another channel's partition).

```javascript
// Deploy Script
var pcm = new PersistentChannelMap(JSON.parse($cfg('persistent_channel_map')));
pcm.initialize();   // creates the shared table + indexes

// In a channel
var $pc = new PersistentChannelMap(JSON.parse($cfg('persistent_channel_map')));
$pc.set('lastAck', '12345');               // stored under this channel's name
$pc.get('lastAck');                        // { key: 'lastAck', value: '12345' }
$pc.get('lastAck', 'Some Other Channel');  // read another channel's partition
$pc.search('123');                         // value ILIKE '%123%' within this channel
$pc.delete('lastAck');                     // returns the deleted id, or -1
```

| Method | Returns |
| --- | --- |
| `initialize()` | — (creates `persistent_channel_map` + two indexes, then prunes) |
| `set(key, value[, channel_name][, expires_at])` | inserted id, or `-1` |
| `get(key[, channel_name])` | `{key, value}` or `{}` |
| `search(query[, channel_name])` | `[{key, value}, ...]` or `[]` |
| `delete(key[, channel_name])` | deleted id, or `-1` |
| `prune()` | — |
| `drop().areYouSure('YES')` | drops the indexes + shared table (guarded as above) |

---

## 7. Error handling

`DBConnection` builds rich errors via `errorPrefix(func, msg, error)`, which **returns** an `Error`
whose message is prefixed `"<channelName>: <ClassName>.<func> - <msg>"` followed by the original
error and stack. `throwError(...)` is the throwing counterpart.

```javascript
// inside a subclass method
this.throwError('countOrders', 'query failed', e);
// throws Error: "TestChannel: MyRepo.countOrders - query failed\n<orig message>\n<stack>"
```

When `executeDBStatement` rethrows a non-transient failure, the wrapped message includes the
**denormalized** statement (params inlined) plus the connection `name`, so logs show exactly what ran:

```
TestChannel: DBConnection.executeDBStatement - statement: select 'x', isQuery: true on "mirthdb"
boom
<stack>
```

---

## 8. Gotchas

- **Postgres-specific.** The JSON helpers (`get`, `getAll`, `search`, `getMessageByMetadata`, …)
  rely on `row_to_json` / `array_to_json` and `sqlRowsAsJSON`, which only wrap
  `org.postgresql.Driver`. On other drivers those methods won't return parsed JSON.
- **`get` returns `{}`, not `undefined`, on a miss.** Check `Object.keys(result).length` or
  `result.value`, not `result === undefined`. (`get2` does return `undefined`.)
- **Shared connections via `cacheName`.** Distinct logical connections need distinct `name`s (or
  explicit `cacheName`s); otherwise they share one live JDBC connection through `globalMap`.
- **`search(query)` is `ILIKE '%query%'` with the query inlined** into the SQL string (not a bound
  param) — keep it to trusted/internal values and expect full scans on large maps.
- **Load order matters.** `DBConnection` must be evaluated before the subclasses, or
  `Object.create(DBConnection.prototype)` fails at template-load time.
- **`initialize()` is required once** (or `config.initialize: true`) before reads/writes — the
  constructor's `prune()` deliberately swallows the "table doesn't exist yet" error so first-boot
  ordering is forgiving.
