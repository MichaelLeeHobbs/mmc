/**
 * ChannelUtils
 * @param {Object} config
 * @param {string} config.name a db connection name must be unique or will cause issues
 * @param {string} config.user user name to use for db connection
 * @param {string} config.password db user password
 * @param {string} config.url db url
 * @param {string} config.dbClass db class - Default: org.postgresql.Driver
 * @param {string} config.cacheConnection Should cache the connection? true/false
 * @param {string} config.cacheName default - cachedConnection:ChannelUtils:channelName:config.name
 * @constructor
 * @example
 * const config = {
 *   "name": "mirthDB",
 *   "user": "postgres",
 *   "password": "uzdWSsWSerYOp1556m4dltTuEty8",
 *   "url": "jdbc:postgresql://postgres002-vns-vanguard.cukw8eaqtioy.us-gov-west-1.rds.amazonaws.com:5432/mirthdb_container",
 *   "dbClass": "org.postgresql.Driver",
 *   "cacheConnection": true,
 * }
 * const channelUtils = new ChannelUtils(config)
 */
function ChannelUtils(config) {
    config = config || $cfg('mirthDB')
    DBConnection.call(this, config)
}

ChannelUtils.prototype = Object.create(DBConnection.prototype)

// $tryElse inherited from DBConnection

/**
 * Retrieves the database ID associated with a channel.
 *
 * @param {string} cid - The channel ID for which to retrieve the database ID.
 * @param {boolean} [debug] - Indicates whether to enable debug mode.
 * @returns {number} The database ID of the channel.
 * @throws {Error} If the database ID for the channel cannot be retrieved.
 */
ChannelUtils.prototype.getDBID = function (cid, debug) {
    cid = cid || channelId
    const statement = 'SELECT local_channel_id from d_channels where channel_id = ?;'
    if (debug) {
        logger.debug(['ChannelUtils.prototype.getDBID(cid=', cid, ', debug=', debug, ')\n  ', this.denormalizeSQL(statement, [cid])].join(''))
    }
    const resultSet = this.executeDBStatement(statement, true, [cid])
    if (resultSet.next()) {
        const result = parseInt(JSON.parse(resultSet.getString(1)))
        if (debug) {
            logger.debug(['ChannelUtils.prototype.getDBID(cid=', cid, ', debug=', debug, ') result = ', result].join(''))
        }
        return result
    }
    throw new Error([channelId, ':', channelId, ': ', 'Failed to get DB ID for channelId: ', cid].join(''))
}

/**
 * Creates a metadata index in the database.
 *
 * @param {string} metadata - The metadata to create an index for.
 * @param {boolean} [debug] - Indicates whether to enable debug mode.
 */
ChannelUtils.prototype.createMetaDataIndex = function (metadata, debug) {
    const columnName = metadata.toUpperCase()
    const tableName = 'd_mcm' + this.getDBID()
    const sqlStmt = 'CREATE INDEX CONCURRENTLY IF NOT EXISTS ' + 'idx_' + tableName + '_' + columnName + ' ON ' + tableName + ' ("' + columnName + '");'
    if (debug) {
        logger.debug(['ChannelUtils.prototype.createMetaDataIndex(metadata=', metadata, ', debug=', debug, ') sqlStmt = ', sqlStmt].join(''))
    }
    this.executeDBStatement(sqlStmt, false)
}

/**
 * @typedef {Object} Message
 * @property {number} metadata_id - The metadata ID.
 * @property {number} message_id - The message ID.
 * @property {number} content_type - The content type.
 * @property {object} content - The content of the message.
 * @property {boolean} is_encrypted - Indicates whether the message is encrypted.
 * @property {string} data_type - The data type of the message.
 * @property {string} SOURCE - The source of the message.
 * @property {string} TYPE - The type of the message.
 * @property {string} VERSION - The version of the message.
 * @property {string} [ACCESSION] - The accession number.
 * @property {string} [MSGTYPE] - The message type.
 */

/**
 * Retrieves a message based on metadata key and value from the database.
 *
 * @param {string} key - The metadata key to search for.
 * @param {string} value - The metadata value to match.
 * @param {string} cid - The channel ID for which to retrieve the message.
 * @param {boolean} [debug] - Indicates whether to enable debug mode.
 * @returns {Message[]} The retrieved message(s) as a JSON object or an array of result set.
 */
ChannelUtils.prototype.getMessageByMetadata = function (key, value, cid, debug) {
    const dbID = this.getDBID(cid, debug)
    if (!dbID) {
        this.throwError('getMessageByMetadata()', 'No dbID found for channel ID: ' + cid)
    }
    const sql = [
        'select * from d_mc## right join d_mcm## on d_mcm##.message_id = d_mc##.message_id and d_mcm##.metadata_id = d_mc##.metadata_id where "',
        key.toUpperCase(),
        '" = ?::varchar and content_type = 1'
    ].join('').replace(/##/g, dbID)
    const sqlStmnt = this.sqlRowsAsJSON(sql)
    if (debug) {
        logger.debug([
            'ChannelUtils.prototype.getMessageByMetadata(key=', key, ', value=', value, ', cid=', cid, ', debug=', debug, ') sqlStmnt = ',
            this.denormalizeSQL(sqlStmnt, [String(value)])
        ].join(''))
    }
    // value is explicitly converted to a string for mirth 3.7.0 to fix:
    // org.postgresql.util.PSQLException: Can't infer the SQL type to use for an instance of org.mozilla.javascript.NativeString
    const resultSet = this.executeDBStatement(sqlStmnt || sql, true, [String(value)])
    if (resultSet.next()) {
        const result = sqlStmnt ? JSON.parse(resultSet.getString(1)) : resultSet
        if (debug) {
            logger.debug([
                'ChannelUtils.prototype.getMessageByMetadata(key=', key, ', value=', value, ', cid=', cid, ', debug=', debug, ') result = ',
                result
            ].join(''))
        }
        return result
    }
    return sqlStmnt ? [] : resultSet
}

/**
 * Updates the index of ChannelUtils with the provided name and channel ID.
 *
 * @param {string} name - The name to update in the index.
 * @param {string} cid - The channel ID associated with the name.
 */
ChannelUtils._updateIndex = function (name, cid) {
    const globalIndex = globalMap.get('ChannelUtilsIndex') || {}
    globalIndex[name] = cid
    globalMap.put('ChannelUtilsIndex', globalIndex)
}

/**
 * Sets the message index for a specific key-value pair in the channel map and updates the ChannelUtils index.
 *
 * @param {string} key - The key for the message index.
 * @param {string} value - The value for the message index.
 * @param {string} name - The name associated with the message index.
 * @param {string} dbConfig - The configuration for the database.
 */
ChannelUtils.setMessageIndex = function (key, value, name, dbConfig) {
    const channelUtils = new ChannelUtils(String($cfg(dbConfig)))
    channelUtils.createMetaDataIndex(key)
    channelMap.put(key, value)
    ChannelUtils._updateIndex(name, channelId)
}

/**
 * Retrieves messages from the ChannelUtils based on the provided index key-value pair and options.
 *
 * @param {string} key - The key of the index to search for.
 * @param {string} value - The value of the index to match.
 * @param {string} name - The name associated with the index.
 * @param {string} dbConfig - The configuration for the database.
 * @param {Object} [options] - Additional options for retrieving and processing the messages.
 * @param {boolean} [options.sort=true] - Indicates whether to sort the resulting messages by message ID.
 * @param {boolean} [options.parseXml] - Indicates whether to parse the messages as XML.
 * @param {Array<string>} [options.filter] - An array of values to filter the parsed XML messages.
 * @returns {Array<Object|XML>} The retrieved messages as an array of objects or XML.
 */
ChannelUtils.getMessageByIndex = function (key, value, name, dbConfig, options) {
    options = options || {sort: true}
    const channelUtils = new ChannelUtils(String($cfg(dbConfig)))
    const globalIndex = globalMap.get('ChannelUtilsIndex')
    const cid = globalIndex[name]
    var result = channelUtils.getMessageByMetadata(key, value, cid) || []
    if (options.sort) {
        result = result.sort((a, b) => a.message_id > b.message_id)
    }
    if (options.parseXml) {
        result = result.map(order => new XML(SerializerFactory.getSerializer('HL7V2').toXML(order.content)))
        if (options.filter) {
            result = result.filter(order => options.filter.indexOf(order['ORC']['ORC.1']['ORC.1.1'].toString()) > -1)
        }
    }
    return result
}

/**
 * Gets messages from channel with {channelID} by metadata column {key} with value of {value}
 * @param {string} key metadata column
 * @param {string} value metadata value
 * @param {string} channelID
 * @param {string} dbConfig $cfg map key for db config
 * @param {boolean} [parseXml=false] should parse to XML?
 * @param {boolean} [sort=true] should sort by message id?
 * @param {[string]} [filter] should filter on ORC.1.1 example ['XO', 'NW', 'SC']
 * @param debug
 * @return {[*]}
 */
ChannelUtils.getMessageByIndexV2 = function ({key, value, channelID, dbConfig, parseXml, sort, filter, debug}) {
    const channelUtils = new ChannelUtils(String($cfg(dbConfig)))
    var result = channelUtils.getMessageByMetadata(key, value, channelID, debug) || []
    if (debug) {
        logger.debug([
            'ChannelUtils.prototype.getMessageByIndexV2(key=', key, ', value=', value, ', channelID=', channelID, ', dbConfig=', dbConfig,
            ', parseXml=', parseXml, ', sort=', sort, 'filter=', filter, ', debug=', debug, ') result = ',
            JSON.stringify(result, null, 2)
        ].join(''))
    }
    if (sort) {
        result = result.sort((a, b) => a.message_id > b.message_id)
    }
    if (parseXml) {
        result = result.map(order => new XML(SerializerFactory.getSerializer('HL7V2').toXML(order.content)))
        if (Array.isArray(filter)) {
            result = result.filter(order => filter.indexOf(order['ORC']['ORC.1']['ORC.1.1'].toString()) > -1)
        }
    }
    return result
}

/* global DBConnection */
