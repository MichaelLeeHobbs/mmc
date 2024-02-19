/**
 * Sleeps for the specified number of milliseconds.
 * @param {number|string} ms
 */
function $sleep(ms) {
    ms = parseInt(ms) || 0
    if (ms <= 0) {
        return
    }
    java.lang.Thread.sleep(ms)
}

/* global java */
