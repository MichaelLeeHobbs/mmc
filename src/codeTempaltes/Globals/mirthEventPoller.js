/**
 * Generic poller for Mirth's internal event log.
 *
 * Polls the Mirth event controller for events matching a given event Name (e.g. 'Reprocess messages'),
 * de-duplicates them across poll cycles, and hands each NEW event to a caller-supplied `onEvent` handler
 * as a clean parsed object. The poller itself is intentionally free of any business logic - what to do
 * with an event (write an audit log, notify, etc.) is entirely the caller's decision.
 *
 * State (last poll time, processed event IDs) is tracked in `$gc` so only new events are processed and
 * so de-duplication survives across poll cycles within a channel deployment.
 *
 * onEvent contract: when provided, `options.onEvent(parsed)` is invoked once per new event, where `parsed`
 * is `{ id, name, userId, username, channelId, channelName, messageIds (number[]), attributes (object) }`.
 *
 * Requires: com (Mirth/Java classpath), ChannelUtil, $t, $gc, $co
 *
 * Usage (in a poller channel transformer):
 *   mirthEventPoller.poll({ eventName: 'Reprocess messages' })
 *
 * @example
 * mirthEventPoller.poll({
 *   eventName: 'Reprocess messages',
 *   onEvent: function (e) {
 *     logger.info('reprocess by ' + e.username + ' on ' + e.channelName)
 *   }
 * })
 *
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
var mirthEventPoller = {}

/**
 * Internal: get Mirth controller instances.
 * Caches on $gc to avoid re-creating each poll cycle.
 */
mirthEventPoller._getControllers = function () {
  var cached = $gc('mirthEventPoller_controllers')
  if (cached) return cached

  var ControllerFactory = com.mirth.connect.server.controllers.ControllerFactory
  var controllers = {
    event: ControllerFactory.getFactory().createEventController(),
    user: ControllerFactory.getFactory().createUserController(),
    message: ControllerFactory.getFactory().createMessageController(),
  }
  $gc('mirthEventPoller_controllers', controllers)
  return controllers
}

/**
 * Internal: resolve a Mirth userId to a username string.
 * Caches lookups in $gc for the lifetime of the channel deployment.
 */
mirthEventPoller._resolveUsername = function (userId) {
  if (!userId) return null

  var cacheKey = 'mirthEventPoller_user_' + userId
  var cached = $gc(cacheKey)
  if (cached) return cached

  var controllers = mirthEventPoller._getControllers()
  var username = $t(() => {
    var user = controllers.user.getUser(userId, null)
    return user ? String(user.getUsername()) : null
  })

  if (!username) {
    username = 'userId:' + userId
  }
  $gc(cacheKey, username)
  return username
}

/**
 * Internal: resolve a channelId to a channel name.
 */
mirthEventPoller._resolveChannelName = function (cid) {
  if (!cid) return 'unknown'
  return $t(() => String(ChannelUtil.getChannelName(cid))) || cid
}

/**
 * Internal: read a single custom metadata column value for a message.
 * Uses MessageController to fetch the metadata row for the source connector (metadataId 0).
 *
 * @param {string} cid - Channel ID
 * @param {number} messageId - Message ID
 * @param {string} column - The custom metadata column name (e.g. 'ACCESSION', 'MRN')
 * @return {string|null} the column value or null
 */
mirthEventPoller._getMetadataValue = function (cid, messageId, column) {
  var controllers = mirthEventPoller._getControllers()
  return $t(() => {
    var msg = controllers.message.getMessageContent(cid, messageId, [0])
    if (!msg) return null
    var connMap = msg.getConnectorMessages()
    var keys = connMap.keySet().toArray()
    if (keys.length === 0) return null
    var conn = connMap.get(keys[0])
    if (!conn || typeof conn.getMetaDataMap !== 'function') return null
    var metaDataMap = conn.getMetaDataMap()
    if (!metaDataMap) return null
    var value = metaDataMap.get(column)
    return value ? String(value) : null
  })
}

/**
 * Internal: parse event attributes map (Java Map) into a JS object.
 */
mirthEventPoller._parseAttributes = function (attributes) {
  if (!attributes) return {}
  var result = {}
  $t(() => {
    var entries = attributes.entrySet().toArray()
    for (var i = 0; i < entries.length; i++) {
      result[String(entries[i].getKey())] = String(entries[i].getValue()).trim()
    }
  })
  return result
}

/**
 * Internal: parse channelId and channelName from the Mirth event "channel" attribute.
 * Format: "Channel[id=uuid,name=channelName]\n"
 * @param {string} channelStr
 * @return {{channelId: string|null, channelName: string|null}}
 */
mirthEventPoller._parseChannelAttribute = function (channelStr) {
  if (!channelStr) return {channelId: null, channelName: null}
  var idMatch = channelStr.match(/id=([0-9a-f-]+)/)
  var nameMatch = channelStr.match(/name=([^\]]+)/)
  return {
    channelId: idMatch ? idMatch[1] : null,
    channelName: nameMatch ? nameMatch[1].trim() : null,
  }
}

/**
 * Internal: parse a message ID string into an array of integer message IDs.
 * Handles: single ("123"), comma-separated ("123,456"), range ("123-126"),
 * and JSON array ("[123,456]").
 *
 * @param {string} str
 * @return {number[]}
 */
mirthEventPoller._parseMessageIds = function (str) {
  if (!str || str === 'null' || str === 'undefined') return []
  str = String(str).trim()

  // JSON array: [123, 456]
  if (str.charAt(0) === '[') {
    return $t(() => JSON.parse(str).map((id) => parseInt(id)).filter((id) => !isNaN(id))) || []
  }

  // Comma-separated: "123,456,789"
  if (str.indexOf(',') > -1) {
    return str.split(',').map((s) => parseInt(s.trim())).filter((id) => !isNaN(id))
  }

  // Range: "123-126"
  if (str.indexOf('-') > -1) {
    var parts = str.split('-')
    var start = parseInt(parts[0].trim())
    var end = parseInt(parts[1].trim())
    if (isNaN(start) || isNaN(end)) return []
    var ids = []
    for (var i = start; i <= end; i++) {
      ids.push(i)
    }
    return ids
  }

  // Single ID
  var single = parseInt(str)
  return isNaN(single) ? [] : [single]
}

/**
 * Internal: get all custom metadata columns for a message.
 * @param {string} cid - Channel ID
 * @param {number} messageId - Message ID
 * @return {Object|null} map of column names to values
 */
mirthEventPoller._getMessageMetadata = function (cid, messageId) {
  var controllers = mirthEventPoller._getControllers()
  try {
    var msg = controllers.message.getMessageContent(cid, messageId, [0])
    if (!msg) return {error: 'message not found'}
    var connMap = msg.getConnectorMessages()
    var keys = connMap.keySet().toArray()
    if (keys.length === 0) return {error: 'no connector messages'}
    var conn = connMap.get(keys[0])
    if (!conn || typeof conn.getMetaDataMap !== 'function') return {error: 'connector has no getMetaDataMap'}
    var metaDataMap = conn.getMetaDataMap()
    if (!metaDataMap) return {error: 'metadata map is null'}

    var result = {}
    var entries = metaDataMap.entrySet().toArray()
    for (var j = 0; j < entries.length; j++) {
      var key = String(entries[j].getKey())
      var val = entries[j].getValue()
      result[key] = val !== null ? String(val) : null
    }
    return result
  } catch (e) {
    return {error: String(e)}
  }
}

/**
 * Poll Mirth's internal event log for new events matching `options.eventName` and hand each new
 * event to `options.onEvent`. De-duplicates by event id across poll cycles.
 *
 * @param {Object} options
 * @param {string} options.eventName - The Mirth event Name to match exactly (e.g. 'Reprocess messages').
 * @param {number} [options.lookbackSeconds=120] - How far back to look on the first run.
 * @param {number} [options.maxEvents=50] - Max events to fetch per poll.
 * @param {function} [options.onEvent] - Called once per new event with the parsed event object
 *   `{ id, name, userId, username, channelId, channelName, messageIds (number[]), attributes (object) }`.
 * @param {boolean} [options.dedupe=true] - When true, skip events whose id was processed in a prior cycle.
 * @return {string[]} - Array of human-readable result messages.
 */
mirthEventPoller.poll = function (options) {
  options = options || {}
  var eventName = options.eventName
  var lookbackSeconds = options.lookbackSeconds || 120
  var maxEvents = options.maxEvents || 50
  var onEvent = typeof options.onEvent === 'function' ? options.onEvent : null
  var dedupe = options.dedupe !== false

  if (!eventName) {
    $co('hasResults', false)
    $co('hasError', true)
    return ['mirthEventPoller: options.eventName is required']
  }

  var stateKey = 'mirthEventPoller_state'
  var state = $gc(stateKey) || {}

  // Build time filter: start from last poll time, or lookbackSeconds ago on first run
  var Calendar = java.util.Calendar
  var startCal = Calendar.getInstance()

  if (state.lastPollTime) {
    startCal.setTimeInMillis(state.lastPollTime)
  } else {
    startCal.add(Calendar.SECOND, -lookbackSeconds)
  }

  var EventFilter = com.mirth.connect.model.filters.EventFilter
  var filter = new EventFilter()
  filter.setName(eventName)
  filter.setStartDate(startCal)

  var controllers = mirthEventPoller._getControllers()
  var eventList = $t(() => controllers.event.getEvents(filter, 0, maxEvents))

  // getEvents returns java.util.ArrayList directly
  if (!eventList || eventList.size() === 0) {
    state.lastPollTime = Date.now()
    $gc(stateKey, state)
    $co('hasResults', false)
    $co('hasError', false)
    return ['mirthEventPoller: no new events matching "' + eventName + '"']
  }

  // Keep only events whose name matches exactly (Mirth's name filter is not always exact)
  var matchedEvents = []
  for (var ri = 0; ri < eventList.size(); ri++) {
    var re = eventList.get(ri)
    if (String(re.getName()) === eventName) {
      matchedEvents.push(re)
    }
  }

  if (matchedEvents.length === 0) {
    state.lastPollTime = Date.now()
    $gc(stateKey, state)
    $co('hasResults', false)
    $co('hasError', false)
    return ['mirthEventPoller: no new events matching "' + eventName + '"']
  }

  // Bounded set of processed event IDs, kept in $gc (cap to the most recent ~500)
  var processedKey = 'mirthEventPoller_processed'
  var processedIds = dedupe ? ($gc(processedKey) || []) : []
  var processedSet = {}
  for (var pi = 0; pi < processedIds.length; pi++) {
    processedSet[processedIds[pi]] = true
  }

  var out = []
  var newCount = 0
  var errorCount = 0
  var latestEventTime = state.lastPollTime || 0

  for (var i = 0; i < matchedEvents.length; i++) {
    var event = matchedEvents[i]
    var eventId = String(event.getId())

    // De-duplicate: skip events we've already processed
    if (dedupe && processedSet[eventId]) {
      continue
    }

    var eventTime = $t(() => event.getDateTime().getTimeInMillis()) || 0
    if (eventTime > latestEventTime) {
      latestEventTime = eventTime
    }

    var userId = $t(() => event.getUserId())
    var username = mirthEventPoller._resolveUsername(userId)
    var attrs = mirthEventPoller._parseAttributes($t(() => event.getAttributes()))

    // Parse channel info from "Channel[id=uuid,name=channelName]" attribute
    var channelInfo = mirthEventPoller._parseChannelAttribute(attrs.channel)
    var eventChannelId = channelInfo.channelId
    var eventChannelName = channelInfo.channelName || mirthEventPoller._resolveChannelName(eventChannelId)

    var messageIds = mirthEventPoller._parseMessageIds(attrs.messageId || '')

    var parsed = {
      id: eventId,
      name: eventName,
      userId: userId,
      username: username,
      channelId: eventChannelId,
      channelName: eventChannelName,
      messageIds: messageIds,
      attributes: attrs,
    }

    if (onEvent) {
      var handled = $t(() => {
        onEvent(parsed)
        return true
      })
      if (handled) {
        out.push(eventName + ' event ' + eventId + ' by ' + username + ' on ' + eventChannelName)
      } else {
        errorCount++
        out.push('onEvent handler failed for event ' + eventId + ' on ' + eventChannelName)
      }
    } else {
      out.push(eventName + ' event ' + eventId + ' by ' + username + ' on ' + eventChannelName)
    }

    newCount++
    if (dedupe) {
      processedSet[eventId] = true
      processedIds.push(eventId)
    }
  }

  // Persist bounded processed-id list (most recent ~500)
  if (dedupe) {
    if (processedIds.length > 500) {
      processedIds = processedIds.slice(processedIds.length - 500)
    }
    $gc(processedKey, processedIds)
  }

  state.lastPollTime = latestEventTime > 0 ? latestEventTime + 1 : Date.now()
  $gc(stateKey, state)

  if (out.length === 0) {
    out.push('mirthEventPoller: all matching events already processed')
  }
  $co('hasResults', newCount > 0)
  $co('hasError', errorCount > 0)
  return out
}

/**
 * Debug/discovery: dump raw event data for recent events.
 *
 * @param {number} [lookbackSeconds=3600]
 * @param {string} [nameFilter] - Optional event name filter; when provided, only events whose name
 *   matches exactly are returned.
 * @return {Object[]}
 */
mirthEventPoller.debugDumpEvents = function (lookbackSeconds, nameFilter) {
  lookbackSeconds = lookbackSeconds || 3600

  var Calendar = java.util.Calendar
  var startCal = Calendar.getInstance()
  startCal.add(Calendar.SECOND, -lookbackSeconds)

  var EventFilter = com.mirth.connect.model.filters.EventFilter
  var filter = new EventFilter()
  if (nameFilter) {
    filter.setName(nameFilter)
  }
  filter.setStartDate(startCal)

  var controllers = mirthEventPoller._getControllers()
  var eventList = controllers.event.getEvents(filter, 0, 100)

  if (!eventList || eventList.size() === 0) return [{result: 'no events found'}]

  // Filter to the requested event name only (Mirth's name filter may not be exact)
  var filtered = []
  for (var fi = 0; fi < eventList.size(); fi++) {
    var ev = eventList.get(fi)
    if (!nameFilter || String(ev.getName()) === nameFilter) {
      filtered.push(ev)
    }
  }

  if (filtered.length === 0) return [{result: 'no matching events found'}]

  var results = []
  for (var i = 0; i < filtered.length && i < 20; i++) {
    var event = filtered[i]
    var attrs = mirthEventPoller._parseAttributes($t(() => event.getAttributes()))
    var channelInfo = mirthEventPoller._parseChannelAttribute(attrs.channel)
    var entry = {
      id: $t(() => String(event.getId())),
      name: $t(() => String(event.getName())),
      userId: $t(() => event.getUserId()),
      username: mirthEventPoller._resolveUsername($t(() => event.getUserId())),
      channelId: channelInfo.channelId,
      channelName: channelInfo.channelName,
      messageId: attrs.messageId || null,
      attributes: attrs,
    }

    // If the event references a message, dump all of its custom metadata columns
    if (entry.messageId && entry.channelId) {
      entry.metadata = mirthEventPoller._getMessageMetadata(entry.channelId, parseInt(entry.messageId))
    }

    results.push(entry)
  }
  return results
}

if (typeof module === 'object') {
  module.exports = mirthEventPoller
}

/* global com, ChannelUtil, $t, $gc, $co */
/* exported mirthEventPoller */
