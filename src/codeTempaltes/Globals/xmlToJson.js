/**
 * Converts Mirth XML to JSON where all values are converted to string[] or object[].
 * @param {XML} xml
 * @param {function(path: string, value: string|[]): *} cb Optional callback that is passed the current path and value that is expected to return the transformed value
 * @param {string} _path private, used for recursion to keep track of the current path
 * @return {string|{}|[]}
 */
function xmlToJson(xml, cb, _path) {
  _path = _path || '';
  if (!xml.hasComplexContent()) {
    // Convert directly if there's no complex content.
    return xml.toString();
  }

  const out = {};
  // use var, or it won't work right in mirth
  // @formatter:off
  for each (var child in xml.children()) {
    // @formatter:on
    var name = child.name().localName;
    var childPath = _path ? _path + '.' + name : name;
    var childValue = xmlToJson(child, cb, childPath);

    if (typeof cb === 'function') {
      childValue = cb(childPath, childValue);
    }

    // Handle multiple instances of the same element.
    if (out.hasOwnProperty(name)) {
      out[name].push(childValue);
    } else {
      out[name] = [childValue];
    }
  }

  return out;
}
