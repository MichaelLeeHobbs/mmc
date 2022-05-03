/**
 * $t is an inline try/catch to take the place of optional chaining ie var d = $t(()=> a.b.c) is the same as var d = a?.b?.c
 * Check if $t is already defined. If not then define it.
 */
if (typeof $t === 'undefined') {
  const $t = (cb) => {
    try {
      return cb()
    } catch (ignore) {
      // do nothing
    }
  }
}
