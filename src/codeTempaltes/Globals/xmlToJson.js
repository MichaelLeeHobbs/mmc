/**
 * Converts Mirth XML to JSON where all values are converted to string.
 * @param {XML} xml
 * @param {function(path: string, value: string): *} cb Optional call back that is passed the current path and value that is expected to return the transformed value
 * @param {string} _path private
 * @return {string|{}}
 */
function xmlToJson(xml, cb, _path) {
  _path = _path || ''
  const out = {}
  if (!xml.hasComplexContent()) {
    return xml.toString()
  }

  // use var, or it won't work right in mirth
  // @formatter:off
  for each (var child in xml) {
    // @formatter:on
    var name = child.name().localName
    var childPath = _path > '' ? _path + '.' + name : name
    out[name] = xmlToJson(child.children(), cb, childPath)
    if (typeof cb === 'function') {
      out[name] = cb(childPath, out[name])
    }
  }
  return out
}
