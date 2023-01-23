/**
 * Sleeps for the specified number of milliseconds.
 * @param {number} ms
 */
function $sleep(ms) {
    ms = parseInt(ms)
    if (isNaN(ms) || ms < 0) {
        return
    }
    java.lang.Thread.sleep(ms)
}

/* global java */
