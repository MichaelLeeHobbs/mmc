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
 * // Array destructuring works in Mirth's Rhino (verified on 1.7.13, every languageVersion).
 * const [data, error] = tryCatch(function () { return fetch('https://example.com/api').json() })
 * if (error) { // handle the error
 * } else { // use data
 * }
 *
 * // Index access also works if you prefer it:
 * // var result = tryCatch(fn); var data = result[0], error = result[1]
 */
function tryCatch(fn, mapError) {
  try {
    return [fn(), null]
  } catch (error) {
    return [null, typeof mapError === 'function' ? mapError(error) : error]
  }
}

/* exported tryCatch */
