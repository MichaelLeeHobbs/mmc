/**
 * String utility functions for text manipulation, encoding, and report processing.
 * @namespace stringUtils
 */
var stringUtils = {}

/**
 * Encodes line breaks in text.
 * @param {string} text - text to encode line breaks in
 * @param {string} [encoding='\\.br\\'] - encoding to use for line breaks
 * @return {string}
 */
stringUtils.encodeLineBreak = function (text, encoding) {
  return String(text || '').replace(/\\X0A\\|\\\\X0A\\\\|\r\n|\r|\n|\\par|\\.br\\/g, encoding || '\\.br\\')
}

/**
 * Splits a string on the first space less than length and on natural line breaks.
 * (Formerly splitStringOnSpaceAndLength)
 * @param {string} str
 * @param {number} length
 * @param {boolean} [noTrim=false] should each element not be trimmed?
 * @return {string[]}
 */
stringUtils.wrapText = function (str, length, noTrim) {
  const regex = new RegExp('(.{1,' + length + '}(\\s|$))\\s*', 'g')
  const matches = String(str).match(regex) || ['']
  return matches.map((ele) => (noTrim) ? ele : ele.trim())
}

/**
 * Splits an array of string elements on a space after "length" characters.
 * (Formerly splitStringArray)
 * @param {string[]} arr - strings to split
 * @param {number} length - desired length
 * @return {string[]}
 */
stringUtils.wrapArray = function (arr, length) {
  const splitString = (str, len) => {
    str = '' + str
    const regex = new RegExp('(.{1,' + len + '}(\\s|$))\\s*', 'g')
    const matches = str.match(regex) || [str]
    return matches.map((ele) => ele.trim())
  }

  const newArr = []
  arr.forEach(ele => splitString(ele, length).forEach(seg => newArr.push(seg)))
  return newArr
}

/**
 * Iterates over an array limiting the length of each element to length, splitting on space and length as needed.
 * (Formerly limitArrElementLength)
 * @param {string[]} arr - The array to iterate over
 * @param {number} length - The length to limit the elements to
 * @return {string[]}
 */
stringUtils.limitElementLength = function (arr, length) {
  const out = []
  arr.forEach((line) => {
    const _line = line.trim()
    if (_line.length > length) {
      stringUtils.wrapText(_line, length).forEach(ln => out.push(ln))
    } else {
      out.push(_line)
    }
  })
  return out
}

/**
 * Splits a report into body and impression segments.
 * @param {string} report
 * @returns {{impression: string, body: string}}
 */
stringUtils.splitReportText = function (report) {
  const impRegex = /^\s*impression[s:]?/igm
  let body = ''
  report = report.replace(/\\X0A\\|\\par|\r?\n/g, '\r\n')
  let impression
  if (impRegex.test(report)) {
    const reportArr = report.split(impRegex)
    body = reportArr.shift()
    impression = 'IMPRESSION: ' + reportArr.join(' IMPRESSION:')
  }
  return {
    body: body,
    impression: impression || report
  }
}

/**
 * Splits the findings and impression from the given text.
 * @param {string} text
 * @return {[string, string]} - An array where the first element is the impression and the second element is the findings.
 */
stringUtils.splitFindingsAndImpression = function (text) {
  const findings = []
  const impression = []
  let isImpression = false

  text.split('\n').forEach((line) => {
    if (line.trim().toUpperCase().startsWith('IMPRESSION')) {
      isImpression = true
    }
    if (isImpression) {
      impression.push(line)
    } else {
      findings.push(line)
    }
  })
  if (impression.length === 0) {
    return [text.trim(), '']
  }

  return [impression.join('\n').trim(), findings.join('\n').trim()]
}

/**
 * Filters out lines from text that contain any of the specified strings.
 * @param {string} text - The text to filter
 * @param {string[]} filterStrings - Array of strings to filter out (lines containing any of these will be removed)
 * @returns {string} The filtered text with matching lines removed and trimmed
 */
stringUtils.filterLinesContaining = function (text, filterStrings) {
  if (!text || !filterStrings || filterStrings.length === 0) {
    return String(text || '').trim()
  }

  return String(text)
    .split('\n')
    .filter(line => !filterStrings.some(filterStr => line.includes(filterStr)))
    .join('\n')
    .trim()
}

/**
 * Decodes a string of data which has been encoded using base-64 encoding.
 * @param {string} str - base 64 encoded string
 * @return {string} decoded string
 */
stringUtils.atob = function (str) {
  const base64String = Packages.java.lang.String(str)
  const decodedBytes = Packages.java.util.Base64.getDecoder().decode(base64String)
  const decodedString = new Packages.java.lang.String(decodedBytes)
  return String(decodedString)
}

/**
 * Encodes a string of data using base-64 encoding.
 * @param {string} str - the string to be encoded
 * @return {string} base 64 encoded string
 */
stringUtils.btoa = function (str) {
  const inputString = new Packages.java.lang.String(str)
  const encodedBytes = Packages.java.util.Base64.getEncoder().encode(inputString.getBytes())
  const encodedString = new Packages.java.lang.String(encodedBytes)
  return String(encodedString).replace(/(\r\n|\n|\r)/gm, '')
}

/* exported stringUtils */

// For Jest testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = stringUtils
}
