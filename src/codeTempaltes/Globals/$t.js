/**
 * $t is an inline try/catch to take the place of optional chaining ie var d = $t(()=> a.b.c) is the same as var d = a?.b?.c
 * Check if $t is already defined. If not then define it.
 */
if (typeof $t === 'undefined') {
  // eslint-disable-next-line no-unused-vars
  function $t(cb) {
    try {
      return cb()
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // do nothing
    }
  }
}
/* exported $t */
