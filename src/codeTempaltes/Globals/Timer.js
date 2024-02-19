/**
 * Code timer works across Channel source/destination and handles regeneration of destination. It is a good idea to initialize timings in the preprocessor.
 * @example
 * // preprocessor
 * const timer = new Timer()
 * timer.markTime('preprocessor')
 *
 * // in a source connector
 * const timer = new Timer()
 * timer.markTime('some event')
 *
 * // in a destination connector
 * const timer = new Timer()
 * timer.markTime('some other event')
 *
 * @param {string} [key='timings'] the $c param to store timings in
 * @param {string} [event='start'] the name of the starting event
 * @constructor
 */
function Timer(key, event) {
    this.key = key || 'timings'
    this.timings = [{event: event || 'start', dt: new Date()}]
    if ($c(this.key)) {
        this.restore()
    }
    $c(this.key, this.timings)
}

/**
 * Private function to restore internal state
 * @private
 */
Timer.prototype.restore = function () {
    var timings = $c(this.key)
    if (typeof timings !== 'object' || !Array.isArray(timings)) {
        try {
            timings = JSON.parse(timings)
            timings = timings.map(ele => {
                ele.dt = new Date(ele.dt)
                if (ele.diff) {
                    ele.diff = parseInt(ele.diff)
                }
                return ele
            })
            this.timings = timings
        } catch (e) {
            // do nothing
            logger.error('Failed to parse timings! Error: ' + e.message)
        }
    } else {
        this.timings = timings
    }
}

/**
 * Mark the time of an event
 * @param {string} event
 */
Timer.prototype.markTime = function (event) {
    var dt = new Date()
    var diff = dt - this.timings[this.timings.length - 1].dt
    this.timings.push({event: event, dt: dt, diff: diff})
}

/**
 * Add a sum event.
 */
Timer.prototype.sum = function () {
    var dt = new Date()
    var diff = dt - this.timings[0].dt
    this.timings.push({event: 'sum', dt: dt, diff: diff})
}

/**
 * Converts the JavaScript value of timings to a string.
 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 * @return {string}
 */
Timer.prototype.stringify = function (replacer, space) {
    return JSON.stringify(this.timings, replacer, space)
}

/**
 * Converts a timing to a string by using the current locale.
 * @return {string}
 */
Timer.prototype.toString = function () {
    return this.timings.map(ele => {
        return ele.dt.toLocaleString() + ' : ' + ele.event + (ele.diff ? '  diff: ' + ele.diff : '')
    }).join('\n')
}
