/**
 * HL7 v2 utility functions for repairing and serializing HL7 messages.
 * @namespace hl7Utils
 */
var hl7Utils = {}

/**
 * Repairs an HL7 message that has unescaped line breaks inside fields.
 * Strips stray \n/\r\n, then rejoins on \r only where the next line starts a new segment.
 * (Formerly fixHL7LineBreaks)
 * @param {string} hl7
 * @returns {string}
 */
hl7Utils.fixLineBreaks = function (hl7) {
  return hl7.replace(/\n|\r\n/g, '')
    .split('\r')
    .reduce((acc, cur, i) => {
      if (i === 0) {
        return cur
      }
      if (/^[\d\w]{3}\|/.test(cur)) {
        acc += '\r' + cur
      } else {
        acc += cur
      }
      return acc
    }, '')
}

/**
 * Converts Mirth XML into encoded HL7 v2 and cleans common artifacts.
 * (Formerly xmlToHL7)
 * @param {XML|string} xml
 * @return {*}
 */
hl7Utils.fromXml = function (xml) {
  return SerializerFactory.getSerializer('HL7V2').toXML(
    String(xml.toString())
      .replace(/^ +/gm, '')
      .replace(/null/g, '')
      .replace(/undefined/g, '')
      .replace(/[^\r\n\x20-\x7E]/g, ' ')
      .trim()
  )
}

/* global SerializerFactory */
/* exported hl7Utils */
