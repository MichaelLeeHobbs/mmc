/**
 * Encoding Class used by HL7Message to handle encoding
 * @param {Object} [options=]
 * @param {string} [options.field='|']
 * @param {string} [options.component='^']
 * @param {string} [options.fieldRepetition='~']
 * @param {string} [options.escape='\\']
 * @param {string} [options.subcomponent='&']
 * @param {string} [options.segment='\r']
 * @param {string} [options.hl7] HL7 message to parse for encoding
 * @constructor
 */
function Encoding(options) {
    options = options || {}
    this.segment = options.segment || '\r'
    if (options.hl7) {
        this.parse(options.hl7)
        return this
    }
    this.field = options.field || '|'
    this.component = options.component || '^'
    this.fieldRepetition = options.fieldRepetition || '~'
    this.escape = options.escape || '\\'
    this.subcomponent = options.subcomponent || '&'
}

Encoding.HL7REGEX = /MSH(.)(.)(.)(.)(.)/
Encoding.__encodingFields__ = ['field', 'component', 'fieldRepetition', 'escape', 'subcomponent', 'segment']
Encoding.__hl7Fields__ = ['field', 'component', 'fieldRepetition', 'escape', 'subcomponent']

/**
 * Serializes Encoding to JSON
 * @return {[field: string, component: string, fieldRepetition: string, escape: string, subcomponent: string, segment: string]}
 */
Encoding.prototype.toJSON = function () {
    return Encoding.__encodingFields__.map(key => this[key])
}

/**
 * Deserializes JSON to an Encoding instance
 * @param {[field: string, component: string, fieldRepetition: string, escape: string, subcomponent: string, segment: string]} json
 */
Encoding.prototype.fromJSON = function (json) {
    Encoding.__encodingFields__.forEach((key, index) => this[key] = json[index])
}

/**
 * Returns the string representation of Encoding
 * @return {string}
 */
Encoding.prototype.toString = function () {
    return Encoding.__hl7Fields__.map(key => this[key]).join('')
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
    const matches = Encoding.HL7REGEX.exec(hl7)
    Encoding.__hl7Fields__.forEach((key, index) => this[key] = matches[index + 1])
}

/**
 * Deserializes JSON to an Encoding instance
 * @param {[field: string, component: string, fieldRepetition: string, escape: string, subcomponent: string, segment: string]} json
 */
Encoding.fromJSON = (json) => {
    let [field, component, fieldRepetition, escape, subcomponent, segment] = json
    return new Encoding({field: field, component: component, fieldRepetition: fieldRepetition, escape: escape, subcomponent: subcomponent, segment: segment})
}

/**
 * Encode HL7 string
 * @param {string} str - HL7 string
 * @returns {string} - Encoded HL7 string
 */
Encoding.prototype.escapeString = function (str) {
    let encodedStr = str.toString()
    const handleRegExChars = (str) => str.replace(/\\/g, '\\\\').replace(/\^/g, '\\^').replace(/\|/g, '\\|')
    // Replace escape character
    encodedStr = encodedStr.replace(new RegExp(handleRegExChars(this.escape), 'g'), '\\E\\')
    // Replace field separator
    encodedStr = encodedStr.replace(new RegExp(handleRegExChars(this.field), 'g'), '\\F\\')
    // Replace component separator
    encodedStr = encodedStr.replace(new RegExp(handleRegExChars(this.component), 'g'), '\\S\\')
    // Replace subcomponent separator
    encodedStr = encodedStr.replace(new RegExp(handleRegExChars(this.subcomponent), 'g'), '\\T\\')
    // Replace repetition separator
    encodedStr = encodedStr.replace(new RegExp(handleRegExChars(this.fieldRepetition), 'g'), '\\R\\')
    // Replace line break characters
    encodedStr = encodedStr.replace(/\r/g, '\\X0D\\')
    encodedStr = encodedStr.replace(/\n/g, '\\X0A\\')
    // Replace any other non-printable characters
    encodedStr = encodedStr.replace(/[^\x20-\x7E]/g, ' ')
    return encodedStr
}

/**
 * Decode HL7 string
 * @param {string} str - Encoded HL7 string
 * @returns {string} - Decoded HL7 string
 */
Encoding.prototype.unescapeString = function (str) {
    let decodedStr = str
    // Replace escape character
    decodedStr = decodedStr.replace(/\\E\\/g, this.escape)
    // Replace field separator
    decodedStr = decodedStr.replace(/\\F\\/g, this.field)
    // Replace component separator
    decodedStr = decodedStr.replace(/\\S\\/g, this.component)
    // Replace subcomponent separator
    decodedStr = decodedStr.replace(/\\T\\/g, this.subcomponent)
    // Replace repetition separator
    decodedStr = decodedStr.replace(/\\R\\/g, this.fieldRepetition)
    // Replace segment characters
    decodedStr = decodedStr.replace(/\\.br\\/g, this.segment)
    // Replace line break characters
    decodedStr = decodedStr.replace(/\\.br/g, this.segment)
    // Replace \r if it is not used as segment character
    decodedStr = decodedStr.replace(/\\X0D\\/g, '\r')
    // Replace \n
    decodedStr = decodedStr.replace(/\\X0A\\/g, '\n')
    return decodedStr
}

if (typeof module !== 'undefined') {
    module.exports = Encoding
}

/* exported Encoding */
