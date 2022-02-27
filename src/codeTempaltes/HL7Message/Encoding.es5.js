/**
 * Encoding Class used by HL7Message to handle encoding
 * @param {Object} [options=]
 * @param {string} [options.field='|']
 * @param {string} [options.component='^']
 * @param {string} [options.fieldRepetition='~']
 * @param {string} [options.escape='\']
 * @param {string} [options.subcomponent='&']
 * @param {string} [options.segment='\r']
 * @param {string} [options.hl7] HL7 message to parse for encoding
 * @constructor
 */
function Encoding(options) {
  options = options || {}
  this.field = options.field || '|'
  this.component = options.component || '^'
  this.fieldRepetition = options.fieldRepetition || '~'
  this.escape = options.escape || '\\'
  this.subcomponent = options.subcomponent || '&'
  this.segment = options.segment || '\r'
  if (options.hl7) {
    this.parse(options.hl7)
  }
}

/**
 * Serializes Encoding to JSON
 * @return {[field: string, component: string, fieldRepetition: string, escape: string, subcomponent: string, segment: string]}
 */
Encoding.prototype.toJSON = function () {
  let {field, component, fieldRepetition, escape, subcomponent, segment} = this
  return [field, component, fieldRepetition, escape, subcomponent, segment]
}

/**
 * Deserializes JSON to an Encoding instance
 * @param {[field: string, component: string, fieldRepetition: string, escape: string, subcomponent: string, segment: string]} json
 */
Encoding.prototype.fromJSON = function (json) {
  let [field, component, fieldRepetition, escape, subcomponent, segment] = json
  this.field = field
  this.component = component
  this.fieldRepetition = fieldRepetition
  this.escape = escape
  this.subcomponent = subcomponent
  this.segment = segment
}
/**
 * Returns the string representation of Encoding
 * @return {string}
 */
Encoding.prototype.toString = function () {
  let {field, component, fieldRepetition, escape, subcomponent} = this
  return [field, component, fieldRepetition, escape, subcomponent].join('')
}

/**
 * Returns a clone of the Encoding instance
 * @return {Encoding}
 */

Encoding.prototype.clone = function () {
  return Encoding.fromJSON(this.toJSON())
}

/**
 * Parses HL7 string to get the encoding characters
 * @param {string} hl7
 */
Encoding.prototype.parse = function (hl7) {
  let matches = Encoding.HL7REGEX.exec(hl7)
  // let {field, component, fieldRepetition, escape, subcomponent} = matches.groups
  let [, field, component, fieldRepetition, escape, subcomponent] = matches
  this.field = field
  this.component = component
  this.fieldRepetition = fieldRepetition
  this.escape = escape
  this.subcomponent = subcomponent
}

// this causes babel to use WeakMap which is not supported in mirth
// Encoding.HL7REGEX = /MSH(?<field>.)(?<component>.)(?<fieldRepetition>.)(?<escape>.)(?<subcomponent>.)/
Encoding.HL7REGEX = /MSH(.)(.)(.)(.)(.)/

// noinspection JSUnresolvedVariable
/**
 * Deserializes JSON to an Encoding instance
 * @param {[field: string, component: string, fieldRepetition: string, escape: string, subcomponent: string, segment: string]} json
 */
Encoding.fromJSON = (json) => {
  let [field, component, fieldRepetition, escape, subcomponent, segment] = json
  return new Encoding({field: field, component: component, fieldRepetition: fieldRepetition, escape: escape, subcomponent: subcomponent, segment: segment})
}

if (typeof module !== 'undefined') {
  module.exports = Encoding
}

