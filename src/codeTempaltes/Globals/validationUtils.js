/**
 * Validation utility functions.
 * @namespace validationUtils
 */
var validationUtils = {}

/**
 * Validate and parse an integer value.
 * (Formerly validateInt)
 * @param {string|number} val - Value to validate
 * @param {object} [opts={}] - Validation options
 * @param {number} [opts.default=0] - Default value if validation fails
 * @param {number} [opts.min] - Minimum value
 * @param {number} [opts.max] - Maximum value
 * @return {number}
 */
validationUtils.parseInt = function (val, opts) {
  opts = opts || {}
  opts.default = (opts.default !== undefined) ? opts.default : 0
  const parsedValue = parseInt(val, 10)
  if (isNaN(parsedValue)) {
    return opts.default
  }
  if (opts.min !== undefined && parsedValue < opts.min) {
    return opts.min
  }
  if (opts.max !== undefined && parsedValue > opts.max) {
    return opts.max
  }
  return parsedValue
}

/* exported validationUtils */
