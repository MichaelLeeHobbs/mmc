/**
 * Reads in the raw message and converts it into JSON Array and then returns one element of the array on each call.
 * @param [noReverse=false] By default the array will be reversed so the returned orders is Fist in Fist Out and not LILO
 * @return {*}
 */
function batchTextHandler(noReverse) {
    function getMessages() {
        const messages = []
        var line
        while ((line = reader.readLine()) != null) {
            messages.push(String(line).trim())
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

