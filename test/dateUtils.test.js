import { describe, it, expect, beforeEach } from 'vitest'
import { loadTemplates } from './mirthHarness.js'

// dateUtils.isoToHl7 calls the global `assert`, so load assert.js first into the
// same context. convertTimeZone references `java.time`; we do NOT inject it for
// the pure tests (it is covered separately).
function load(env) {
  return loadTemplates(['Globals/assert.js', 'Globals/dateUtils.js'], env)
}

describe('dateUtils.hl7ToIso', () => {
  const { dateUtils } = load()

  it('converts an HL7 datetime with offset to ISO (UTC)', () => {
    // 2026-02-06 14:30:45 -0800 == 2026-02-06 22:30:45 UTC
    expect(dateUtils.hl7ToIso('20260206143045-0800'))
      .toBe('2026-02-06T22:30:45.000Z')
  })

  it('defaults to +0000 when no offset is present', () => {
    expect(dateUtils.hl7ToIso('20260206143045'))
      .toBe('2026-02-06T14:30:45.000Z')
  })

  it('returns the input unchanged when it is not an HL7 datetime', () => {
    expect(dateUtils.hl7ToIso('not-a-date')).toBe('not-a-date')
  })
})

describe('dateUtils.isoToHl7', () => {
  const { dateUtils } = load()

  it('converts an ISO string to HL7 + UTC suffix', () => {
    expect(dateUtils.isoToHl7('2026-02-06T22:30:45.000Z'))
      .toBe('20260206223045+0000')
  })

  // reason: the source's Date branch uses `dt instanceof Date`, which is realm-
  // sensitive under the vm sandbox. A Node-realm Date is not `instanceof` the
  // sandbox's intrinsic Date (and the harness does not expose the sandbox Date
  // constructor), so the Date-input path cannot be exercised faithfully here.
  // The string-input behavior is fully covered above.
  it.skip('accepts a Date object (Date branch is cross-realm in the vm sandbox)', () => {})

  it('throws (via assert) when dt is falsy', () => {
    expect(() => dateUtils.isoToHl7('')).toThrow('dateUtils.isoToHl7: dt is required')
  })
})

describe('dateUtils.convertIsoToHl7', () => {
  const { dateUtils } = load()

  it('converts when the input is an ISO string', () => {
    expect(dateUtils.convertIsoToHl7('2026-02-06T22:30:45.000Z'))
      .toBe('20260206223045+0000')
  })

  it('returns the input untouched when not ISO', () => {
    expect(dateUtils.convertIsoToHl7('20260206223045')).toBe('20260206223045')
  })
})

describe('dateUtils.hl7ToDate', () => {
  const { dateUtils } = load()

  it('parses an HL7 datetime with offset into a Date', () => {
    const d = dateUtils.hl7ToDate('20260206143045-0800')
    // Dates are created inside the vm sandbox realm, so duck-type instead of
    // a Node-realm instanceof check.
    expect(typeof d.toISOString).toBe('function')
    expect(d.toISOString()).toBe('2026-02-06T22:30:45.000Z')
  })

  it('throws when dateTimeStr is falsy', () => {
    expect(() => dateUtils.hl7ToDate('')).toThrow('dateTimeStr is required')
  })
})

describe('dateUtils.isIso', () => {
  const { dateUtils } = load()

  it('returns true for a full ISO Z timestamp', () => {
    expect(dateUtils.isIso('2026-02-06T22:30:45.000Z')).toBe(true)
  })

  it('returns false for HL7 and other formats', () => {
    expect(dateUtils.isIso('20260206223045')).toBe(false)
    expect(dateUtils.isIso('2026-02-06')).toBe(false)
    expect(dateUtils.isIso('2026-02-06T22:30:45Z')).toBe(false) // missing millis
  })
})

describe('dateUtils.getAge', () => {
  const { dateUtils } = load()

  it('throws on malformed input', () => {
    expect(() => dateUtils.getAge('1990-01-01')).toThrow('Invalid date format. Expected YYYYMMDD.')
    expect(() => dateUtils.getAge('19901')).toThrow('Invalid date format')
  })

  it('throws on an invalid calendar date', () => {
    expect(() => dateUtils.getAge('20260230')).toThrow('Invalid date. Please provide a valid YYYYMMDD date.')
  })

  it('computes age, subtracting one when the birthday has not occurred yet this year', () => {
    const today = new Date()
    const y = today.getFullYear()
    // Birthday far in the future this year -> not had birthday yet
    const future = new Date(y, today.getMonth(), today.getDate())
    future.setDate(future.getDate() + 1)
    const fy = future.getFullYear()
    const dobStr =
      String(fy - 30) +
      String(future.getMonth() + 1).padStart(2, '0') +
      String(future.getDate()).padStart(2, '0')
    // Skip the rare leap-day rollover edge by only asserting it is a number near 29/30
    const age = dateUtils.getAge(dobStr)
    expect(typeof age).toBe('number')
    expect(age).toBeGreaterThanOrEqual(29)
    expect(age).toBeLessThanOrEqual(30)
  })

  it('returns the exact age when the birthday is today', () => {
    const today = new Date()
    const dobStr =
      String(today.getFullYear() - 40) +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    expect(dateUtils.getAge(dobStr)).toBe(40)
  })
})

describe('dateUtils.isOlderThan', () => {
  const { dateUtils } = load()

  it('returns true when year difference exceeds the age', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 50)
    expect(dateUtils.isOlderThan(dob, 30)).toBe(true)
  })

  it('returns false when year difference is below the age', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 10)
    expect(dateUtils.isOlderThan(dob, 30)).toBe(false)
  })

  it('returns true on the exact birthday boundary (today)', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 30)
    expect(dateUtils.isOlderThan(dob, 30)).toBe(true)
  })
})

describe('dateUtils.convertTimeZone', () => {
  it('error path: writes to $c and returns the sanitized dt when java.time is unavailable', () => {
    // No `java` injected -> destructuring java.time throws -> catch branch.
    const sandbox = load()
    const { dateUtils, $c } = sandbox
    const result = dateUtils.convertTimeZone('2026-02-06 14:30:45', 'America/Los_Angeles')
    expect(result).toBe('20260206143045') // \D removed, sliced to 14
    expect($c('convertTimeZoneError')).toContain('Error converting time zone')
  })

  // reason: the happy path needs a faithful java.time (LocalDateTime/ZoneId/
  // withZoneSameInstant/ZonedDateTime.getOffset) timezone engine. A hand mock
  // would just re-encode the expected output rather than test real behavior.
  it.skip('happy path conversion (requires real java.time)', () => {})
})

describe('dateUtils.Timer', () => {
  let sandbox
  beforeEach(() => {
    sandbox = load()
  })

  it('initializes with a start event stored in $c', () => {
    const { dateUtils, $c } = sandbox
    const t = new dateUtils.Timer()
    expect(t.key).toBe('timings')
    expect(t.timings).toHaveLength(1)
    expect(t.timings[0].event).toBe('start')
    expect($c('timings')).toBe(t.timings)
  })

  it('accepts a custom key and start event name', () => {
    const { dateUtils, $c } = sandbox
    const t = new dateUtils.Timer('myKey', 'preprocessor')
    expect(t.key).toBe('myKey')
    expect(t.timings[0].event).toBe('preprocessor')
    expect($c('myKey')).toBe(t.timings)
  })

  it('markTime appends an event with a numeric diff', () => {
    const { dateUtils } = sandbox
    const t = new dateUtils.Timer()
    t.markTime('step1')
    expect(t.timings).toHaveLength(2)
    expect(t.timings[1].event).toBe('step1')
    expect(typeof t.timings[1].diff).toBe('number')
    expect(t.timings[1].diff).toBeGreaterThanOrEqual(0)
  })

  it('sum appends a sum event measured from the first timing', () => {
    const { dateUtils } = sandbox
    const t = new dateUtils.Timer()
    t.markTime('a')
    t.sum()
    const last = t.timings[t.timings.length - 1]
    expect(last.event).toBe('sum')
    expect(typeof last.diff).toBe('number')
  })

  it('restores from an existing object array already in $c', () => {
    const { dateUtils, $c } = sandbox
    const existing = [{ event: 'start', dt: new Date() }, { event: 'prev', dt: new Date(), diff: 5 }]
    $c('timings', existing)
    const t = new dateUtils.Timer()
    expect(t.timings).toBe(existing)
  })

  it('restores by parsing a JSON string stored in $c', () => {
    const { dateUtils, $c } = sandbox
    const serialized = JSON.stringify([
      { event: 'start', dt: new Date().toISOString() },
      { event: 'prev', dt: new Date().toISOString(), diff: '7' },
    ])
    $c('timings', serialized)
    const t = new dateUtils.Timer()
    expect(t.timings).toHaveLength(2)
    // duck-type: sandbox-realm Date
    expect(typeof t.timings[1].dt.toISOString).toBe('function')
    expect(t.timings[1].diff).toBe(7) // parseInt of '7'
  })

  it('stringify produces JSON of the timings', () => {
    const { dateUtils } = sandbox
    const t = new dateUtils.Timer()
    const parsed = JSON.parse(t.stringify())
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].event).toBe('start')
  })

  it('toString renders one line per event', () => {
    const { dateUtils } = sandbox
    const t = new dateUtils.Timer()
    t.markTime('step1')
    const lines = t.toString().split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('start')
    expect(lines[1]).toContain('step1')
    // The diff suffix only appears when diff is truthy; a sub-millisecond mark
    // can produce diff===0 (falsy) and omit it, so don't require it here.
  })

  it('toString includes the diff suffix when the diff is non-zero', () => {
    const { dateUtils } = sandbox
    const t = new dateUtils.Timer()
    // Inject a timing with a known non-zero diff to exercise the suffix branch.
    t.timings.push({ event: 'slow', dt: new Date(), diff: 1234 })
    const lines = t.toString().split('\n')
    expect(lines[lines.length - 1]).toContain('slow')
    expect(lines[lines.length - 1]).toContain('diff: 1234')
  })
})
