/**
 * Maps the route a message took getting to this channel is $c('route')
 * Designed to be placed in Global Scripts - Preprocessor Script
 * Has multiple levels of try/catch to avoid potential issues.
 */
try {
  // this is to avoid issues when used as a global script in mirth
  // eslint-disable-next-line no-inner-declarations
  function mapMessageRoute() {
    try {
      var sourceChannelIds = sourceMap.get('sourceChannelIds') || sourceMap.get('sourceChannelId')
      var sourceMessageIds = sourceMap.get('sourceMessageIds') || sourceMap.get('sourceMessageId')
      if (sourceChannelIds && sourceMessageIds) {
        sourceChannelIds = sourceChannelIds.toArray ? sourceChannelIds.toArray() : [sourceChannelIds]
        sourceMessageIds = sourceMessageIds.toArray ? sourceMessageIds.toArray() : [sourceMessageIds]
      } else {
        sourceChannelIds = []
        sourceMessageIds = []
      }
      var token = '\n     =>'
      var route = sourceChannelIds.map((id, i) => String(ChannelUtil.getChannelName(id)) + ':' + sourceMessageIds[i]).join(token)
      if (connectorMessage && connectorMessage.getMessageId) {
        route += token + '(' + channelName + ':' + connectorMessage.getMessageId() + ')'
      }
      $c('route', route)
      return route
    } catch (e) {
      $c('route', e.message + '\n' + e.stack)
    }
  }
} catch (e) {
  $c('route', e.message + '\n' + e.stack)
}

/* global $c, sourceMap, ChannelUtil, connectorMessage, channelName */
