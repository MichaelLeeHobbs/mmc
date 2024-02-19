/**
 * Encodes a string of data using base-64 encoding.
 * @param {string} str - the string to be encoded
 * @return {string} base 64 encoded string
 */
function btoa(str) {
    const inputString = new Packages.java.lang.String(str);
    const encodedBytes = Packages.java.util.Base64.getEncoder().encode(inputString.getBytes());
    const encodedString = new Packages.java.lang.String(encodedBytes);
    return String(encodedString).replace(/(\r\n|\n|\r)/gm, '');
}
/* global Packages */
