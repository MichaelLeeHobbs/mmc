/**
 * Iterates over an array limiting the length of each element to length splitting on space and length as needed
 * @param {(string)[]} arr - The array to iterate over
 * @param {number} length - The length to limit the elements to
 * @return {(string)[]} - The new array
 */
function limitArrElementLength(arr, length) {
  const out = []
  arr.forEach((line) => {
    var _line = line.trim()
    if (_line.length > length) {
      splitStringOnSpaceAndLength(_line, length).forEach(ln => out.push(ln))
    } else {
      out.push(_line)
    }
  })
  return out
}
