/**
 * Repairs and HL7 message that has unescaped line breaks
 * @param {string} hl7
 * @returns {string}
 */
function fixHL7LineBreaks(hl7) {
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
