/**
 * Custom CSV batch processor
 * @module mmc/customBatchProcessor
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @license Apache-2.0
 */

/**
 * A call back function that transforms the value.
 * @typedef {function(key, value)} transformer
 * @callback transformer
 * @return  {string} value
 */

/**
 * Parses a single row into a JSON object
 * @param {string} row one line of delimited text
 * @param {string} [columnDelim=','] column deliminator
 * @param {[string]} [headers] Optionally, the headers. If undefined parser will return an array of string to be used as the headers. This is useful when the first row is the headers
 * @param {transformer} [transformer] An optional callback transformer
 * @return {([string]|Object)} returns an array of strings that can be used if the headers param is undefined or the parsed and transformed Object if headers was a valid array
 */
const parser = (row, columnDelim, headers, transformer) => {
    columnDelim = columnDelim || ','
    const data = String(row).trim().split(columnDelim)
    return !headers ? data : data.reduce((acc, value, i) => {
        const key = headers[i]
        acc[key] = typeof transformer === 'function' ? transformer(key, value) : value
        return acc
    }, {})
}

/**
 * An example of a raw batch processor use in production. Reads one line at a time and parses it into a JSON string
 * using the header row as the property keys. Uses the first line as the header.
 * @return {string|''}
 */
function getMessage() {
    var headers = $gc('headers')
    var line = reader.readLine()
    if (!line) {
        $gc('headers', null)
        return ''
    }
    if (!headers) {
        $gc('headers', parser(line, '|', headers))
        return getMessage()
    }
    const parsed = parser(line, '|', headers, (key, value) => {
        return (key === 'reportText') ? value.split(/\\.br\\/).map(ele => ele.trim()) : value
    })
    return parsed ? JSON.stringify(parsed) : ''
}

return getMessage()
