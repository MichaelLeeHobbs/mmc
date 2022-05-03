/**
 * Converts a Java ArrayList to a JS Array
 * @param arrayList
 * @return {[]}
 */
function arrayListToArray(arrayList) {
  const arr = []
  for (var i = 0; i < arrayList.size(); i++) {
    arr.push(arrayList.get(i))
  }
  return arr
}
