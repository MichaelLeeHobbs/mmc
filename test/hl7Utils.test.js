import { describe, it, expect, vi } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

describe('hl7Utils.fixLineBreaks', () => {
  const { hl7Utils } = loadTemplate('Globals/hl7Utils.js')

  it('strips stray newlines and rejoins only before new segments', () => {
    const NL = String.fromCharCode(10)
    const CR = String.fromCharCode(13)
    // A field value contains an embedded newline; the continuation line does
    // not start with a 3-char segment id + |, so it gets concatenated.
    const input = 'MSH|^~\\&|A' + CR + 'PID|1|name with' + NL + 'break' + CR + 'NTE|1|note'
    const out = hl7Utils.fixLineBreaks(input)
    expect(out).toBe('MSH|^~\\&|A' + CR + 'PID|1|name withbreak' + CR + 'NTE|1|note')
  })

  it('keeps real segment boundaries (line starting with XXX|)', () => {
    const CR = String.fromCharCode(13)
    const input = 'MSH|a' + CR + 'PID|b' + CR + 'OBX|c'
    expect(hl7Utils.fixLineBreaks(input)).toBe('MSH|a' + CR + 'PID|b' + CR + 'OBX|c')
  })

  it('joins a wrapped continuation line that is not a segment start', () => {
    const CR = String.fromCharCode(13)
    const input = 'OBX|1|TX|result' + CR + 'continued text without segment id'
    expect(hl7Utils.fixLineBreaks(input)).toBe('OBX|1|TX|resultcontinued text without segment id')
  })

  it('returns the first segment with stray newlines stripped when there are no CRs', () => {
    const NL = String.fromCharCode(10)
    expect(hl7Utils.fixLineBreaks('MSH|just one' + NL + 'line')).toBe('MSH|just oneline')
  })
})

describe('hl7Utils.fromXml', () => {
  it('cleans the stringified XML and delegates to SerializerFactory.getSerializer().toXML', () => {
    const toXML = vi.fn((s) => 'SERIALIZED:' + s)
    const getSerializer = vi.fn(() => ({ toXML }))
    const SerializerFactory = { getSerializer }

    const { hl7Utils } = loadTemplate('Globals/hl7Utils.js', { SerializerFactory })

    // Exercise every cleanup: leading spaces, "null", "undefined",
    // a non-printable control char (BEL 0x07), a tab, surrounding whitespace.
    const BEL = String.fromCharCode(7)
    const TAB = String.fromCharCode(9)
    const raw = '   keep' + BEL + 'null and undefined' + TAB + 'here  '
    const xml = { toString: () => raw }
    const result = hl7Utils.fromXml(xml)

    expect(getSerializer).toHaveBeenCalledWith('HL7V2')
    expect(toXML).toHaveBeenCalledTimes(1)

    const cleaned = toXML.mock.calls[0][0]
    // Leading spaces removed; 'null'/'undefined' removed; BEL and tab (both
    // outside \x20-\x7E) each become a space; then trimmed.
    // 'keep' + ' ' + ' and ' + ' ' + 'here'  => 'keep  and  here'
    expect(cleaned).toBe('keep  and  here')
    expect(cleaned).not.toContain('null')
    expect(cleaned).not.toContain('undefined')
    expect(cleaned).not.toContain(BEL)
    expect(result).toBe('SERIALIZED:' + cleaned)
  })
})
