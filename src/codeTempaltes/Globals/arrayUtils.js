/**
 * Array utility functions.
 * @namespace arrayUtils
 */
var arrayUtils = {}

/**
 * Converts a Java ArrayList to a JS Array.
 * (Formerly arrayListToArray)
 * @param {List} list
 * @return {*[]}
 */
arrayUtils.fromArrayList = function (list) {
  const arr = []
  for (let i = 0; i < list.size(); i++) {
    arr.push(list.get(i))
  }
  return arr
}

/**
 * Maps an array to an object with keys starting from a specified index.
 * (Formerly mapArrayToObject)
 * @param {any[]} arr
 * @param {number} [startIdx=1]
 * @return {object}
 */
arrayUtils.toObject = function (arr, startIdx) {
  startIdx = startIdx == null ? 1 : startIdx
  return arr.reduce((obj, item, index) => {
    obj[startIdx + index] = item
    return obj
  }, {})
}

/* exported arrayUtils */
