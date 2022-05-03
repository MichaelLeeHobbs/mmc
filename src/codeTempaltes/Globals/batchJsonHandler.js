/**
 * Reads in the raw message and converts it into JSON Array and then returns one element of the array on each call.
 * @param [noReverse=false] By default the array will be reversed so the returned orders is Fist in Fist Out and not LILO
 * @return {*}
 */
function batchJsonHandler(noReverse) {
  function getMessages() {
    const message = new java.lang.StringBuilder()
    var line
    while ((line = reader.readLine()) != null) {
      message.append(String(line).trim()).append('\r')
    }
    var messages = JSON.parse(String(message))
    if (!Array.isArray(messages)) {
      messages = [messages]
    }
    if (noReverse) {
      return messages
    }
    return messages.reverse()
  }

  var messages = $gc('messages')
  if (messages == null || messages.length === 0) {
    $gc('messages', messages = getMessages())
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    messages = null
    return ''
  }
  return messages.pop()
}

/* global java, reader, $gc */

