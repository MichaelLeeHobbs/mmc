/**
 * @deprecated Use channelUtils.required() instead.
 * Check for required functions and libraries. This is very useful when you have a lot of code templates and you want to
 * make sure that all the required functions and libraries are available. No more cloning a channel and running it to see if
 * it works. This function will throw an error if a required function or library is missing.
 * Note: Uses the __hasBeenChecked__ global channel map variable to avoid checking multiple times.
 * @example
 * required(['$t', 'assert', 'fetch'])
 * @param {string[]} libs - The required functions and libraries.
 * @throws {Error} - If a required function or library is missing.
 */
function required(libs) {
  logger.info('DEPRECATED: required() called. Use channelUtils.required() instead. Channel: ' + channelName)
  return channelUtils.required(libs)
}

/* global channelUtils logger channelName */
/* exported required */
