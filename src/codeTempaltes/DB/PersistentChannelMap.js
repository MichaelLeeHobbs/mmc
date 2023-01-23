/**
 * PersistentChannelMap extends DBConnection and is a DB backed ChannelMap that persistent through restarts and can be accessed from anywhere/anytime.
 * @param config: {name, user, password, url, dbClass, expires, initialize} - defaults to $cfg('persistent_channel_map')
 * @param config.name: a db connection name must be unique or will cause issues
 * @param config.user: user name to use for db connection
 * @param config.password: db user password
 * @param config.url: db url
 * @param config.dbClass: db class
 * @param config.expires: optional integer, defaults to 30, number of days entry will expire in and be deleted after last update - this can be set per channel
 * @param config.initialize: optional boolean, if true will call PersistentChannelMap.initialize()
 * @constructor
 */
function PersistentChannelMap(config) {
    config = config || JSON.parse($cfg('persistent_channel_map'))
    DBConnection.call(this, config)
    this._expires = Number.parseInt(config.expires) || 30
    if (config.initialize) this.initialize()
}

PersistentChannelMap.prototype = Object.create(DBConnection.prototype)

/**
 * Initializes the DB with tables and indexes needed by PersistentChannelMap. This is called by the constructor if config.initialize === true
 */
PersistentChannelMap.prototype.initialize = function () {
    this.executeDBStatement([
            "CREATE TABLE IF NOT EXISTS persistent_channel_map",
            "(",
            "  id SERIAL PRIMARY KEY,",
            "  channel_name varchar(64) not null,",              // channelName max length is 40 but going with 64 for a little future proofing
            "  key varchar(64) not null,",
            "  value text,",
            "  created_at timestamp with time zone DEFAULT now(),",
            "  updated_at timestamp with time zone DEFAULT now(),",
            "  expires_at timestamp with time zone,",
            "  constraint unique_persistent_channel_map_channel_name_key unique(channel_name, key)",
            ");",
        ].join('\n'),
        false,
        null
    )

    this._indexes = [
        ["idx_persistent_channel_map_channel_name_key", "CREATE INDEX IF NOT EXISTS idx_channel_name_key ON persistent_channel_map (channel_name, key);"],
        ["idx_persistent_channel_map_value",            "CREATE INDEX IF NOT EXISTS idx_value            ON persistent_channel_map USING gin (to_tsvector('english', value));"],
    ]
    this._indexes.map(index => this.executeDBStatement(index[1], false, null))
    this.prune()
}

/**
 * Drops table/indexes for PersistentChannelMap. To execute a drop you must call the drop function like so: persistentChannelMap.drop().areYouSure('YES')
 * @returns {{areYouSure: areYouSure}}
 */
PersistentChannelMap.prototype.drop = function () {
    return {
        areYouSure: function (answer) {
            if (answer !== 'YES') throw new Error(this.getErrorPrefix('drop().areYouSure(answer)') + ' - expected answer === "YES" found "' + answer + '"')
            this._indexes.forEach(index => this.executeDBStatement("DROP INDEX IF EXISTS " + index[0] + ";", false))
            this.executeDBStatement("DROP TABLE IF EXISTS persistent_channel_map;", false)
        }.bind(this)
    }
}

/**
 * Returns a key, value pair
 * @param key - the key/value pair to return
 * @param channel_name - optional, defaults to channelName
 * @returns {object|undefined} {key, value} or undefined if key does not exist
 */
PersistentChannelMap.prototype.get = function (key, channel_name) {
    channel_name = channel_name || channelName
    this.prune()
    var sqlStmnt = 'select row_to_json(t) from (select key, value from persistent_channel_map where channel_name = ? and key = ?) as t;'
    var resultSet = this.executeDBStatement(sqlStmnt, true, [channel_name, key])
    return (resultSet.next()) ? JSON.parse(resultSet.getString(1)) : {}
}

/**
 * Returns an array of key, value pairs where value ilike %query%
 * @param query - text to search for in values
 * @param channel_name - optional, defaults to channelName
 * @returns {Array}
 */
PersistentChannelMap.prototype.search = function (query, channel_name) {
    channel_name = channel_name || channelName
    this.prune()
    var sqlStmnt = "select json_agg(t) from (select key, value from persistent_channel_map where channel_name = ? and value ilike '%" + query + "%') as t;"
    var resultSet = this.executeDBStatement(sqlStmnt, true, [channel_name])
    return (resultSet.next()) ? JSON.parse(resultSet.getString(1)) : []
}

/**
 * Sets a key to value and will overwrite an existing key/value pair
 * @param key - the key to set
 * @param value - the value to set the key to
 * @param channel_name - optional channel_name, defaults to channelName
 * @param expires_at - optional ISO timestamp, defaults to now + PersistentChannelMap.expires days
 * @returns {number} the id of the inserted value or -1 if there insert/update failure
 */
PersistentChannelMap.prototype.set = function (key, value, channel_name, expires_at) {
    channel_name = channel_name || channelName
    this.prune()
    var updated_at = (new Date()).toISOString()
    if (!expires_at) {
        expires_at = new Date()
        expires_at = (new Date(expires_at.setDate(expires_at.getDate() + this._expires))).toISOString()
    }

    var sqlStmnt = [
        "INSERT INTO persistent_channel_map (channel_name, key, value, updated_at, expires_at)",
        "VALUES (?, ?, ?, ?::timestamp, ?::timestamp)",
        "ON CONFLICT ON CONSTRAINT unique_persistent_channel_map_channel_name_key DO UPDATE",
        "SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, expires_at = EXCLUDED.expires_at",
        "returning id;",
    ].join('\n')
    var resultSet = this.executeDBStatement(sqlStmnt, true, [channel_name, key, value, updated_at, expires_at])
    return (resultSet.next()) ? Number.parseInt(resultSet.getString(1)) : -1
}

PersistentChannelMap.prototype.delete = function (key, channel_name) {
    channel_name = channel_name || channelName
    var sqlStmnt = [
        "DELETE FROM persistent_channel_map",
        "WHERE channel_name = ? and key = ?",
        "returning id;"
    ].join('\n')

    var resultSet = this.executeDBStatement(sqlStmnt, true, [channel_name, key])
    return (resultSet.next()) ? Number.parseInt(resultSet.getString(1)) : -1
}

PersistentChannelMap.prototype.prune = function () {
    var sqlStmnt = [
        "DELETE FROM persistent_channel_map",
        "WHERE expires_at is not null and expires_at < NOW();"
    ].join('\n')
    this.executeDBStatement(sqlStmnt, false)
}

