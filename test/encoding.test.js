import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// Encoding.es5.js sets module.exports = Encoding (require guard skipped under vm).
const Encoding = loadTemplate('HL7Message/Encoding.es5.js').module.exports

describe('Encoding constructor', () => {
  it('uses HL7 default encoding chars when no options', () => {
    const enc = new Encoding()
    expect(enc.field).toBe('|')
    expect(enc.component).toBe('^')
    expect(enc.fieldRepetition).toBe('~')
    expect(enc.escape).toBe('\\')
    expect(enc.subcomponent).toBe('&')
    expect(enc.segment).toBe('\r')
  })

  it('honors explicit option overrides', () => {
    const enc = new Encoding({ field: '#', component: '@' })
    expect(enc.field).toBe('#')
    expect(enc.component).toBe('@')
  })

  it('toString joins the 5 HL7 encoding fields', () => {
    const enc = new Encoding()
    // field|component|fieldRepetition|escape|subcomponent => | ^ ~ \ &
    expect(enc.toString()).toBe('|^~\\&')
  })
})

describe('Encoding.parse via { hl7 }', () => {
  const enc = new Encoding({ hl7: 'MSH|^~\\&|SENDAPP|SENDFAC|RECVAPP' })

  it('parses field separator from position after MSH', () => {
    expect(enc.field).toBe('|')
  })

  it('parses the four encoding characters', () => {
    expect(enc.component).toBe('^')
    expect(enc.fieldRepetition).toBe('~')
    expect(enc.escape).toBe('\\')
    expect(enc.subcomponent).toBe('&')
  })

  it('round-trips parsed encoding to its string form', () => {
    expect(enc.toString()).toBe('|^~\\&')
  })
})

describe('Encoding JSON round-trip', () => {
  it('toJSON yields the 6 encoding fields in order', () => {
    const enc = new Encoding()
    expect(enc.toJSON()).toEqual(['|', '^', '~', '\\', '&', '\r'])
  })

  it('fromJSON reconstructs an equivalent Encoding', () => {
    const enc = new Encoding()
    const clone = Encoding.fromJSON(enc.toJSON())
    expect(clone.toJSON()).toEqual(enc.toJSON())
  })
})

describe('Encoding escape/unescape round-trip', () => {
  it('escapes separator characters and unescapes back', () => {
    const enc = new Encoding()
    const escaped = enc.escapeString('a|b^c&d~e')
    // each separator becomes its escape sequence
    expect(escaped).toBe('a\\F\\b\\S\\c\\T\\d\\R\\e')
    expect(enc.unescapeString(escaped)).toBe('a|b^c&d~e')
  })
})
