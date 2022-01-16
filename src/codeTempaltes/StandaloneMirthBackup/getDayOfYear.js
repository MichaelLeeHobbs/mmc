/**
 * Returns the name of the current day of the year
 * @return {string}
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
function getDayOfYear() {
    return Math.floor((Date.now() - Date.parse(new Date().getFullYear(), 0, 0)) / 86400000)
}

if (typeof module === 'object') {
    module.exports = getDayOfYear
}
