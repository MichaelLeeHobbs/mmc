// noinspection JSUndeclaredVariable,EqualityComparisonWithCoercionJS

function responseHandler(handlers) {
  // responseStatus == QUEUED / ERROR / SENT / FILTERED
  // responseStatusMessage
  // responseErrorMessage
  // responseHeaders
  const responseHandlerDebug = {}
  $co('responseHandlerDebug', responseHandlerDebug)

  if (!response || !msg) {
    throw new Error('responseHandler can only be called in a response transformer!')
  }
  const attempts = parseInt(connectorMessage.getSendAttempts())
  responseHandlerDebug.attempts = attempts
  responseHandlerDebug.responseStatus = String(responseStatus)

  // eslint-disable-next-line eqeqeq
  if (responseStatus == ERROR) {
    const error = String(responseErrorMessage)
    $c('RESULT', error)
    const config = handlers.find(ele => error.indexOf(ele.key) > -1)
    responseHandlerDebug.config = config
    config.maxAttempts = config.maxAttempts || 0

    if (config.maxAttempts === 0) {
      // eslint-disable-next-line no-global-assign
      return responseStatus = config.responseStatus
    }

    if (config.maxAttempts < 0 || config.maxAttempts > attempts) {
      // eslint-disable-next-line no-global-assign
      return responseStatus = QUEUED
    }

    if (typeof config.handler === 'function') {
      const results = config.handler(response, msg)
      responseHandlerDebug.functionResults = results
      if (results.responseStatus) {
        $c('RESULT', results.result || error)
        // eslint-disable-next-line no-global-assign
        return responseStatus = results.responseStatus
      }
    }

    // eslint-disable-next-line no-global-assign
    responseStatus = ERROR
  }
}


/* global $, response, msg, responseStatus, SENT, QUEUED, ERROR, $c, $co, connectorMessage, responseErrorMessage */

