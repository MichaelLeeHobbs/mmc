/**
 * Converts XML into HL7 and cleans it.
 * @param xml
 * @return {*}
 */
function xmlToHL7(xml) {
    return SerializerFactory.getSerializer('HL7V2').toXML(
      String(xml.toString())
        .replace(/^ +/gm, '')
        .replace(/null/g, '')
        .replace(/undefined/g, '')
        .replace(/[^\r\n\x20-\x7E]/g, ' ')
        .trim()
    )
}
