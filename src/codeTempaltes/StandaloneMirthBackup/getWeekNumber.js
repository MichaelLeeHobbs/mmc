/**
 * Returns the number of the current week in the year
 * @return {string}
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
function getWeekNumber() {
    const now = new Date()
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
}

if (typeof module === 'object') {
    module.exports = getWeekNumber
}
