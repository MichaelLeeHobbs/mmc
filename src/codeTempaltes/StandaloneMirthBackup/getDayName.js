/**
 * Returns the name of the current day
 * @return {string}
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
function getDayName() {
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return dayName[new Date().getDay()]
}

if (typeof module === 'object') {
    module.exports = getDayName
}
