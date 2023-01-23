/**
 * Asserts that the given condition is true. If it is not, an error is thrown.
 * @param {*} condition
 * @param {string} message
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}
