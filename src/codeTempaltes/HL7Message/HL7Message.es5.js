// noinspection ES6ConvertVarToLetConst

if (typeof require !== 'undefined') {
  var Encoding = require('./Encoding.es5')
}

const assert = (predicate, msg) => {
  if (predicate) {
    return true
  }
  throw new Error(msg)
}
// convert an array to an Objects with keys i + 1
const arrayToElement = (arr) => Array.isArray(arr) ? arr.reduce((acc, ele, i) => void (acc[i + 1] = ele) || acc, {}) : arr

const checks = {
  assert: {
    isStrNum: (value, key) => assert(checks.isStrNum(value), '"' + key + '" must be typeof string or number!'),
    isString: (value, key) => assert(checks.isString(value), '"' + key + '" must be typeof string!'),
    isNotUndefinedOrNull: (predicate, key) => {
      if (Array.isArray(predicate)) {
        predicate.forEach((pred, i) => assert(predicate != null, '"' + key[i] + '" cannot be undefined!'))
      }
      return assert(predicate != null, '"' + key + '" cannot be undefined!')
    },
    isComponentValid: (value) => assert(
        checks.isComponentValid(value),
        'A component must be an object with properties keys that are integers > 0 and values that are primitive, found ' + JSON.stringify(value)
    ),
    notUndefined: (predicate, key) => {
      if (Array.isArray(predicate)) {
        predicate.forEach((pred, i) => assert(predicate != null, '"' + key[i] + '" cannot be undefined!'))
      }
      return assert(predicate != null, '"' + key + '" cannot be undefined!')
    },
  },

  isEmptyObj: (obj) => typeof obj === 'object' ? Object.keys(obj).length === 0 : false,
  isPositiveInteger: (n) => parseInt(n) > 0 && parseInt(n).toString() === n.toString(),
  isStrNum: (value) => ['string', 'number'].indexOf(typeof value) > -1,
  isString: (value) => ['string'].indexOf(typeof value) > -1,
  isUndefined: (value) => typeof value === 'undefined',
  isComponentValid: (component) => {
    if (typeof component !== 'object' || component == null) {
      return false
    }
    return Object.keys(component).every((k) => {
      const type = typeof component[k]
      return ['string', 'number'].indexOf(type) > -1 && checks.isPositiveInteger(k)
    })
  },
}

/**
 * Create an empty HL7Message or optionally one based on the encoded HL7 string.
 * @param {string} [hl7]
 * @constructor
 */
function HL7Message(hl7) {
  // This creates private variable that will not be printed if console.log(hl7MessageInstance) is called
  // this is mostly for debugging
  Object.defineProperty(this, 'raw', {get: () => hl7, configurable: true})

  /**
   * Get Message Encoding
   * @return {Encoding}
   */
  Object.defineProperty(this, 'encoding', {get: () => this._encoding, configurable: false, enumerable: true})
  /**
   * Get Message segments
   * @return {[]}
   */
  Object.defineProperty(this, 'segments', {get: () => this._segments, configurable: false, enumerable: true})

  this._segments = []
  // eslint-disable-next-line block-scoped-var
  this._encoding = new Encoding()
  if (hl7) {
    this.parse(hl7)
  } else {
    this.parse('MSH|^~\\&')
  }
}

/**
 * HL7 Parser
 * @param {string|XML} [hl7]
 * @param {Encoding} [encoding]
 * @return {[]}
 */
HL7Message.parser = function (hl7, encoding) {
  // Check for Mirth XML object
  // check if we are in Mirth/Rhino environment and hl7 is instance of XML if so convert
  if (typeof XML !== 'undefined') {
    if (hl7 instanceof XML) {
      hl7 = String(SerializerFactory.getSerializer('HL7V2').fromXML(hl7))
    }
  }

  if (hl7.indexOf('MSH') !== 0) {
    throw new Error('Invalid Message! Message must start with "MSH"')
  }
  // eslint-disable-next-line block-scoped-var
  encoding = encoding || new Encoding(({hl7: hl7}))

  const {field, component, fieldRepetition, escape, subcomponent} = encoding
  const reducer = (acc, val, i) => void (acc[i + 1] = val) || acc
  const parseComp = (comp, incEmpty) => comp.split(subcomponent).reduce((acc, comp, i) => reducer(acc, comp, i, incEmpty), {})
  const parseField = (field, incEmpty) => field.split(component).reduce((acc, comp, i) => reducer(acc, parseComp(comp, incEmpty), i), {})
  const parseFields = (fields, name, mod) => {
    return fields.reduce((acc, fieldRep, fieldIndex, fieldArr) => {
      const incEmpty = fieldArr.length - 1 === fieldIndex
      let value = fieldRep.split(fieldRepetition).reduce((acc, field, i) => reducer(acc, parseField(field, incEmpty), i), {})
      if (!checks.isEmptyObj(value)) {
        acc[fieldIndex + 1 + (mod || 0)] = value
      }
      return acc
    }, {0: name || ''})
  }

  const parseSegment = (hl7) => {
    var fields, name
    if (hl7.indexOf('MSH') === 0) {
      fields = hl7.split(field)
      name = fields.shift()
      fields.shift()
      const _fields = parseFields(fields, name, 2)
      _fields[1] = {1: {1: {1: field}}}
      _fields[2] = {1: {1: {1: [component, fieldRepetition, escape, subcomponent].join('')}}}
      return _fields
    }
    fields = hl7.split(field)
    name = fields.shift()
    return parseFields(fields, name)
  }
  return [hl7.split(encoding.segment).map((hl7) => parseSegment(hl7)), encoding]
}

/**
 * Transforms a HL7 path string into an object.
 * @param {string} path
 * @param {boolean} [autoResolve=false]
 * @return ([seg: string, segIdx: number, field: string, fieldIdx: string, comp: string, sub: string, autoResolve: boolean]|false)
 * @private
 */
HL7Message.prototype._hl7KeyParser = function (path, autoResolve) {
  autoResolve = autoResolve == null ? true : autoResolve
  checks.assert.isString(path, 'path')
  if (!path.trim()) {
    return false
  }
  const regex = /([A-Z\d]{3})(?:\[(\d+)])?(?:\.(\d+))?(?:\[(\d+)])?(?:\.(\d+))?(?:\.(\d+))?/
  const matches = regex.exec(path)
  if (!matches) {
    return false
  }
  let [, seg, segIdx, field, fieldIdx, comp, sub] = matches
  segIdx = (parseInt(field) > 0 && !segIdx) ? '1' : segIdx
  fieldIdx = (parseInt(comp) > 0 && !fieldIdx) ? '1' : fieldIdx
  if (autoResolve) {
    segIdx = (seg) ? segIdx || '1' : segIdx
    fieldIdx = (seg && field) ? fieldIdx || '1' : fieldIdx
    comp = (seg && field && fieldIdx) ? comp || '1' : comp
    sub = (seg && field && comp) ? sub || '1' : sub
  }
  return [seg, segIdx && parseInt(segIdx), field, fieldIdx, comp, sub, autoResolve]
}

/**
 * The get() method returns a specified element from a HL7Message object. If the value that is associated to the provided path is an object, and autoResolve
 * is false then you will get a reference to that object and any change made to that object will effectively modify it inside the HL7Message object.
 * @param {string} path
 * @param {boolean} [autoResolve=true]
 * @return {(string|object|undefined)}
 */
HL7Message.prototype.get = function (path, autoResolve) {
  autoResolve = autoResolve == null ? true : autoResolve
  // return this._getRef(this._hl7KeyParser(path, typeof autoResolve === 'boolean' ? autoResolve : true), false)
  return this._getRef(this._hl7KeyParser(path, autoResolve), false)
}

/**
 * Returns an array of values based on the path, start, and stop. The path must have one % to mark the wild card value.
 * @example
 * // returns an array with the values MSH.3.1, MSH.4.1, MSH.5.1, and MSH.6.1
 * msg.getRange('MSH.%.1', 3, 6)
 * @param {string} path
 * @param {number} start
 * @param {number} stop
 * @param {boolean} autoResolve
 * @return {[string]}
 */
HL7Message.prototype.getRange = function (path, start, stop, autoResolve) {
  autoResolve = typeof autoResolve === 'boolean' ? autoResolve : true
  const out = []
  for (let i = start; i <= stop; i++) {
    let key = this._hl7KeyParser(path.replace('%', i.toString()), autoResolve)
    let [seg, segIdx, field, fieldIdx, comp, sub] = key
    if (key) {
      out.push(this._getRef([seg, segIdx, field, fieldIdx, comp])[sub] || '')
    } else {
      out.push('')
    }
  }
  return out
}

/**
 * Sets a value for the specified HL7 path. The value can contain text, number, an Object; that represents sub values, or an Array; where the array will be
 * treated as an Objects with the properties i, where is a number starting at 1 going to l the length of the array.
 * @param {string} path
 * @param {(string|number|Object|array)} value
 * @param {boolean} [autoResolve=false]
 */
HL7Message.prototype.set = function (path, value, autoResolve) {
  autoResolve = typeof autoResolve === 'boolean' ? autoResolve : false
  value = value || ''
  const key = this._hl7KeyParser(path, autoResolve)
  if (!key) {
    return
  }
  let [seg, segIdx, field, fieldIdx, comp, sub] = key
  // convert an array value to an object with keys i + 1
  if (Array.isArray(value)) {
    value = arrayToElement(value)
  }
  // const {seg, segIdx, field, fieldIdx, comp, sub} = key
  // what do they want? segment, field, component, subcomponent
  if (sub) {
    return this._setSubcomponent(seg, segIdx, field, fieldIdx, comp, sub, value)
  }
  if (comp) {
    return this._setComponent(seg, segIdx, field, fieldIdx, comp, value)
  }
  if (fieldIdx) {
    return this._setField(seg, segIdx, field, fieldIdx, value)
  }
  if (field) {
    return this._setFields(seg, segIdx, field, value)
  }
  if (seg) {
    return this._setSegment(seg, segIdx, value)
  }
}
/**
 * The delete() method removes the specified element from a HL7Message object by path.
 * @todo
 * @param path
 */
HL7Message.prototype.delete = function (path) {
  let key = this._hl7KeyParser(path)
  if (!key) {
    return
  }
  const [seg, segIdx, field, fieldIdx, comp, sub] = key

  // what do they want to delete? segment, field, component, subcomponent
  if (sub && this._getRef([seg, segIdx, field, fieldIdx, comp, sub])) {
    delete this._getRef([seg, segIdx, field, fieldIdx, comp])[sub]
  } else if (comp && !sub && this._getRef([seg, segIdx, field, fieldIdx, comp])) {
    delete this._getRef([seg, segIdx, field, fieldIdx])[comp]
  }
  if (fieldIdx && !comp && this._getRef([seg, segIdx, field, fieldIdx])) {
    delete this._getRef([seg, segIdx, field])[fieldIdx]
  }
  if (field && !fieldIdx && this._getRef([seg, segIdx, field])) {
    delete this._getRef([seg, segIdx])[field]
  }
  if (seg) {
    throw new Error('TODO!')
  }
}
/**
 * Get a reference to an element
 * @private
 * @param {[seg: string, segIdx: number, field: string, fieldIdx: string, comp: string, sub: string]=} key
 * @param {boolean} [autoCreate=true]
 * @return {*}
 */
HL7Message.prototype._getRef = function (key, autoCreate) {
  if (!key) {
    return
  }
  autoCreate = typeof autoCreate === 'boolean' ? autoCreate : true
  var [seg, segIdx, field, fieldIdx, comp, sub] = key
  segIdx = segIdx == null ? 1 : segIdx
  if (autoCreate) {
    fieldIdx = fieldIdx == null ? 1 : fieldIdx
  }

  let segment = this.getSegment(seg, segIdx)
  // segment
  if (!segment && autoCreate) {
    this._segments.push({'0': seg})
    segment = this.getSegment(seg, segIdx)
  }
  if (!segment || field == null) {
    return segment || ''
  }

  // field
  if (!segment[field] && autoCreate) {
    segment[field] = {}
  }
  if (!segment[field] || fieldIdx == null) {
    // if (!segment[field]) {
    return segment[field]
  }

  // fieldIdx
  if (!segment[field][fieldIdx] && autoCreate) {
    segment[field][fieldIdx] = {}
  }
  if (!segment[field][fieldIdx] || comp == null) {
    return segment[field][fieldIdx]
  }

  // comp
  if (!segment[field][fieldIdx][comp] && autoCreate) {
    segment[field][fieldIdx][comp] = {}
  }
  if (!segment[field][fieldIdx][comp] || sub == null) {
    return segment[field][fieldIdx][comp]
  }

  // sub comp
  if (!segment[field][fieldIdx][comp][sub] && autoCreate) {
    segment[field][fieldIdx][comp][sub] = ''
  }
  return segment[field][fieldIdx][comp][sub]
}

/**
 * Get a segments computed index
 * @param {string} seg
 * @param {number} segIdx
 * @return {number}
 * @private
 */
HL7Message.prototype._getSegmentIndex = function (seg, segIdx) {
  let count = 0
  return this.segments.findIndex((segment) => {
    if (segment[0] === seg) {
      count++
    }
    return count === segIdx
  })
}
/**
 * Returns a filtered array of segments by segment name.
 * @example
 * // returns all OBX segments
 * hl7message.getSegments('OBX')
 * @param {string} seg
 * @return {*[]}
 */
HL7Message.prototype.getSegments = function (seg) {
  checks.assert.notUndefined([seg], ['seg'])
  return this.segments.filter(segment => segment[0] === seg)
}
/**
 * Returns a specific segment by seg and segIdx
 * @example
 * // returns OBX[3]
 * hl7message.getSegment('OBX', 3)
 * @param seg
 * @param segIdx
 * @return {*}
 */
HL7Message.prototype.getSegment = function (seg, segIdx) {
  segIdx = segIdx || 1
  checks.assert.notUndefined([seg, segIdx], ['seg', 'segIdx'])
  const segmentIndex = this._getSegmentIndex(seg, segIdx)
  return this.segments[segmentIndex]
}

HL7Message.prototype._setSegment = function (seg, segIdx, value) {
  segIdx = segIdx || 1
  value = arrayToElement(value)
  value = checks.isStrNum(value) ? {1: value} : value
  Object.keys(value).forEach((field) => this._setFields(seg, segIdx, field, value[field]))
}
HL7Message.prototype._setFields = function (seg, segIdx, field, value) {
  segIdx = segIdx || 1
  value = arrayToElement(value)
  value = checks.isStrNum(value) ? {1: value} : value
  Object.keys(value).forEach((key) => {
    var _value = value[key]
    if (typeof _value === 'string' || typeof _value === 'number') {
      return this._setComponent(seg, segIdx, field, 1, key, _value)
    }
    this._setField(seg, segIdx, field, key, _value)
  })
}
HL7Message.prototype._setField = function (seg, segIdx, field, fieldIdx, value) {
  segIdx = segIdx || 1
  fieldIdx = fieldIdx || 1
  value = arrayToElement(value)
  value = checks.isStrNum(value) ? {1: value} : value
  Object.keys(value).forEach((comp) => this._setComponent(seg, segIdx, field, fieldIdx, comp, value[comp]))
}
HL7Message.prototype._setComponent = function (seg, segIdx, field, fieldIdx, comp, value) {
  value = arrayToElement(value)
  value = checks.isStrNum(value) ? {1: value} : value
  if (!checks.isComponentValid(value)) {
    throw new Error(['Failed to set ', seg, '[', segIdx, '].', field, '[', fieldIdx, '].', comp, ' expected Component got ', JSON.stringify(value)].join(''))
  }
  Object.keys(value).forEach((sub) => this._setSubcomponent(seg, segIdx, field, fieldIdx, comp, sub, value[sub]))
}
/**
 *
 * @param {string} seg
 * @param {number} segIdx
 * @param {string} field
 * @param {number} fieldIdx
 * @param {string} comp
 * @param {string} sub
 * @param {(string|number)} value
 * @private
 */
HL7Message.prototype._setSubcomponent = function (seg, segIdx, field, fieldIdx, comp, sub, value) {
  value = value || ''
  checks.assert.isStrNum(value, 'value')
  // A subcomponent value should be primitive
  this._getRef([seg, segIdx, field, fieldIdx, comp], true)[sub] = value
}

/**
 * The toString() method returns a string representing the encoded HL7 messages.
 * @return {string}
 */
HL7Message.prototype.toString = function () {
  const {segment, field, fieldRepetition, subcomponent, component} = this.encoding

  /**
   * Reduces an object to an array optionally passing the results in to a callback {cb} function for additionally transformation
   * @private
   * @param {Object} elements
   * @param {string} joiner
   * @param {function} [cb]
   * @return {string}
   */
  const reducer = (elements, joiner, cb) => {
    return Object.keys(elements).reduce((acc, idx) => {
      acc[idx - 1] = typeof cb === 'function' ? cb(elements[idx]) : elements[idx]
      return acc
    }, []).join(joiner)
  }

  const reduceComponents = (comp) => reducer(comp, subcomponent)
  const reduceField = (field) => reducer(field, component, reduceComponents)
  const reduceFields = (fields) => reducer(fields, fieldRepetition, reduceField)
  const reduceSegment = (segment) => (acc, idxFields, i) => {
    var fields = segment[idxFields]
    // this is to fix the duplicate field separator on the MSH segment
    if (segment[0] === 'MSH' && i > 1) {
      idxFields--
    }
    // handle segment name
    acc[idxFields] = (idxFields === '0') ? fields : reduceFields(fields)
    return acc
  }
  return this.segments.map((seg) => Object.keys(seg).reduce(reduceSegment(seg), []).join(field)).join(segment)
}

/**
 * Returns the HL7 as Mirth XML
 * @return {XML}
 */
HL7Message.prototype.toXML = function () {
  // check if we are in Mirth/Rhino environment
  if (typeof XML === 'undefined') {
    throw new Error('XML type not detected! HL7Message.toXML is only valid in Mirth environment')
  }
  if (typeof SerializerFactory === 'undefined') {
    throw new Error('SerializerFactory not detected! HL7Message.toXML is only valid in Mirth environment')
  }
  return new XML(SerializerFactory.getSerializer('HL7V2').toXML(this.toString()))
}

/**
 * The valueOf() method returns the primitive value of the HL7Message object.
 * @return {any}
 */
HL7Message.prototype.valueOf = function () {
  return JSON.parse(JSON.stringify(this._segments))
}

/**
 * Parse an HL7 encoded string. Replaces the current message values!
 * @param {string} hl7
 */
HL7Message.prototype.parse = function (hl7) {
  const [segments, encoding] = HL7Message.parser(hl7)
  this._encoding = encoding
  this._segments = segments
  Object.defineProperty(this, 'raw', {get: () => hl7, configurable: true})
}
/**
 * Returns a formatted JSON string where each segment is a single row in the returned array.
 * @return {string}
 */
HL7Message.prototype.formattedJSON = function () {
  let json = this.valueOf()
  return '[\n' + json.reduce((acc, ele, i, arr) => {
    return acc + '  ' + JSON.stringify(ele) + (i < arr.length - 1 ? ',' : '') + '\n'
  }, '') + ']'
}
/**
 * Return a new HL7Message instance that is an ACK of this HL7Message instance.
 * @return {HL7Message}
 */
HL7Message.prototype.createAckMessage = function () {
  const ack = new HL7Message()
  ack.encoding.fromJSON(this.encoding.toJSON())
  let dt = (new Date()).toISOString().replace(/[-:T]/g, '').split('.')[0]
  ack.set('MSH.3.1', this.get('MSH.5.1'))
  ack.set('MSH.4.1', this.get('MSH.6.1'))
  ack.set('MSH.5.1', this.get('MSH.3.1'))
  ack.set('MSH.6.1', this.get('MSH.4.1'))
  ack.set('MSH.7.1', dt + '.100')
  ack.set('MSH.9.1', 'ACK')
  // ack.set('MSH.10.1', ['ACK', dt].join(''))
  ack.set('MSH.10.1', dt + '.100')
  ack.set('MSH.11.1', 'P')
  ack.set('MSH.12.1', this.get('MSH.12.1'))
  ack.set('MSA.1.1', 'AA')
  ack.set('MSA.2.1', this.get('MSH.10.1'))
  return ack
}

if (typeof module !== 'undefined') {
  module.exports = HL7Message
}


/* global XML, SerializerFactory */
