/**
 * Returns the name of the current month
 * @return {string}
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
function getMonthName() {
    const dayName = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    return dayName[new Date().getMonth()]
}

if (typeof module === 'object') {
    module.exports = getMonthName
}
