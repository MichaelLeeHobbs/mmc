/**
 * Mirth channel infrastructure utilities for batch processing, message routing, and developer tooling.
 * @namespace channelUtils
 */
var channelUtils = {}

// Capture global scope reference for use by required() —
// at top-level, `this` is the global object in Mirth's Rhino engine.
var _channelUtilsGlobal = this

/**
 * Reads in the raw message and converts it into a JSON Array, then returns one element per call.
 * Used directly in Mirth batch processors.
 * (Formerly batchJsonHandler)
 * @param {boolean} [noReverse=false] By default the array will be reversed so the return order is FIFO not LIFO
 * @return {*}
 */
channelUtils.batchJson = function (noReverse) {
  const readMessage = () => {
    const message = new java.lang.StringBuilder()
    let line
    while ((line = reader.readLine()) != null) {
      message.append(String(line).trim())
    }
    try {
      const messages = JSON.parse(String(message))
      return Array.isArray(messages) ? messages : [messages]
    } catch (e) {
      e.message = 'Failed to parse message!\n' + e.message
      $gc('batchJsonError'.e.message)
      return [{error: e.message}]
    }
  }

  const getMessages = () => {
    try {
      let messages = $gc('messages') || []
      if (messages.length > 0) {
        return messages
      }
      messages = readMessage()
      messages = messages.map(ele => typeof ele !== 'string' ? JSON.stringify(ele) : ele)
      if (noReverse) {
        messages.unshift('')
      } else {
        messages.push('')
        messages = messages.reverse()
      }
      $gc('messages', messages)
      return messages
    } catch (e) {
      $gc('batchJsonError', e.message)
      $gc('messages', ['', '{"error": ' + e.message + '}'])
      return $gc('messages')
    }
  }

  return getMessages().pop() || null
}

/**
 * Reads in the raw message as text lines, then returns one line per call.
 * Used directly in Mirth batch processors.
 * (Formerly batchTextHandler)
 * @param {boolean} [noReverse=false] By default the array will be reversed so the return order is FIFO not LIFO
 * @return {string}
 */
channelUtils.batchText = function (noReverse) {
  const getMessages = () => {
    const messages = []
    let line
    while ((line = reader.readLine()) != null) {
      messages.push(String(line).trim())
    }
    if (noReverse) {
      return messages
    }
    return messages.reverse()
  }

  let messages = $gc('messages')
  if (messages == null || messages.length === 0) {
    messages = getMessages()
    $gc('messages', messages)
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    messages = null
    return ''
  }
  return messages.pop()
}

/**
 * Get the source message as a string from the current channel.
 * Not currently used but available for channel use.
 * (Formerly getSourceMsg)
 * @param {string} type - One of: raw, processedRaw, transformed, encoded, response, responseTransformed, processedResponse
 * @return {string}
 */
channelUtils.getSourceMsg = function (type) {
  const MessageController = Packages.com.mirth.connect.server.controllers.ControllerFactory.getFactory().createMessageController()
  const messageController = MessageController.getMessageContent(channelId, connectorMessage.getMessageId(), [0])
  const immutableMessage = Packages.com.mirth.connect.userutil.ImmutableMessage(messageController)
  const source = immutableMessage.getConnectorMessages().get(0)

  const types = {
    raw: () => source.getRawData(),
    processedRaw: () => source.getProcessedRawData(),
    transformed: () => source.getTransformedData(),
    encoded: () => source.getEncodedData(),
    response: () => source.getResponseData(),
    responseTransformed: () => source.getResponseTransformedData(),
    processedResponse: () => source.getProcessedResponseData(),
  }

  return types[type]()
}

/**
 * Maps the route a message took getting to this channel into $c('route').
 * Designed to be placed in Global Scripts - Preprocessor Script.
 * (Formerly mapMessageRoute)
 * @return {string|undefined}
 */
channelUtils.mapMessageRoute = function () {
  try {
    let sourceChannelIds = sourceMap.get('sourceChannelIds') || sourceMap.get('sourceChannelId')
    let sourceMessageIds = sourceMap.get('sourceMessageIds') || sourceMap.get('sourceMessageId')
    if (sourceChannelIds && sourceMessageIds) {
      sourceChannelIds = sourceChannelIds.toArray ? sourceChannelIds.toArray() : [sourceChannelIds]
      sourceMessageIds = sourceMessageIds.toArray ? sourceMessageIds.toArray() : [sourceMessageIds]
    } else {
      sourceChannelIds = []
      sourceMessageIds = []
    }
    const token = '\n     =>'
    let route = sourceChannelIds.map((id, i) => String(ChannelUtil.getChannelName(id)) + ':' + sourceMessageIds[i]).join(token)
    if (connectorMessage && connectorMessage.getMessageId) {
      route += token + '(' + channelName + ':' + connectorMessage.getMessageId() + ')'
    }
    $c('route', route)
    return route
  } catch (e) {
    $c('route', e.message + '\n' + e.stack)
  }
}

/**
 * Route a JSON message to a channel by channel id/name and include metadata for tracking message flow.
 * (Formerly routeJsonMsg)
 * @param {string} cid - Channel ID (UUID) or channel name
 * @param {Object} json - The JSON message to route
 * @return {*}
 */
channelUtils.routeJsonMsg = function (cid, json) {
  if (!json.metadata) {
    json.metadata = {}
    const sourceChannelIds = sourceMap.get('sourceChannelIds') || sourceMap.get('sourceChannelId')
    const sourceMessageIds = sourceMap.get('sourceMessageIds') || sourceMap.get('sourceMessageId')
    if (sourceChannelIds && sourceMessageIds) {
      json.metadata.sourceChannelIds = sourceChannelIds.toArray ? sourceChannelIds.toArray() : [sourceChannelIds]
      json.metadata.sourceMessageIds = sourceMessageIds.toArray ? sourceMessageIds.toArray() : [sourceMessageIds]
      json.metadata.sourceChannelNames = json.metadata.sourceChannelIds.map(id => ChannelUtil.getChannelName(id))
    }
  }
  if (!Array.isArray(json.metadata.sourceChannelIds)) {
    json.metadata.sourceChannelIds = []
  }
  if (!Array.isArray(json.metadata.sourceMessageIds)) {
    json.metadata.sourceMessageIds = []
  }
  if (!Array.isArray(json.metadata.sourceChannelNames)) {
    json.metadata.sourceChannelNames = []
  }

  json.metadata.channelId = channelId
  json.metadata.channelName = channelName
  json.metadata.messageId = connectorMessage.getMessageId()
  json.metadata.errorMessage = json.errorMessage || ''
  json.metadata.errorStack = json.errorStack || ''

  json.metadata.sourceChannelIds.push(channelId)
  json.metadata.sourceMessageIds.push(json.metadata.messageId)
  json.metadata.sourceChannelNames.push(channelName)

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cid)
  if (isUUID) {
    return router.routeMessageByChannelId(cid, JSON.stringify(json, null, 2))
  } else {
    return router.routeMessage(cid, JSON.stringify(json, null, 2))
  }
}

/**
 * Rule-driven response handler for a response transformer. Inspects the response error
 * message and applies the first matching handler rule to retry, requeue, or override the
 * response status. Can only be called from a response transformer.
 * (Formerly responseHandler)
 * @param {Array.<{key: string, responseStatus: string, maxAttempts: number, handler: function}>} handlers
 *   Rule list. `key` is matched against the response error message; `maxAttempts` of 0 sets the
 *   status immediately, negative requeues indefinitely, positive requeues until exceeded; optional
 *   `handler(response, msg)` may return {responseStatus, result}.
 * @return {*}
 */
channelUtils.responseHandler = function (handlers) {
  // responseStatus == QUEUED / ERROR / SENT / FILTERED
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

/**
 * Check for required functions and libraries. Throws if a required code template library is missing.
 * Very useful when cloning channels — catches missing dependencies at deploy time instead of runtime.
 * Note: Uses the __hasBeenChecked__ global channel map variable to avoid checking multiple times.
 * (Formerly required)
 * @example
 * channelUtils.required(['$t', 'assert', 'fetch'])
 * @param {string[]} libs - The required functions and libraries.
 * @throws {Error} - If a required function or library is missing.
 */
channelUtils.required = function (libs) {
  const ObjectXMLSerializer = com.mirth.connect.model.converters.ObjectXMLSerializer
  const ControllerFactory = com.mirth.connect.server.controllers.ControllerFactory
  const configurationController = ControllerFactory.getFactory().createConfigurationController()
  const config = configurationController.getServerConfiguration()
  const serializer = ObjectXMLSerializer.getInstance()

  const hasBeenChecked = $gc('hasBeenChecked')
  if (hasBeenChecked) {
    return
  }

  const found = []
  const missingLibs = []
  const foundMissing = []

  // Use the captured global scope reference instead of `this`
  // so this works correctly when called as channelUtils.required()
  libs.forEach((lib) => {
    const isMissing = typeof _channelUtilsGlobal[lib] === 'undefined'
    if (isMissing) {
      missingLibs.push(lib)
    }
  })

  const xmlString = serializer.serialize(config).replace('&#x1a;', '')
  const xmlConfig = new XML(xmlString)
  const json = JSON.parse(XmlUtil.toJson(xmlConfig))

  let _codeTemplateLibrary = json.serverConfiguration.codeTemplateLibraries.codeTemplateLibrary
  _codeTemplateLibrary = Array.isArray(_codeTemplateLibrary) ? _codeTemplateLibrary : [_codeTemplateLibrary]
  _codeTemplateLibrary.forEach((codeTemplateLibrary) => {
    let _codeTemplates = codeTemplateLibrary.codeTemplates
    if (_codeTemplates) {
      let _codeTemplate = _codeTemplates.codeTemplate
      _codeTemplate = Array.isArray(_codeTemplate) ? _codeTemplate : [_codeTemplate]
      _codeTemplate.forEach((codeTemplate) => {
        missingLibs.forEach((lib) => {
          if (codeTemplate.name.indexOf(lib) > -1) {
            const hint = 'Are you missing code template library: "' + codeTemplateLibrary.name + '" for code template: "' + codeTemplate.name + '" for requirement: "' + lib + '"?'
            found.push(hint)
            foundMissing.push(lib)
          }
        })
      })
    }
  })
  if (found.length > 0) {
    const notFound = missingLibs.filter((lib) => !(foundMissing.indexOf(lib) > -1))
    found.unshift('Missing libraries:')
    if (notFound.length > 0) {
      found.push('Requirements not found: ' + notFound.join(', '))
    }
    throw new Error(found.join('\t\n'))
  }
  $gc('__hasBeenChecked__', true)
}

/* global reader XmlUtil com response msg responseStatus ERROR QUEUED responseErrorMessage */
/* exported channelUtils */
