/**
 * Error utility functions for converting and combining errors.
 * @namespace errorUtils
 */
var errorUtils = {}

/**
 * Converts a caught error (or any value) into a readable string,
 * including both its message and stack trace if available.
 * This is especially useful in Mirth Connect Rhino JavaScript contexts
 * where the 'error' object can be a variety of types.
 * (Formerly errorToString)
 *
 * @param {*} e - The error (or any value) caught in a catch block.
 * @return {string} Multi-line string containing the error message + stack trace.
 */
errorUtils.toString = function (e) {
  if (e === null || e === undefined) {
    return "null or undefined error object"
  }

  try {
    let output = ""

    if (typeof e.name === "string" && e.name) {
      output += e.name + ": "
    }
    if (typeof e.message === "string" && e.message) {
      output += e.message + "\n"
    }

    if (e.stack) {
      output += String(e.stack)
      return output
    }

    if (e.javaException) {
      const javaEx = e.javaException

      if (typeof javaEx.getMessage === "function") {
        const javaMsg = javaEx.getMessage()
        if (javaMsg) {
          output += javaMsg + "\n"
        }
      }

      const sw = new java.io.StringWriter()
      const pw = new java.io.PrintWriter(sw)
      javaEx.printStackTrace(pw)
      pw.flush()
      output += sw.toString()

      return output
    }

    if (typeof e.printStackTrace === "function") {
      if (typeof e.getMessage === "function") {
        const jMsg = e.getMessage()
        if (jMsg) {
          output += jMsg + "\n"
        }
      }

      const sw2 = new java.io.StringWriter()
      const pw2 = new java.io.PrintWriter(sw2)
      e.printStackTrace(pw2)
      pw2.flush()
      output += sw2.toString()

      return output
    }

    if (e.message) {
      output += e.message
      return output
    }

    if (typeof e.toString === "function") {
      output += e.toString()
      return output
    }

    try {
      output += JSON.stringify(e)
    } catch (_jsonErr) {
      output += "Unknown error: [" + Object.prototype.toString.call(e) + "]"
    }

    return output
  } catch (ex) {
    return "Error while converting error to string: " + ex
  }
}

/**
 * Combines multiple errors into a single error object. This function takes
 * two or more arguments as errors (Error objects, strings, or other types).
 * (Formerly combineErrors)
 *
 * @returns {Error|null} A new Error object with combined messages or null if no valid errors were provided.
 */
errorUtils.combine = function () {
  const args = Array.prototype.slice.call(arguments)

  const validErrors = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] != null) {
      validErrors.push(args[i])
    }
  }

  if (validErrors.length === 0) {
    return null
  }

  if (validErrors.length === 1) {
    return validErrors[0]
  }

  const combinedMessageParts = []
  for (let j = 0; j < validErrors.length; j++) {
    const currentError = validErrors[j]
    let messageText = ''

    if (currentError instanceof Error) {
      messageText = currentError.message
    } else if (typeof currentError === 'string') {
      messageText = currentError
    } else {
      messageText = String(currentError)
    }

    combinedMessageParts.push('Error ' + (j + 1) + ': ' + messageText)
  }
  if (combinedMessageParts.length === 0) {
    return null
  }
  const combinedMessage = combinedMessageParts.join('\n')

  const combinedError = new Error(combinedMessage)

  const combinedStackParts = []
  for (let k = 0; k < validErrors.length; k++) {
    const stackError = validErrors[k]
    if (stackError instanceof Error && stackError.stack) {
      combinedStackParts.push('Stack Trace ' + (k + 1) + ':\n' + stackError.stack)
    }
  }

  return combinedError
}

/* exported errorUtils */
