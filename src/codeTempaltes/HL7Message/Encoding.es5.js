function Encoding(options) {
  options = options || {}
  this._field = options.field || '|'
  this._component = options.component || '^'
  this._fieldRepetition = options.fieldRepetition || '~'
  this._escape = options.escape || '\\'
  this._subcomponent = options.subcomponent || '&'
  this._segment = options.segment || '\r'
  if (options.hl7) {
    this.parse(options.hl7)
  }

  Object.defineProperty(this, 'segment', {
    get: () => this._segment,
    set: (value) => {
      this._segment = value
    },
    configurable: false,
    enumerable: true
  })
  Object.defineProperty(this, 'field', {
    get: () => this._field,
    set: (value) => {
      this._field = value
    },
    configurable: false,
    enumerable: true
  })
  Object.defineProperty(this, 'component', {
    get: () => this._component,
    set: (value) => {
      this._component = value
    },
    configurable: false,
    enumerable: true
  })
  Object.defineProperty(this, 'fieldRepetition', {
    get: () => this._fieldRepetition,
    set: (value) => {
      this._fieldRepetition = value
    },
    configurable: false,
    enumerable: true
  })
  Object.defineProperty(this, 'escape', {
    get: () => this._escape,
    set: (value) => {
      this._escape = value
    },
    configurable: false,
    enumerable: true
  })
  Object.defineProperty(this, 'subcomponent', {
    get: () => this._subcomponent,
    set: (value) => {
      this._subcomponent = value
    },
    configurable: false,
    enumerable: true
  })

}

Encoding.prototype.encode = function (val) {
  let [field, component, fieldRepetition, escape, subcomponent,/*segment*/] = this.toJSON()
  let encoding = [field, component, fieldRepetition, escape, subcomponent]
  return val.split('').map(char => encoding.indexOf(char) > -1 ? [escape, char].join('') : char).join('')
}

Encoding.prototype.decode = function (val) {
  let escaped = false
  return val.split('').reduce((decoded, char) => {
    if (!escaped && char !== this.escape) {
      return decoded + char
    }
    escaped = char === this.escape
    return (escaped) ? decoded : decoded + char
  }, '')
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
  let {field, component, fieldRepetition, escape, subcomponent,/*segment*/} = this
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

module.exports = Encoding
