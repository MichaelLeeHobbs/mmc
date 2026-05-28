/**
 * Date and time utility functions for HL7, ISO, and timezone conversions.
 * @namespace dateUtils
 */
var dateUtils = {}

/**
 * Converts an HL7 date string to an ISO date string.
 * @param {string} hl7Dt
 * @returns {string}
 */
dateUtils.hl7ToIso = function (hl7Dt) {
  const isHl7Dt = /\d{14}([+-]\d{4})?/.test(hl7Dt)
  if (!isHl7Dt) {
    return hl7Dt
  }
  const [/*ignore*/, y, mo, d, h, mi, s, z] = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})([+-]\d{4})?/.exec(hl7Dt)
  return (new Date([[y, mo, d].join('-'), 'T', [h, mi, s].join(':'), z || '+0000'].join(''))).toISOString()
}

/**
 * Converts an ISO date string to an HL7 date string.
 * @param {string|Date} dt - The ISO date string or Date object.
 * @returns {string} - The HL7 date string in the format YYYYMMDDHHMMSS+0000 ie UTC time.
 */
dateUtils.isoToHl7 = function (dt) {
  assert(dt, 'dateUtils.isoToHl7: dt is required')
  const dtStr = dt instanceof Date ? dt.toISOString() : dt
  return dtStr.split('.')[0].replace(/\D/g, '') + '+0000'
}

/**
 * If dt is an ISO date, convert it to HL7 date format, otherwise returns dt.
 * @param {string} dt
 * @returns {string}
 */
dateUtils.convertIsoToHl7 = function (dt) {
  return dateUtils.isIso(dt) ? dateUtils.isoToHl7(dt) : dt
}

/**
 * Converts an HL7 date/time string to a local Date object.
 * @param {string} dateTimeStr - The HL7 date/time string
 * @return {Date} - The local Date object
 */
dateUtils.hl7ToDate = function (dateTimeStr) {
  assert(dateTimeStr, 'dateTimeStr is required')
  const datePart = dateTimeStr.slice(0, 8)
  const timePart = dateTimeStr.slice(8, 14)
  const offsetPart = dateTimeStr.slice(14)

  return new Date(
    datePart.slice(0, 4) + '-' +
    datePart.slice(4, 6) + '-' +
    datePart.slice(6) + 'T' +
    timePart.slice(0, 2) + ':' +
    timePart.slice(2, 4) + ':' +
    timePart.slice(4) + offsetPart
  )
}

/**
 * Returns true if the given string is a valid ISO date string.
 * @param {string} dt
 * @returns {boolean}
 */
dateUtils.isIso = function (dt) {
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(dt)
}

/**
 * Converts a datetime string from one timezone to another using Java's time API.
 *
 * Automatically sanitizes the input by removing non-digit characters and truncating to 14 characters.
 * Returns the converted datetime with timezone offset in HL7 format (YYYYMMDDHHmmss+HHMM).
 *
 * @param {string} dt - Date/time string in format YYYYMMDDHHmmss (may contain separators which will be removed)
 * @param {string} zoneA - IANA timezone identifier. When used with 2 arguments, this is the target timezone (source defaults to 'Etc/GMT').
 *                         When used with 3 arguments, this is the source timezone.
 * @param {string} [zoneB] - IANA timezone identifier for the target timezone (e.g., 'America/Los_Angeles', 'America/Chicago').
 *                           If omitted, zoneA is treated as the target and source defaults to 'Etc/GMT'
 * @returns {string} Converted datetime string with timezone offset (e.g., '20260206143045-0800')
 *                   Returns original dt string if conversion fails
 */
dateUtils.convertTimeZone = function (dt, zoneA, zoneB) {
  try {
    dt = dt.replace(/\D/g, '').slice(0, 14)

    let fromZone = zoneA
    let toZone = zoneB

    if (!zoneB) {
      toZone = zoneA
      fromZone = 'Etc/GMT'
    }

    const {LocalDateTime, ZoneId, format: {DateTimeFormatter}} = java.time

    const getOffsetString = (zonedDateTime) => {
      const offset = zonedDateTime.getOffset().getId()
      return offset === 'Z' ? '+0000' : offset.replace(':', '')
    }

    const formatter = DateTimeFormatter.ofPattern('yyyyMMddHHmmss')
    const zonedDateTime = LocalDateTime.parse(dt.split(/[+-]/)[0], formatter).atZone(ZoneId.of(fromZone))
    const convertedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of(toZone))

    return String(convertedDateTime.format(formatter) + getOffsetString(convertedDateTime))
  } catch (error) {
    $c('convertTimeZoneError', 'Error converting time zone: ' + error.message)
    return dt
  }
}

/**
 * Calculates age from a date string in the format YYYYMMDD.
 * @param {string} dobStr - The date of birth string in YYYYMMDD format.
 * @returns {number} - The calculated age.
 * @throws {Error} - If the input format is invalid or the date is not a valid calendar date.
 */
dateUtils.getAge = function (dobStr) {
  const dobRegex = /^(\d{4})(\d{2})(\d{2})$/
  const match = dobRegex.exec(dobStr)

  if (!match) {
    throw new Error('Invalid date format. Expected YYYYMMDD.')
  }

  const [, yearStr, monthStr, dayStr] = match
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const dobDate = new Date(year, month - 1, day)

  if (
    dobDate.getFullYear() !== year ||
    dobDate.getMonth() + 1 !== month ||
    dobDate.getDate() !== day
  ) {
    throw new Error('Invalid date. Please provide a valid YYYYMMDD date.')
  }

  const today = new Date()
  let age = today.getFullYear() - dobDate.getFullYear()

  const hasHadBirthdayThisYear =
    today.getMonth() > dobDate.getMonth() ||
    (today.getMonth() === dobDate.getMonth() && today.getDate() >= dobDate.getDate())

  if (!hasHadBirthdayThisYear) {
    age--
  }

  return age
}

/**
 * Check if a person is older than a certain age.
 * @param {Date} dob
 * @param {number} age
 * @return {boolean} true if the person is older than the given age, false otherwise.
 */
dateUtils.isOlderThan = function (dob, age) {
  const now = new Date()
  const yearDiff = now.getFullYear() - dob.getFullYear()

  if (yearDiff > age) {
    return true
  }

  if (yearDiff < age) {
    return false
  }

  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff > 0) {
    return true
  }
  if (monthDiff < 0) {
    return false
  }

  return now.getDate() >= dob.getDate()
}

/**
 * Code timer works across Channel source/destination and handles regeneration of destination.
 * It is a good idea to initialize timings in the preprocessor.
 * @example
 * // preprocessor
 * const timer = new dateUtils.Timer()
 * timer.markTime('preprocessor')
 *
 * // in a source connector
 * const timer = new dateUtils.Timer()
 * timer.markTime('some event')
 *
 * @param {string} [key='timings'] the $c param to store timings in
 * @param {string} [event='start'] the name of the starting event
 * @constructor
 */
dateUtils.Timer = function Timer(key, event) {
  this.key = key || 'timings'
  this.timings = [{event: event || 'start', dt: new Date()}]
  if ($c(this.key)) {
    this.restore()
  }
  $c(this.key, this.timings)
}

/**
 * Private function to restore internal state
 * @private
 */
dateUtils.Timer.prototype.restore = function () {
  let timings = $c(this.key)
  if (typeof timings !== 'object' || !Array.isArray(timings)) {
    try {
      timings = JSON.parse(timings)
      timings = timings.map(ele => {
        ele.dt = new Date(ele.dt)
        if (ele.diff) {
          ele.diff = parseInt(ele.diff)
        }
        return ele
      })
      this.timings = timings
    } catch (e) {
      logger.error('Failed to parse timings! Error: ' + e.message)
    }
  } else {
    this.timings = timings
  }
}

/**
 * Mark the time of an event
 * @param {string} event
 */
dateUtils.Timer.prototype.markTime = function (event) {
  const dt = new Date()
  const diff = dt - this.timings[this.timings.length - 1].dt
  this.timings.push({event: event, dt: dt, diff: diff})
}

/**
 * Add a sum event.
 */
dateUtils.Timer.prototype.sum = function () {
  const dt = new Date()
  const diff = dt - this.timings[0].dt
  this.timings.push({event: 'sum', dt: dt, diff: diff})
}

/**
 * Converts the JavaScript value of timings to a string.
 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 * @return {string}
 */
dateUtils.Timer.prototype.stringify = function (replacer, space) {
  return JSON.stringify(this.timings, replacer, space)
}

/**
 * Converts a timing to a string by using the current locale.
 * @return {string}
 */
dateUtils.Timer.prototype.toString = function () {
  return this.timings.map(ele => {
    return ele.dt.toLocaleString() + ' : ' + ele.event + (ele.diff ? '  diff: ' + ele.diff : '')
  }).join('\n')
}

/* global assert */
/* exported dateUtils */
