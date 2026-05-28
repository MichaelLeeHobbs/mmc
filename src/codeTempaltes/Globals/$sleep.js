
if (typeof $sleep === 'undefined') {
  /**
   * Sleeps for the specified number of milliseconds.
   * @param {number|string} ms
   */
  // eslint-disable-next-line no-unused-vars
  function $sleep(ms) {
    ms = parseInt(ms) || 0
    if (ms < 0) {
      return
    }
    java.lang.Thread.sleep(ms)
  }
}

/* exported $sleep */
