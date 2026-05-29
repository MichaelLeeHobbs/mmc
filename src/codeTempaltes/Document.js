/**
 * AdvanceString constructor function.
 *
 * @param {string} str - The input string.
 * @param {object} [options={}] - Options for string manipulation.
 * @param {number} [options.maxLength=80] - The maximum length of the string (default: 80).
 * @param {boolean} [options.centered=false] - Flag indicating whether the string should be centered (default: false).
 * @param {string} [options.crlf='\n'] - The line break character(s) to use (default: '\n').
 * @param {boolean} [options.autoWrap=false] - Flag indicating whether the string should be automatically wrapped (default: false).
 * @param {RegExp} [options.crlfRegex=/\r\n|\r|\n/g] - The regular expression to match line break characters (default: /\r\n|\r|\n/g).
 * @param {object} [options.specialCharacterMap={}] - A map of special characters for character remapping (default: {}).
 * @param {boolean} [options.autoRemap=false] - Flag indicating whether automatic character remapping should be applied (default: false).
 * @returns {AdvanceString} An instance of the AdvanceString class.
 */
function AdvanceString(str, options) {
  options = options || {}
  this._options = {}
  this._string = str
  this._options.maxLength = options.maxLength || 80
  this._options.centered = !!options.centered
  this._options.crlf = options.crlf || '\n'
  this._options.autoWrap = !!options.autoWrap
  this._options.crlfRegex = options.crlfRegex || /\r\n|\r|\n/g
  this._options.specialCharacterMap = options.specialCharacterMap || {}
  this._options.autoRemap = typeof options.autoRemap === 'boolean' ? options.autoRemap : false
  if (this._options.autoRemap) {
    this._string = AdvanceString.characterRemap(str, this._options.specialCharacterMap)
  }
  this._string = this._string.replace(this._options.crlfRegex, this._options.crlf)

  if (this._options.autoWrap) {
    this._string = this._wordWrap(this._string, this._options.maxLength)
  }
  if (this._options.centered && !this._options.autoWrap) {
    this._string = this._center(this._options.maxLength, this._string)
  }
}

/**
 * Applies a template to the string using values provided.
 * @param {object} values - The values to be used in the template.
 * @param {string} [str=this.toString()] - The template string (optional, uses the instance string if not provided).
 * @returns {AdvanceString} A new AdvanceString instance with the applied template.
 */
AdvanceString.prototype.template = function (values, str) {
  return new AdvanceString(this._template(values, str || this._string), this.cloneOptions())
}

/**
 * Converts the AdvanceString instance to a string.
 * @returns {string} The string representation of the AdvanceString instance.
 */
AdvanceString.prototype.toString = function () {
  return this._string.toString()
}

/**
 * Converts the AdvanceString instance to its primitive value.
 * @returns {string} The primitive value of the AdvanceString instance.
 */
AdvanceString.prototype.valueOf = function () {
  return this.toString()
}

/**
 * Centers the string within a specified length.
 * @param {number} length - The desired length of the centered string.
 * @param {string} str - The string to be centered (optional, uses the instance string if not provided).
 * @returns {AdvanceString} A new AdvanceString instance with the centered string.
 */
AdvanceString.prototype.center = function (length, str) {
  str = str || this._string
  var options = this.cloneOptions({centered: true, maxLength: length || this._options.maxLength})

  return new AdvanceString(this._center(options.maxLength, str), options)
}

/**
 * Compresses the string by removing extra whitespace.
 * @param {string} str - The string to be compressed (optional, uses the instance string if not provided).
 * @returns {AdvanceString} A new AdvanceString instance with the compressed string.
 */
AdvanceString.prototype.compress = function (str) {
  return new AdvanceString(this._compress(str || this._string), this.cloneOptions())
}

/**
 * Clones the AdvanceString instance with optional new options and string.
 * @param {object} options - New options to be applied.
 * @param {string} str - New string to replace the original string (optional, uses the instance string if not provided).
 * @returns {AdvanceString} A new AdvanceString instance with the cloned options and string.
 */
AdvanceString.prototype.clone = function (options, str) {
  return new AdvanceString(str || this._string, this.cloneOptions(options))
}

/**
 * Clones the options of the AdvanceString instance.
 * @param {object} [opts={}] - Additional options to be included (optional).
 * @returns {object} A new object containing the cloned options.
 */
AdvanceString.prototype.cloneOptions = function (opts) {
  const newOptions = {}
  Object.keys(this._options).forEach(key => newOptions[key] = this._options[key])
  if (opts && typeof opts === 'object') {
    Object.keys(opts).forEach(key => newOptions[key] = opts[key])
  }
  return newOptions
}

/**
 * Sets a new string for the AdvanceString instance.
 * @param {string} str - The new string value.
 * @returns {AdvanceString} A new AdvanceString instance with the updated string.
 */
AdvanceString.prototype.set = function (str) {
  str = String(str)
  const newStr = this._options.autoWrap ? this._wordWrap(str, this._options.maxLength, this._options.crlf) : str
  return new AdvanceString(newStr, this._options)
}

/**
 * Applies word wrapping to the string based on a maximum line width.
 * @returns {AdvanceString} A new AdvanceString instance with the word-wrapped string.
 */
AdvanceString.prototype.wordWrap = function () {
  const newStr = this._wordWrap(this._string, this._options.maxLength)
  return new AdvanceString(newStr, this._options)
}

/**
 * Converts the AdvanceString instance to an array of strings, split on line breaks.
 * @returns {string[]} An array of strings split on line breaks.
 */
AdvanceString.prototype.toArray = function () {
  return this._string.split(this._options.crlfRegex)
}

/**
 * Splits the string into chunks of specified line count.
 * @param {number} n - The line count for each chunk.
 * @returns {string[]} An array of strings containing the split chunks.
 * @throws {Error} If the line count is negative.
 */
AdvanceString.prototype.splitOnLineCount = function (n) {
  if (n < 1) {
    // n < 1 (incl. 0) is invalid: chunk(arr, 0) would splice(0,0) forever.
    throw new Error('Cannot split on a line count less than 1!')
  }

  function chunk(arr, size) {
    let result = []

    while (arr.length) {
      result.push(arr.splice(0, size).join('\n'))
    }
    return result
  }
  return chunk(this.toArray(), n)
}

/**
 * Static method: Applies character remapping to a string using a map of special characters.
 * @param {string} str - The input string.
 * @param {object} handlers - A map of special characters for remapping.
 * @returns {string} The remapped string.
 */
AdvanceString.characterRemap = function (str, handlers) {
  const remapper = (char) => (handlers[char]) ? handlers[char] : char
  return str.split('').reduce((a, c) => a + remapper(c), '')
}

/**
 * Static method: Decodes a string using a specified encoding.
 * @param {string} str - The input string to be decoded.
 * @param {object} encoding - The encoding configuration.
 * @returns {string} The decoded string.
 */
AdvanceString.decode = function (str, encoding) {
  var newStr = String(str)
  Object.keys(encoding).forEach(key => {
    var matcher = new RegExp(encoding[key].encode, 'g')
    newStr = newStr.replace(matcher, encoding[key].decode)
  })
  return newStr
}

/**
 * Internal method: Centers the string within a specified length.
 * @param {number} length - The desired length of the centered string.
 * @param {string} str - The string to be centered.
 * @returns {string} The centered string.
 */
AdvanceString.prototype._center = function (length, str) {
  str = String(str).trim()
  const padStart = Math.floor((length - str.length) / 2) + str.length
  return str.padStart(padStart, ' ').padEnd(length)
}

/**
 * Internal method: Applies a template to the string using values provided.
 * @param {object} values - The values to be used in the template.
 * @param {string} str - The template string.
 * @returns {string} The string with the applied template.
 */
AdvanceString.prototype._template = function (values, str) {
  let newStr = String(str)
  const regex = /#([a-zA-Z0-9_]+)#+/g
  let result
  while ((result = regex.exec(str)) !== null) {
    // MUST USE LET! - Mirth/Rhino has a bug where if you use const in a loop it will not update the variable!
    let replacer = String(values[result[1]] || '').padEnd(result[0].length)
    newStr = newStr.replace(result[0], replacer)
    newStr = newStr.padEnd(result[0].length)
  }
  return newStr
}

/**
 * Internal method: Compresses the string by removing extra whitespace.
 * @param {string} str - The string to be compressed.
 * @returns {string} The compressed string.
 */
AdvanceString.prototype._compress = function (str) {
  return String(str).replace(/\s+/g, ' ')
}

/**
 * Internal method: Applies word wrapping to the string based on a maximum line width.
 * @param {string} str - The input string.
 * @param {number} width - The maximum line width.
 * @returns {string} The word-wrapped string.
 */
AdvanceString.prototype._wordWrap = function (str, width) {
  // https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
  const newStr = str.replace(
    new RegExp('(?![^\\n]{1,' + width + '}$)([^\\n]{1,' + width + '})\\s', 'g'),
    '$1\n'
  )
  // if (crlf) return newStr.replace(/\r?\n/g, crlf)
  return newStr
}

/**
 * Getter: Returns the line length of the AdvanceString instance.
 * @returns {number} The line length.
 */
Object.defineProperty(AdvanceString.prototype, 'lineLength', {
  get: function () {
    return this.toArray().length
  }
})

/**
 * Getter: Returns the options of the AdvanceString instance.
 * @returns {object} The options object.
 */
Object.defineProperty(AdvanceString.prototype, 'options', {
  get: function () {
    return this._options
  }
})

/**
 * Static property: Encodings for character mapping.
 */
Object.getOwnPropertyNames(String.prototype).forEach(prop => {
  if (AdvanceString.prototype[prop] === undefined) {
    AdvanceString.prototype[prop] = function () {
      return this._string[prop](arguments)
    }
  }
})

AdvanceString.encodings = {
  HL7: {
    //CRLF: {encode: '\\.br\\', decode: '\n'},
    FIELD_SEPARATOR: {encode: '\\\\F\\\\', decode: '|'},
    REPETITION_SEPARATOR: {encode: '\\\\R\\\\', decode: '~'},
    COMPONENT_SEPARATOR: {encode: '\\\\S\\\\', decode: '^'},
    SUBCOMPONENT_SEPARATOR: {encode: '\\\\T\\\\', decode: '&'},
    ESCAPE: {encode: '\\\\E\\\\', decode: '|'},
    LF: {encode: '\\\\X0A\\\\', decode: '\n'},
    CR: {encode: '\\\\X0D\\\\', decode: '\r'},
    CR2: {encode: '\\\\.br\\\\', decode: '\n'},
  }
}

/**
 * Template constructor function.
 * @param {string[]} [lines=[]] - The lines of the template (default: []).
 * @param {object} [options={}] - Options for the Template.
 * @param {number} [options.maxLineLength=80] - The maximum line length (default: 80).
 * @param {Object.<number,string[]>} [options.transformers={}] - Per-line transformer lists, keyed
 *   **1-based** (line 1 => key 1, e.g. `{1: ['center', 'toUpperCase']}` transforms the first line).
 *   NOTE: this 1-based keying is inconsistent with the 0-based `getLine`/`setLine`; it's a known quirk
 *   kept for back-compat (see the Roadmap). Don't change it without updating consumers in lockstep.
 * @param {string[]} [options.globalTransformer=[]] - The transformers to apply globally (default: []).
 * @returns {Template} A new Template instance.
 */
function Template(lines, options) {
  options = options || {}
  this._lines = Array.isArray(lines) ? lines : []
  this._maxLineLength = options.maxLineLength || 80
  this._transformers = options.transformers || []
  this._globalTransformer = options.globalTransformer || []
}

/**
 * Gets the line at the specified index.
 * @param {number} n - The index of the line.
 * @returns {string} The line at the specified index.
 */
Template.prototype.getLine = function (n) {
  return this._lines[n]
}

/**
 * Sets the line at the specified index.
 * @param {number} n - The index of the line.
 * @param {string} val - The value to set for the line.
 * @throws {Error} If the line length exceeds the maximum line length.
 */
Template.prototype.setLine = function (n, val) {
  if (val.length > this._maxLineLength) {
    Template.ERRORS.toLong(this._maxLineLength, val.length)
  }
  this._lines[n] = val
}

/**
 * Gets the transformers for the line at the specified index.
 * @param {number} n - The index of the line.
 * @returns {string[]} The transformers for the line.
 */
Template.prototype.getLineTransformers = function (n) {
  return this._transformers[n]
}

/**
 * Sets the transformers for a line.
 * NOTE: per-line transformers are applied **1-based** at render time (line `i`, 0-based, uses
 * `transformers[i + 1]`) — inconsistent with the 0-based `getLine`/`setLine`. This is a known quirk
 * kept for back-compat; don't "fix" it without updating consumers (e.g. the prod radiology report
 * keys transformers 1-based). See the Roadmap.
 * @param {number} n - The 1-based line position (line 1 => n = 1).
 * @param {string[]} transformers - The transformers to apply to the line.
 */
Template.prototype.setLineTransformers = function (n, transformers) {
  return this._transformers[n] = transformers
}

/**
 * Converts the Template instance to a string representation.
 * @param {object} values - The values to be used in the template.
 * @returns {string} The string representation of the Template.
 */
Template.prototype.toString = function (values) {
  const lines = []
  this._lines.forEach((text, i) => {
    let line = new AdvanceString(text, {maxLength: this._maxLineLength})
    line = line.template(values)
    if (this._globalTransformer) {
      this._globalTransformer.forEach(transformer => {
        line = line[transformer]()
      })
    }
    if (this._transformers[i + 1]) {
      this._transformers[i + 1].forEach(transformer => {
        line = line[transformer]()
      })
    }
    lines.push(line.toString())
  })
  return lines.join('\n')
}

/**
 * Getter: Returns the length of the Template (number of lines).
 * @returns {number} The length of the Template.
 */
Object.defineProperty(Template.prototype, 'length', {
  get: function () {
    return this._lines.length
  }
})

/**
 * Static property: Error handling functions for the Template.
 * Throws an error for exceeding the maximum line length.
 * @param {number} maxLength - The maximum line length.
 * @param {number} inputLength - The length of the input
 * @throws {Error} Error indicating the input exceeds the maximum line length.
 */
Template.ERRORS = {
  toLong: (maxLength, inputLength) => {
    throw new Error('Input with length of ' + inputLength + ' exceeds max length of ' + maxLength + '!')
  }
}

/**
 * Creates a getter and setter for a property on an object.
 * @param {object} obj - The object to define the property on.
 * @param {string} prop - The name of the property.
 * @param {function} getter - The getter function (default: returns the value of the property with '_' prefix).
 * @param {function} setter - The setter function (default: sets the value of the property with '' prefix).
 */
function createGetterSetter(obj, prop, getter, setter) {
  const fnGetter = getter || function () {
    return this['_' + prop]
  }
  const fnSetter = setter || function (val) {
    return this['_' + prop] = val
  }
  Object.defineProperty(obj, prop, {
    get: fnGetter,
    set: fnSetter
  })
}

/**
 * Page constructor function.
 * @param {object} [options={}] - Options for the Page.
 * @param {Template} [options.header=new Template()] - The header template (default: new Template()).
 * @param {Template} [options.footer=new Template()] - The footer template (default: new Template()).
 * @param {number} [options.maxLines=60] - The maximum number of lines per page (default: 60).
 * @param {number} [options.minLines=options.maxLines] - The minimum number of lines per page (default: maxLines).
 * @param {number} [options.maxLineLength=78] - The maximum line length (default: 78).
 * @param {number} [options.pageNumber=1] - The page number (default: 1).
 * @param {number} [options.totalPages=1] - The total number of pages (default: 1).
 * @param {object} [options.specialCharacterMap={}] - A map of special characters for character remapping (default: {}).
 * @param {boolean} [options.autoRemap=true] - Flag indicating whether automatic character remapping should be applied (default: true).
 * @param {boolean} [options.autoWrap=true] - Flag indicating whether automatic word wrapping should be applied (default: true).
 * @param {string} [options.crlf='\n'] - The line break character(s) to use (default: '\n').
 * @param {RegExp} [options.crlfRegex=/\r?\n/g] - The regular expression to match line break characters (default: /\r?\n/g).
 * @param {object} [options.data={}] - Additional data to be used in the Page (default: {}).
 * @param {string} [options.text=''] - The raw body text of the Page (default: '').
 * @returns {Page} A new Page instance.
 */
function Page(options) {
  options = options || {}
  this._header = options.header || new Template()
  this._footer = options.footer || new Template()
  this._maxLines = options.maxLines || 60
  this._minLines = options.minLines || this._maxLines;
  this._maxLineLength = options.maxLineLength || 78
  this._pageNumber = options.pageNumber || 1
  this._totalPages = options.totalPages || 1
  this._specialCharacterMap = typeof options.specialCharacterMap === 'object' ? options.specialCharacterMap : {}
  this._autoRemap = typeof options.autoRemap === 'boolean' ? options.autoRemap : true
  this._autoWrap = typeof options.autoWrap === 'boolean' ? options.autoWrap : true
  this._crlf = options.crlf || '\n'
  this._crlfRegex = options.crlfRegex || /\r?\n/g
  this._data = options.data || {}
  this._rawBody = options.text || ''
  this.setBody(this._rawBody)
}

createGetterSetter(Page.prototype, 'header')
createGetterSetter(Page.prototype, 'footer')
createGetterSetter(Page.prototype, 'maxLines')
createGetterSetter(Page.prototype, 'maxLineLength')
createGetterSetter(Page.prototype, 'pageNumber')
createGetterSetter(Page.prototype, 'totalPages')
createGetterSetter(Page.prototype, 'minLines');

/**
 * Sets the body text of the Page instance.
 * @param {string} text - The body text.
 */
Page.prototype.setBody = function (text) {
  var newText = String(text || '')
  this._body = new AdvanceString(newText, {
    maxLength: this._maxLineLength,
    crlf: this._crlf,
    crlfRegex: this._crlfRegex,
    specialCharacterMap: this._specialCharacterMap,
    autoRemap: this._autoRemap,
    autoWrap: this._autoWrap,
  })
}

/**
 * Trims the body text of the Page to fit the maximum number of lines.
 * @returns {string} The trimmed text that couldn't fit on the page.
 * @throws {Error} If the maximum lines is less than the sum of the header and footer lengths.
 */
Page.prototype.trimBody = function () {
  const maxLines = this._maxLines - (this._header.length + this._footer.length)
  if (maxLines < 0) {
    throw new Error('Cannot trim because maxLines - (header.length + footer.length) is < 0!')
  }
  const arr = this._body.splitOnLineCount(maxLines)
  this._body = this._body.set(arr[0])
  return arr.splice(1).join('\n')
}

/**
 * Converts the Page instance to a string representation.
 * @returns {string} The string representation of the Page.
 */
Page.prototype.toString = function () {
  const data = JSON.parse(JSON.stringify(this._data))
  data.pageNumber = this._pageNumber
  data.totalPages = this._totalPages
  let newStr = ''
  newStr += this._header.toString(data) + this._crlf
  newStr += this._body.toString() + this._crlf

  // Calculate current total lines including header and body
  let totalLines = newStr.split(this._crlf).length
  // Calculate required lines including the footer
  const requiredLines = this._minLines - this._footer.length

  // Ensure the page meets the minimum line requirement
  while (totalLines < requiredLines) {
    newStr += this._crlf
    totalLines++
  }

  newStr += this._footer.toString(data)
  return newStr
}

/**
 * Document constructor function.
 * @param {object} [options={}] - Options for the Document.
 * @param {Template} [options.header=new Template()] - The header template (default: new Template()).
 * @param {Template} [options.footer=new Template()] - The footer template (default: new Template()).
 * @param {number} [options.maxLines=60] - The maximum number of lines per page (default: 60).
 * @param {number} [options.minLines=options.maxLines] - The minimum number of lines per page (default: maxLines).
 * @param {number} [options.maxLineLength=78] - The maximum line length (default: 78).
 * @param {boolean} [options.autoRemap=true] - Flag indicating whether automatic character remapping should be applied (default: true).
 * @param {object} [options.specialCharacterMap={}] - A map of special characters for character remapping (default: {}).
 * @param {string} [options.crlf='\n'] - The line break character(s) to use (default: '\n').
 * @param {object} [options.data={}] - Additional data to be used in the Document (default: {}).
 * @param {string} [options.text=''] - The raw body text of the Document (default: '').
 * @returns {Document} A new Document instance.
 */
function Document(options) {
  options = options || {}
  this._header = options.header || new Template()
  this._footer = options.footer || new Template()
  this._maxLines = options.maxLines || 60
  this._minLines = options.minLines || this._maxLines
  this._maxLineLength = options.maxLineLength || 78
  this._autoRemap = typeof options.autoRemap === 'boolean' ? options.autoRemap : true
  this._specialCharacterMap = typeof options.specialCharacterMap === 'object' ? options.specialCharacterMap : {}
  this._crlf = options.crlf || '\n'
  this._data = options.data || {}
  this._text = options.text || ''
}

/**
 * Static method: Clones the data object.
 * @param {object} data - The data object to be cloned.
 * @returns {object} A new object containing the cloned data.
 */
Document.cloneData = function (data) {
  const newData = {}
  Object.keys(data).forEach(key => newData[key] = data[key])
  return newData
}

/**
 * Converts the Document instance to a string representation.
 * @returns {string} The string representation of the Document.
 */
Document.prototype.toString = function () {
  const pages = []
  const data = this._data
  const maxLines = this._maxLines
  const minLines = this._minLines
  const maxLineLength = this._maxLineLength
  const footer = this._footer
  const header = this._header
  const specialCharacterMap = this._specialCharacterMap
  const autoRemap = this._autoRemap

  function generatePages(text) {
    const page = new Page({
      text: text,
      maxLines: maxLines,
      minLines: minLines,
      maxLineLength: maxLineLength,
      header: header,
      footer: footer,
      data: JSON.parse(JSON.stringify(data)),
      specialCharacterMap: specialCharacterMap,
      autoRemap: autoRemap,
    })
    const overage = page.trimBody()
    pages.push(page)
    if (overage.length > 0) {
      generatePages(overage)
    }
  }

  generatePages(this._text)
  const pageCount = pages.length
  let rendered = ''

  pages.forEach((page, i) => {
    page._pageNumber = i + 1
    page._totalPages = pageCount
    rendered += page.toString() + this._crlf
  })
  return rendered
}

/**
 * Converts the Document instance to an array of strings.
 * @return {string[]}
 */
Document.prototype.toArray = function () {
  return this.toString().split(this._crlf)
}

/**
 * Converts the Document instance to an HL7 message.
 * @param {object} hl7msg - The HL7 message object to be modified.
 * @param {object} options - Options for converting to HL7 (default: {}).
 * @deprecated no replacement
 */
// todo needs work
Document.prototype.toHL7 = function (hl7msg, options) {
  options = options || {
    'OBX.2.1': 'FT',
    'OBX.3.1': '',
    'OBX.11.1': '',
    'OBX.14.1': '',
  }
  const text = this.toString()
  text.split(this._crlf).forEach((line, i) => {
    const obx = createSegment('OBX', hl7msg, i)
    obx['OBX.1']['OBX.1.1'] = i + 1
    obx['OBX.2']['OBX.2.1'] = options['OBX.2.1']
    obx['OBX.3']['OBX.3.1'] = options['OBX.3.1']
    obx['OBX.5']['OBX.5.1'] = line
    obx['OBX.11']['OBX.11.1'] = options['OBX.11.1']
    obx['OBX.14']['OBX.14.1'] = options['OBX.14.1']
  })
}

if (typeof module === 'object') {
  module.exports = {Document: Document, Page: Page, Template: Template, AdvanceString: AdvanceString}
}

/* exported Document, Page, Template, AdvanceString */
/* global createSegment */
