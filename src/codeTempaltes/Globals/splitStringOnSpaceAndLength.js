/**
 * Splits a string on the first space less than length and on natural line breaks.
 * @param {string} str
 * @param {number} length
 * @param {boolean} [noTrim=false] should each element not be trimmed?
 * @return {(string)[]}
 */
function splitStringOnSpaceAndLength(str, length, noTrim) {
  const regex = new RegExp('(.{1,' + length + '}(\\s|$))\\s*', 'g')
  const matches = String(str).match(regex) || ['']
  return matches.map((ele) => (noTrim) ? ele : ele.trim())
}
