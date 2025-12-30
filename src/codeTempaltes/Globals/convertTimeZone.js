/**
 * Converts a date-time string from one time zone to another.
 *
 * @param {string} dt - The date-time string in the format 'yyyyMMddHHmmss' with optional timezone offset (e.g., '20231225143000+0500')
 * @param {string} fromZone - The source time zone ID (e.g., 'America/New_York', 'UTC', 'Asia/Tokyo')
 * @param {string} toZone - The target time zone ID to convert to (e.g., 'America/Los_Angeles', 'UTC', 'Europe/London')
 * @returns {string} The converted date-time string in the format 'yyyyMMddHHmmss±HHMM' (e.g., '20231225093000-0800')
 *
 * @example
 * // Convert from Eastern Time to Pacific Time
 * convertTimeZone('20231225143000', 'America/New_York', 'America/Los_Angeles');
 * // Returns: '20231225113000-0800'
 *
 * @example
 * // Convert from UTC to Central European Time
 * convertTimeZone('20231225120000+0000', 'UTC', 'Europe/Paris');
 * // Returns: '20231225130000+0100'
 */
function convertTimeZone(dt, fromZone, toZone) {
    const {LocalDateTime, ZoneId, format: {DateTimeFormatter}} = java.time;

    /**
     * Extracts and formats the timezone offset from a ZonedDateTime object.
     *
     * @param {java.time.ZonedDateTime} zonedDateTime - The ZonedDateTime object to extract offset from
     * @returns {string} The timezone offset in the format '±HHMM' (e.g., '+0500', '-0800', '+0000' for UTC)
     * @private
     */
    function getOffsetString(zonedDateTime) {
        const offset = zonedDateTime.getOffset().getId();
        return offset === 'Z' ? '+0000' : offset.replace(':', ''); // Adjust UTC format if necessary
    }

    const formatter = DateTimeFormatter.ofPattern('yyyyMMddHHmmss');

    // Parse the date time string from the given dt in the fromZone
    const zonedDateTime = LocalDateTime.parse(dt.split(/[+-]/)[0], formatter).atZone(ZoneId.of(fromZone));

    // Convert the parsed date to the target toZone
    const convertedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of(toZone));

    // Return the formatted date string in the new time zone
    return String(convertedDateTime.format(formatter) + getOffsetString(convertedDateTime));
}

/* exported convertTimeZone */
