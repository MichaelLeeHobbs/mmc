/**
 * DBConnection is a base class designed to be extended and provide basic DB functionality in a reusable fashion.
 *
 * Author: Michael Lee Hobbs
 * LICENSE: GNU GENERAL PUBLIC LICENSE - https://www.gnu.org/licenses/gpl-3.0.html
 * History:
 * - 20201226 - Initial Release
 * - 20210406 - PACMANO Release, the Less is MORE edition! Line count cut by %40! Simplification of code.
 * - 20230123 - Minor clean up
 *
 * @example
 * const config = {
 *  "name": "mirthdb",
 *  "user": "mirthdb",
 *  "password": "mirthdb",
 *  "url": "jdbc:postgresql://postgres:5432/mirthdb",
 *  "dbClass": "org.postgresql.Driver",
 *  "cacheConnection": true
 *  }
 *
 * @param {object} config: {name, user, password, url, dbClass, cacheConnection, cacheName}
 * @param {string} config.name: a db connection name must be unique or will cause issues
 * @param {string} config.user: user name to use for db connection
 * @param {string} config.password: db user password
 * @param {string} config.url: db url
 * @param {string} config.dbClass: db class - Default: org.postgresql.Driver
 * @param {string} config.cacheConnection: Should cache the connection? true/false
 * @param {string} config.cacheName: optional for cross channel caching - defaults to cachedConnection:className:channelName:config.name
 * @constructor
 */
function DBConnection(config) {
    if (!config) {
        this.throwError(null, 'config is undefined!')
    }
    this._config = (typeof config === 'string') ? JSON.parse(config) : JSON.parse(JSON.stringify(config));
    ['name', 'url', 'user', 'password'].forEach(key => !this._config[key] && this.throwError(null, 'config.' + key + ' is undefined!'))
    this._config.cacheName = this._config.cacheName || ['cachedConnection', channelName, this._config.name].join(':')
}

// utility functions
function $sleep(ms) {
    java.lang.Thread.sleep(ms)
}

/**
 * Closes the DB connection
 */
DBConnection.prototype.closeConnection = function () {
    $t(() => globalMap.get(this._config.cacheName).close())
}

/**
 * Executes a SQL statement
 * @param statement
 * @param isQuery
 * @param paramList - Java ArrayList or JS Array
 * @return {*|undefined} - results or undefined
 */
DBConnection.prototype.executeDBStatement = function (statement, isQuery, paramList, _retry) {
    statement = String(statement)
    _retry = (_retry || 0) + 1   // recursive call
    const dbConnection = this._getConnection()
    const arrList = Array.isArray(paramList) ? paramList : []
    if (paramList instanceof Packages.java.util.ArrayList) {
        const paramListIterator = paramList.iterator()
        while (paramListIterator.hasNext()) {
            arrList.push('' + paramListIterator.next())
        }
    }

    try {
        return (isQuery) ? dbConnection.executeCachedQuery(statement, paramList || arrList) : dbConnection.executeUpdate(statement, paramList || arrList)
    } catch (e) {
        const errorCheck = [
            'I/O error', 'This connection has been closed.',
            'FATAL: sorry, too many clients already',
            'FATAL: terminating connection due to administrator command',
            'The connection attempt failed.'
        ]
        if (_retry < 10 && errorCheck.some(check => e.message.indexOf(check) > -1)) {
            $sleep(_retry * 100)
            return this.executeDBStatement(statement, isQuery, paramList, _retry)
        }
        const debugStatement = arrList.reduce((acc, cur) => acc.replace('?', "'" + cur + "'"), statement)
        throw this.errorPrefix('executeDBStatement', 'statement: ' + debugStatement + ', isQuery: ' + isQuery + ' on "' + this._config.name + '"', e)
    } finally {
        if (!this._config.cacheConnection) {
            this.closeConnection()
        }
    }
}

/**
 * Denormalizes a sql query for debugging
 * @param {string} sql
 * @param [*] params
 * @returns {*}
 */
DBConnection.prototype.denormalizeSQL = function (sql, params) {
    var result = sql
    params.forEach(param => {
        var replacer = typeof param === 'number' ? param : ["'", param, "'"].join('')
        result = result.replace('?', replacer)
    })
    return result
}

/**
 * Executes multiple request in order
 * @param paramsArr [statement, isQuery, paramList] - See executeDBStatement
 * @return [{*|undefined}]
 */
DBConnection.prototype.executeDBStatements = function (paramsArr) {
    return paramsArr.map(([statement, isQuery, paramList]) => this.executeDBStatement(statement, isQuery, paramList))
}

DBConnection.prototype.errorPrefix = function (func, msg, error) {
    error = error || new Error()
    error.message = [
        channelName, ': ', this.constructor.name, (func && '.' + func || ''), (msg && ' - ' + msg || ''), '\n', error.message, '\n', error.stack
    ].join('')
    return error
}

/**
 * Throw or log and error adding additional information
 * @param func - optional - Name of function that is throwing
 * @param msg - optional - Additional message, example could be additional error information
 * @param error - original error object
 */
DBConnection.prototype.throwError = function (func, msg, error) {
    throw this.errorPrefix(func, msg, error)
}

DBConnection.prototype._getConnection = function (_retry) {
    _retry = (_retry || 0) + 1
    const dbConnection = globalMap.get(this._config.cacheName)
    const result = $t(() => !globalMap.get(this._config.cacheName).getConnection().isClosed())
    if (result === true) {
        return dbConnection
    }
    if (result instanceof Error && _retry > 5) {
        this.throwError('_getConnection()', 'Failed to open a connection!', result)
    }
    $sleep(_retry * 100)
    const {dbClass, url, user, password} = this._config
    try {
        globalMap.put(this._config.cacheName, DatabaseConnectionFactory.createDatabaseConnection(dbClass, url, user, password))
    } catch (e) {
        this.throwError('_getConnection', '', e)
    }
    return this._getConnection(_retry)
}

/* global globalMap, channelName, java, Packages, DatabaseConnectionFactory*/
