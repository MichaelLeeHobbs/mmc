/**
 * Synchronous Go-style try/catch that returns a [data, error] tuple instead of throwing,
 * forcing the caller to handle errors explicitly up front. (Rhino/Mirth has no Promises, so
 * this wraps a synchronous function rather than awaiting one.)
 *
 * Differs from $t, which swallows the error and returns undefined; tryCatch surfaces the error.
 * See also $t for the swallow-and-ignore variant.
 *
 * @param {function} fn - function to execute; its return value becomes `data`
 * @param {function} [mapError] - optional transform applied to the caught error
 * @return {[*, null]|[null, *]} [data, null] on success, [null, error] on failure
 * @example
 * var result = tryCatch(function () { return fetch('https://example.com/api').json() })
 * // Prefer index access over destructuring; this Rhino build may not support array destructuring.
 * var data = result[0], error = result[1]
 * if (error) { // handle the error
 * } else if (data == null) { // shouldn't happen, but handle defensively
 * } else { // use data
 * }
 */
function tryCatch(fn, mapError) {
  try {
    return [fn(), null]
  } catch (error) {
    return [null, typeof mapError === 'function' ? mapError(error) : error]
  }
}

/* exported tryCatch */
