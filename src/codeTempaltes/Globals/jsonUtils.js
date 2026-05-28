/**
 * JSON utility functions for serialization and SQL denormalization.
 * @namespace jsonUtils
 */
var jsonUtils = {}

/**
 * A custom JSON stringifier that is compatible with Mirth Connect's ES5 Rhino engine
 * and correctly handles circular references, which the native JSON.stringify in Rhino fails to do.
 * (Formerly customStringify)
 *
 * @param {any} obj The JavaScript object, array, or primitive to stringify.
 * @param {number|string} [space] - An optional number of spaces or a string to use for indentation.
 * @returns {string} The JSON formatted string.
 */
jsonUtils.stringify = function (obj, space) {
  let indentation = ''
  if (typeof space === 'number') {
    for (let i = 0; i < space; i++) {
      indentation += ' '
    }
  } else if (typeof space === 'string') {
    indentation = space
  }

  const seen = []

  function processValue(value, currentIndent) {
    if (value === null) {
      return 'null'
    }
    if (typeof value === 'function' || typeof value === 'undefined') {
      return undefined
    }
    if (typeof value === 'string') {
      return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"'
    }
    if (typeof value !== 'object') {
      return isFinite(value) ? String(value) : 'null'
    }

    if (seen.indexOf(value) !== -1) {
      return '"[Circular Reference]"'
    }
    seen.push(value)

    const nextIndent = indentation ? (currentIndent + indentation) : ''

    if (Object.prototype.toString.call(value) === '[object Array]') {
      const arrayItems = []
      for (let j = 0; j < value.length; j++) {
        const item = processValue(value[j], nextIndent)
        arrayItems.push(item === undefined ? 'null' : item)
      }

      seen.pop()

      if (indentation) {
        if (arrayItems.length === 0) return '[]'
        return '[\n' + nextIndent + arrayItems.join(',\n' + nextIndent) + '\n' + currentIndent + ']'
      } else {
        return '[' + arrayItems.join(',') + ']'
      }
    }

    const objectItems = []
    for (let key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const processedVal = processValue(value[key], nextIndent)
        if (processedVal !== undefined) {
          const formattedKey = '"' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
          objectItems.push(formattedKey + (indentation ? ': ' : ':') + processedVal)
        }
      }
    }

    seen.pop()

    if (indentation) {
      if (objectItems.length === 0) return '{}'
      return '{\n' + nextIndent + objectItems.join(',\n' + nextIndent) + '\n' + currentIndent + '}'
    } else {
      return '{' + objectItems.join(',') + '}'
    }
  }

  return processValue(obj, '')
}

/**
 * Converts an object to a JSON string, handling circular references.
 * This version is compatible with Mirth Connect's Mozilla Rhino (ES5) engine.
 * Note: If this fails use jsonUtils.stringify() instead.
 * (Formerly stringifyCircularJSON)
 *
 * @param {any} obj - The object to convert to JSON.
 * @param {number} [space] - Optional. Number of spaces for indentation. Defaults to 2.
 * @return {string}
 */
jsonUtils.stringifyCircular = function (obj, space) {
  const indentation = (space === undefined) ? 2 : space
  const seen = []

  return JSON.stringify(obj, function (key, value) {
    if (value !== null && typeof value === 'object') {
      if (seen.indexOf(value) !== -1) {
        return
      }
      seen.push(value)
    }
    return value
  }, indentation)
}

/**
 * Converts Mirth XML to JSON where all values are converted to string[] or object[].
 * (Formerly xmlToJson)
 * @param {XML} xml
 * @param {function(path: string, value: string|[]): *} [cb] Optional callback that is passed the current path and value that is expected to return the transformed value
 * @param {string} [_path] private, used for recursion to keep track of the current path
 * @return {string|{}|[]}
 */
jsonUtils.fromXml = function (xml, cb, _path) {
  _path = _path || ''
  if (!xml.hasComplexContent()) {
    // Convert directly if there's no complex content.
    return xml.toString()
  }

  const out = {}
  const children = xml.children()
  for (let i = 0; i < children.length(); i++) {
    const child = children[i]
    // you can also get localName directly as a string
    const name = child.localName()
    const childPath = _path ? _path + '.' + name : name
    let childValue = jsonUtils.fromXml(child, cb, childPath)

    if (typeof cb === 'function') {
      childValue = cb(childPath, childValue)
    }

    // Handle multiple instances of the same element.
    if (Object.prototype.hasOwnProperty.call(out, name)) {
      out[name].push(childValue)
    } else {
      out[name] = [childValue]
    }
  }

  return out
}

/**
 * Denormalize SQL with parameters for logging.
 * @param {string} sql - The SQL statement to denormalize
 * @param {ArrayList|*[]} params
 * @return {string}
 */
jsonUtils.denormalizeSQL = function (sql, params) {
  if (params instanceof Packages.java.util.ArrayList) {
    params = arrayUtils.fromArrayList(params)
  }
  if (!Array.isArray(params)) {
    return sql
  }
  let result = sql
  params.forEach(param => {
    const replacer = typeof param === 'number' ? param : ["'", param, "'"].join('')
    result = result.replace('?', replacer)
  })
  return result
}
/* global arrayUtils */
/* exported jsonUtils */
