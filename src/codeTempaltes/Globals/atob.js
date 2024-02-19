/**
 * Decodes a string of data which has been encoded using base-64 encoding.
 * @param {string} str - base 64 encoded string
 * @return {string} decoded string
 */
function atob(str) {
    const base64String = Packages.java.lang.String(str)
    const decodedBytes = Packages.java.util.Base64.getDecoder().decode(base64String)
    const decodedString = new Packages.java.lang.String(decodedBytes)
    return String(decodedString)
}
/* global Packages */
