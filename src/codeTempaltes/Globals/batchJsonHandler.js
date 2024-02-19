/**
 * Reads in the raw message and converts it into JSON Array and then returns one element of the array on each call.
 * @param [noReverse=false] By default the array will be reversed so the returned orders is Fist in Fist Out and not LILO
 * @return {*}
 */
function batchJsonHandler(noReverse) {
  function readMessage() {
    const message = new java.lang.StringBuilder()
    var line
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

  function getMessages() {
    try {
      var messages = $gc('messages') || []
      // are we in a follow-up call?
      if (messages.length > 0) {
        return messages
      }
      // first call
      messages = readMessage()
      messages = messages.map(ele => typeof ele !== 'string' ? JSON.stringify(ele) : ele)
      // insert an empty message at the end to signal the end of the batch
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

/* global java, reader, $gc */

