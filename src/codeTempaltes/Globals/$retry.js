/**
 * $retry is a modified version of $t, which retries the callback up to a specified number of times with a provided backoff time.
 * If the function continues to throw an error after all retries, it can optionally throw the last error encountered.
 *
 * @param {function} cb - The callback function to retry.
 * @param {object} [options] - An optional object containing the following properties:
 * @param {boolean} [options.throwOnFail=false] - If true, throw the last error encountered after all retries.
 * @param {number} [options.retries=5] - The number of times to retry the callback.
 * @param {number} [options.backoff=1000] - The number of milliseconds multiplied by attempts to wait before retrying the callback.
 */
function $retry(cb, options) {
    options = options || {};
    options.throwOnFail = options.throwOnFail || false;
    options.retries = options.retries || 5;
    options.backoff = options.backoff || 1000;

    // define the sleep function in case it's not already defined
    function $sleep(ms) {
        ms = parseInt(ms) || 0
        if (ms <= 0) {
            return
        }
        java.lang.Thread.sleep(ms)
    }

    let lastError;

    for (let attempt = 1; attempt <= options.retries; attempt++) {
        try {
            return cb();
        } catch (error) {
            lastError = error;
            if (attempt < options.retries) {
                // Wait for the backoff time before retrying
                $sleep(options.backoff * attempt);
            }
        }
    }

    if (options.throwOnFail && lastError) {
        throw lastError;
    }
}
/* global java */
