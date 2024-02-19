/**
 * Denormalize SQL with parameters for logging
 * @param {string} sql - The SQL statement to denormalize
 * @param {ArrayList|*[]} params
 * @return {string}
 */
function denormalizeSQL(sql, params) {
    // define arrayListToArray in case it is not already defined
    function arrayListToArray(arrayList) {
        const arr = []
        for (var i = 0; i < arrayList.size(); i++) {
            arr.push(arrayList.get(i))
        }
        return arr
    }
    if (params instanceof Packages.java.util.ArrayList) {
        params = arrayListToArray(params)
    }
    var result = sql
    params.forEach(param => {
        var replacer = typeof param === 'number' ? param : ["'", param, "'"].join('')
        result = result.replace('?', replacer)
    })
    return result
}
