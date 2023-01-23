/**
 * PersistentMap extends DBConnection and is a DB backed persistent map and can be accessed from anywhere/anytime unlike most Mirth Connect maps.
 *
 * Author: Michael Lee Hobbs
 * LICENSE: GNU GENERAL PUBLIC LICENSE - https://www.gnu.org/licenses/gpl-3.0.html
 * History:
 * - 20201226 - Initial Release
 * - 20230123 - Minor clean up
 *
 * example config:
 * {
 *   "mapName": "john_doe_memorial_persistent_map",
 *   "name": "mirthdb",
 *   "user": "mirthdb",
 *   "password": "mirthdb",
 *   "url": "jdbc:postgresql://postgres:5432/mirthdb",
 *   "dbClass": "org.postgresql.Driver",
 *   "cacheConnection": true,
 *   "expires": 15
 * }
 *
 * Usage Example:
 * ### Start of Example ###
 * # Deploy Script
 * var persistentMap = new PersistentMap(JSON.parse($cfg('joe_doe_memorial_persistent_map')))
 * persistentMap.initialize()
 * return;
 *
 * # Transformer Script Source:
 * var $p = new PersistentMap(JSON.parse($cfg('john_doe_memorial_persistent_map')))
 * var type = msg['V_ALLDATA']['V_OBSERVATIONREPORT']['DOCUMENT_FILEKIND']
 * var id = msg['V_ALLDATA']['V_CUSTOM']['RECORDID']
 * $p.set(id  + ':' + type, msg['V_ALLDATA']['V_OBSERVATIONREPORT']['BUFFERCONTENT'])
 *
 * const txt = $p.get(id  + ':TXT').value
 * const pdf = $p.get(id  + ':PDF').value
 *
 * if (!txt || !pdf) return destinationSet.removeAll()
 * ### End of Example ###
 *
 * @param config: {mapName, name, user, password, url, dbClass, cacheConnection, expires, initialize}
 * @param config.mapName: mapName name
 * @param config.name: a db connection name must be unique or will cause issues
 * @param config.user: user name to use for db connection
 * @param config.password: db user password
 * @param config.url: db url
 * @param config.dbClass: db class
 * @param config.cacheConnection: Should cache the connection? true/false
 * @param config.expires: optional integer, defaults to 30, number of days entry will expire in and be deleted after last update - this can be set per channel
 * @param config.initialize: optional boolean, if true will call PersistentMap.initialize()
 * @constructor
 */
function PersistentMap(config) {
    DBConnection.call(this, config)
    this._expires = Number.parseInt(config.expires) || 30
    if (!config.mapName) throw new Error(this.getErrorPrefix('constructor(config)') + ' - config.mapName is undefined!')
    this._mapName = String(config.mapName)
    if (config.initialize) this.initialize()
    this.prune()
}

PersistentMap.prototype = Object.create(DBConnection.prototype)

/**
 * Initializes the DB with table for a PersistentMap. This is called by the constructor if config.initialize === true
 */
PersistentMap.prototype.initialize = function () {
    this.executeDBStatement([
            "CREATE TABLE IF NOT EXISTS " + this._mapName,
            "(",
            "  id SERIAL PRIMARY KEY,",
            "  key varchar(64) not null,",
            "  value text,",
            "  created_at timestamp with time zone DEFAULT now(),",
            "  updated_at timestamp with time zone DEFAULT now(),",
            "  expires_at timestamp with time zone,",
            "  CONSTRAINT " + this._mapName + "_key_unique UNIQUE(key)",
            ");",
        ].join('\n'),
        false,
        null
    )
    if (this._config.searchColumns) {
        this._config.searchColumns.forEach(column => this.addSearchColumn(column))
    }
}

/**
 * Add a column to the table for searching
 * @param {string} columnName
 */
PersistentMap.prototype.addSearchColumn = function (columnName) {
    const sql = "ALTER TABLE " + this._mapName + " ADD COLUMN IF NOT EXISTS " + columnName + " varchar(64);"
    this.executeDBStatement(sql, false, null)
    const indexName = 'idx_' + this._mapName + '_' + columnName
    const sqlIndex = "CREATE INDEX IF NOT EXISTS " + indexName + " ON " + this._mapName + " (" + columnName + ");"
    this.executeDBStatement(sqlIndex, false, null)
}

/**
 * Drops table/indexes for PersistentMap. To execute a drop you must call the drop function like so: PersistentMap.drop().areYouSure('YES')
 * @returns {{areYouSure: function}}
 */
PersistentMap.prototype.drop = function () {
    return {
        areYouSure: function (answer) {
            if (answer !== 'YES') throw new Error(this.getErrorPrefix('drop().areYouSure(answer)') + ' - expected answer === "YES" found "' + answer + '"')
            this.executeDBStatement("DROP TABLE IF EXISTS " + this._mapName + ";", false)
        }.bind(this)
    }
}

/**
 * Sets a key to value and will overwrite an existing key/value pair
 * @param {string} key - the key to set
 * @param {*} value - the value to set the key to
 * @param {Date} expires_at - optional ISO timestamp, defaults to now + PersistentMap.expires days
 * @returns {number} the id of the inserted value or -1 if there insert/update failure
 */
PersistentMap.prototype.set = function (key, value, expires_at) {
    key = String(key)
    var updated_at = (new Date()).toISOString()
    if (!expires_at) {
        expires_at = new Date()
        expires_at = (new Date(expires_at.setDate(expires_at.getDate() + this._expires))).toISOString()
    }

    const sqlStmnt = [
        "INSERT INTO " + this._mapName + " (key, value, updated_at, expires_at)",
        "VALUES (?, ?, ?::timestamp, ?::timestamp)",
        "ON CONFLICT ON CONSTRAINT " + this._mapName + "_key_unique DO UPDATE",
        "SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, expires_at = EXCLUDED.expires_at",
        "returning id;",
    ].join('\n')
    const resultSet = this.executeDBStatement(sqlStmnt, true, [key, value, updated_at, expires_at])
    return (resultSet.next()) ? Number.parseInt(resultSet.getString(1)) : -1
}
/**
 * Sets a key to value and will overwrite an existing key/value pair
 * @param {string} key
 * @param {*} value
 * @param {{expires_at: Date, search: Object}} options
 * @returns {number|number} the id of the inserted value or -1 if there insert/update failure
 */
PersistentMap.prototype.set2 = function (key, value, options) {
    key = String(key)
    var {expires_at, search} = options
    var updated_at = (new Date()).toISOString()
    if (!expires_at) {
        expires_at = new Date()
        expires_at = (new Date(expires_at.setDate(expires_at.getDate() + this._expires))).toISOString()
    }

    const columns = ['key', 'value', 'updated_at', 'expires_at']
    const values = [key, value, updated_at, expires_at]
    const sqlValues = ['?', '?', '?::timestamp', '?::timestamp']
    Object.keys(search).forEach(key => {
        columns.push(key)
        values.push(search[key])
        sqlValues.push('?')
    })

    const sqlStmnt = [
        "INSERT INTO " + this._mapName + " (" + columns.join(', ') + ")",
        "VALUES (" + sqlValues.join(', ') + ")",
        "ON CONFLICT ON CONSTRAINT " + this._mapName + "_key_unique DO UPDATE",
        "SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, expires_at = EXCLUDED.expires_at",
        "returning id;",
    ].join('\n')
    const resultSet = this.executeDBStatement(sqlStmnt, true, values)
    return (resultSet.next()) ? Number.parseInt(resultSet.getString(1)) : -1
}

/**
 * Returns a key, value pair
 * @param key - the key/value pair to return
 * @returns {object|undefined} {key, value} or undefined if key does not exist
 */
PersistentMap.prototype.get = function (key) {
    key = String(key)
    const sqlStmnt = 'select row_to_json(t) from (select key, value from ' + this._mapName + ' where key = ?) as t;'
    const resultSet = this.executeDBStatement(sqlStmnt, true, [key])
    return (resultSet.next()) ? JSON.parse(resultSet.getString(1)) : {}
}

/**
 * Returns all key, value pairs
 * @returns {any|*[]}
 */
PersistentMap.prototype.getAll = function () {
    const sqlStmnt = 'select array_to_json(array_agg(t)) from (select key, value from ' + this._mapName + ') as t;'
    const resultSet = this.executeDBStatement(sqlStmnt, true, [])
    return (resultSet.next()) ? JSON.parse(resultSet.getString(1)) : []
}

/**
 * Returns a key, value pair
 * @param {string} key
 * @returns {*|undefined}
 */
PersistentMap.prototype.get2 = function (key) {
    key = String(key)
    const sqlStmnt = 'select value from ' + this._mapName + ' where key = ?;'
    const resultSet = this.executeDBStatement(sqlStmnt, true, [key])
    return (resultSet.next()) ? resultSet.getString(1) : undefined
}

/**
 * Returns many key, value pairs
 * @param {string} key
 * @param {string} query
 * @returns {any|*[]}
 */
PersistentMap.prototype.getManyBySearch = function (key, query) {
    key = String(key)
    query = String(query)
    const sqlStmnt = 'select array_to_json(array_agg(t)) from (select key, value from ' + this._mapName + ' where ' + key + ' = ?) as t;'
    const resultSet = this.executeDBStatement(sqlStmnt, true, [query])
    return (resultSet.next()) ? JSON.parse(resultSet.getString(1)) : []
}

/**
 * Returns an array of key, value pairs where value ilike %query%
 * Can be slow once map grows to a large size or does not have a reasonable expires
 * @param {string} query - text to search for in values
 * @returns {Array}
 */
PersistentMap.prototype.search = function (query) {
    const sqlStmnt = "select json_agg(t) from (select key, value from " + this._mapName + " where value ilike '%" + query + "%') as t;"
    const resultSet = this.executeDBStatement(sqlStmnt, true)
    return (resultSet.next()) ? JSON.parse(resultSet.getString(1)) : []
}

/**
 * Deletes a key/value pair
 * @param {string} key - the key to delete
 */
PersistentMap.prototype.delete = function (key) {
    key = String(key)
    const sqlStmnt = "DELETE FROM " + this._mapName + " WHERE key = ?;"
    this.executeDBStatement(sqlStmnt, true, [key])
}

/**
 * Prunes any key/value pair where the expires_at is less than NOW()
 */
PersistentMap.prototype.prune = function () {
    const sqlStmnt = "DELETE FROM " + this._mapName + " WHERE expires_at is not null and expires_at < NOW();"
    try {
        this.executeDBStatement(sqlStmnt, false)
    } catch (e) {
        // it's possible prune could fail when called from the constructor and initialize has not yet been called
    }
}
