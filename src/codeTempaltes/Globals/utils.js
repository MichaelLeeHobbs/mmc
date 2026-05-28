/**
 * Bridge object that provides convenient access to all utility modules.
 * @namespace utils
 *
 * @example
 * utils.date.getAge('19900101')
 * utils.string.wrapText('long text', 80)
 * utils.json.stringify(obj, 2)
 * utils.array.fromArrayList(javaList)
 * utils.error.toString(e)
 * utils.validation.parseInt('42', {min: 0, max: 100})
 * utils.channel.routeJsonMsg(channelId, json)
 * utils.channel.required(['$t', 'assert', 'fetch'])
 */
var utils = {
  date: dateUtils,
  string: stringUtils,
  json: jsonUtils,
  array: arrayUtils,
  error: errorUtils,
  validation: validationUtils,
  channel: channelUtils
}

/* global dateUtils stringUtils jsonUtils arrayUtils errorUtils validationUtils channelUtils */
/* exported utils */
