/**
 * Thorough behavioral test suite for Globals/HL7Message.js (bundled HL7Message + Encoding).
 *
 * Loaded via the vm harness. The library is realm-safe: it guards the `java`
 * reference (`typeof java !== 'undefined' && val instanceof java.lang.Object`),
 * uses a realm-agnostic POJO check (`HL7Message.isPOJO`), and duck-types RegExps
 * (`HL7Message.isRegExp`) instead of `instanceof RegExp`. As a result:
 *
 *  - Plain objects/arrays created in the test (Node) realm pass `toJsPrimitive`
 *    and `set()` correctly (no `java` mock required, no "[object Object]" fallback).
 *  - RegExps created in the test realm work for addRuleMatches / findInSegment.
 *
 * We still inject a `java` mock in `loadSandbox` to mirror the Mirth runtime, but
 * the library no longer requires it. (See the "without java mock" test.)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import vm from 'node:vm'
import { loadTemplates } from './mirthHarness.js'

/** Standard mocks: java for toJsPrimitive's instanceof branch. */
function loadSandbox(extra = {}) {
  return loadTemplates(
    ['Globals/HL7Message.js'],
    { java: { lang: { Object: function () {} } }, ...extra },
  )
}

/** Realistic messages used across tests. Segment separator is \r. */
const ADT = [
  'MSH|^~\\&|SENDAPP|SENDFAC|RECVAPP|RECVFAC|20240101120000||ADT^A01|MSG00001|P|2.3',
  'PID|1||12345^^^MR||Doe^John^A||19800101|M|||123 Main St^^Anytown^CA^90210||555-1234~555-5678',
  'NK1|1|Doe^Jane|SPO',
  'OBX|1|NM|GLU^Glucose||95|mg/dL|70-110|N',
  'OBX|2|NM|HGB^Hemoglobin||14.2|g/dL|12-16|N',
].join('\r')

const SUBCOMP = 'MSH|^~\\&|A|B\rOBX|1|CE|code^text&detail'
const REPS = 'MSH|^~\\&|A|B\rPID|1||ID1~ID2~ID3'

describe('construction & properties', () => {
  let HL7Message
  beforeEach(() => { HL7Message = loadSandbox().module.exports })

  it('empty constructor defaults to MSH|^~\\&', () => {
    const m = new HL7Message()
    expect(m.toString()).toBe('MSH|^~\\&')
  })

  it('parses MSH field separator into MSH.1.1 and encoding chars into MSH.2.1', () => {
    const m = new HL7Message()
    expect(m.get('MSH.1.1')).toBe('|')
    expect(m.get('MSH.2.1')).toBe('^~\\&')
  })

  it('constructs from a pipe-delimited string without any XML mock', () => {
    const m = new HL7Message(ADT)
    expect(m.get('MSH.9.1')).toBe('ADT')
    expect(m.get('PID.5.1')).toBe('Doe')
  })

  it('exposes getters: raw, encoding, segments, rules, validationIssues, logs', () => {
    const m = new HL7Message(ADT)
    expect(m.raw).toBe(ADT)
    expect(m.encoding.field).toBe('|')
    expect(Array.isArray(m.segments)).toBe(true)
    expect(m.segments[0][0]).toBe('MSH')
    expect(m.rules).toEqual([])
    expect(m.validationIssues).toEqual([])
    expect(m.logs).toEqual([])
  })

  it('isValid is true with no rules', () => {
    expect(new HL7Message(ADT).isValid).toBe(true)
  })

  it('passes rules through the constructor', () => {
    const m = new HL7Message(ADT, [() => true])
    expect(m.rules.length).toBe(1)
  })
})

describe('parse() and statics', () => {
  let HL7Message, sandbox
  beforeEach(() => { sandbox = loadSandbox(); HL7Message = sandbox.module.exports })

  it('parse() replaces current message values', () => {
    const m = new HL7Message(ADT)
    m.parse('MSH|^~\\&|NEW\rPID|9')
    expect(m.get('MSH.3.1')).toBe('NEW')
    expect(m.getSegments('OBX').length).toBe(0)
    expect(m.raw).toBe('MSH|^~\\&|NEW\rPID|9')
  })

  it('HL7Message.parser returns [segments, encoding]', () => {
    const [segs, enc] = HL7Message.parser('MSH|^~\\&|A\rPID|1')
    expect(Array.isArray(segs)).toBe(true)
    expect(enc.field).toBe('|')
  })

  it('HL7Message.parser rejects non-string / non-MSH input', () => {
    expect(() => HL7Message.parser('NOTMSH')).toThrow(/must start with "MSH"/)
    expect(() => HL7Message.parser(42)).toThrow(/Message must be XML or string/)
  })

  it('HL7Message.assert throws on falsy predicate, passes on truthy', () => {
    expect(() => HL7Message.assert(false, 'boom')).toThrow('boom')
    expect(() => HL7Message.assert(true, 'boom')).not.toThrow()
  })

  it('isPOJO / isStrNum / isPositiveInteger helpers', () => {
    // isPOJO is now realm-agnostic: a plain object from the test realm passes too.
    expect(HL7Message.isPOJO({ a: 1 })).toBe(true)
    const sandboxObj = vm.runInContext('({a:1})', sandbox)
    expect(HL7Message.isPOJO(sandboxObj)).toBe(true)
    expect(HL7Message.isPOJO([])).toBe(false)
    expect(HL7Message.isPOJO(null)).toBe(false)
    expect(HL7Message.isStrNum('a')).toBe(true)
    expect(HL7Message.isStrNum(1)).toBe(true)
    expect(HL7Message.isStrNum({})).toBe(false)
    expect(HL7Message.isPositiveInteger('3')).toBe(true)
    expect(HL7Message.isPositiveInteger('0')).toBe(false)
    expect(HL7Message.isPositiveInteger('-1')).toBe(false)
  })
})

describe('toJsPrimitive', () => {
  let HL7Message
  beforeEach(() => { HL7Message = loadSandbox().module.exports })

  it('passes primitives through unchanged', () => {
    expect(HL7Message.toJsPrimitive('x')).toBe('x')
    expect(HL7Message.toJsPrimitive(5)).toBe(5)
    expect(HL7Message.toJsPrimitive(true)).toBe(true)
    expect(HL7Message.toJsPrimitive(null)).toBe(null)
    expect(HL7Message.toJsPrimitive(undefined)).toBe(undefined)
  })

  it('recurses through arrays (Array.isArray is realm-safe)', () => {
    expect(HL7Message.toJsPrimitive(['a', 1, ['b']])).toEqual(['a', 1, ['b']])
  })

  it('converts a faux java.lang.String via getClass()', () => {
    const javaStr = { getClass: () => ({ getName: () => 'java.lang.String' }), toString: () => 'JS' }
    expect(HL7Message.toJsPrimitive(javaStr)).toBe('JS')
  })

  it('converts faux java.lang.Integer to a JS number', () => {
    const javaInt = { getClass: () => ({ getName: () => 'java.lang.Integer' }), toString: () => '42' }
    expect(HL7Message.toJsPrimitive(javaInt)).toBe(42)
  })

  it('falls back to toString() for unknown getClass (Java) types', () => {
    // No getClass match. Because the value has a getClass() method, isPOJO treats it
    // as a Java object (not a POJO), so the recursion branch is skipped and the final
    // toString() fallback runs.
    const unknown = { getClass: () => ({ getName: () => 'com.foo.Bar' }), toString: () => 'BAR' }
    expect(HL7Message.toJsPrimitive(unknown)).toBe('BAR')
  })

  it('recurses through a plain object regardless of realm', () => {
    // isPOJO is realm-agnostic, so a test-realm object recurses into a plain object.
    expect(HL7Message.toJsPrimitive({ a: 1 })).toEqual({ a: 1 })
  })
})

describe('path access: get / getRange', () => {
  let HL7Message, m
  beforeEach(() => {
    HL7Message = loadSandbox().module.exports
    m = new HL7Message(ADT)
  })

  it('reads component & subcomponent values', () => {
    expect(m.get('PID.5.1')).toBe('Doe')
    expect(m.get('PID.5.2')).toBe('John')
    expect(m.get('PID.5.3')).toBe('A')
  })

  it('reads repeated segments by [n] index', () => {
    expect(m.get('OBX[1].3.1')).toBe('GLU')
    expect(m.get('OBX[2].3.1')).toBe('HGB')
    expect(m.get('OBX[2].5.1')).toBe('14.2')
  })

  it('reads field repetitions by [n]', () => {
    expect(m.get('PID.13[1].1')).toBe('555-1234')
    expect(m.get('PID.13[2].1')).toBe('555-5678')
  })

  it('autoResolve=true (default) resolves a field path down to .1.1 and returns a string', () => {
    expect(m.get('PID.5')).toBe('Doe')
  })

  it('autoResolve=false returns the underlying object reference', () => {
    const ref = m.get('PID.5', false)
    expect(ref).toEqual({ 1: { 1: { 1: 'Doe' }, 2: { 1: 'John' }, 3: { 1: 'A' } } })
    expect(m.get('PID.5.1', false)).toEqual({ 1: 'Doe' })
  })

  it('missing field returns empty string (autoResolve true)', () => {
    expect(m.get('ZZZ.1.1')).toBe('')
  })

  it('reading a segment-only path returns the segment object', () => {
    const seg = m.get('PID')
    expect(seg[0]).toBe('PID')
  })

  it('getRange expands the % wildcard inclusively', () => {
    expect(m.getRange('MSH.%.1', 3, 6)).toEqual(['SENDAPP', 'SENDFAC', 'RECVAPP', 'RECVFAC'])
  })

  it('getRange returns "" for missing positions', () => {
    expect(m.getRange('NK1.%.1', 4, 5)).toEqual(['', ''])
  })

  it('_hl7KeyParser rejects empty/non-string paths', () => {
    expect(() => m.get('')).toThrow(/non-empty string/)
  })
})

describe('segments: getSegments / getSegment', () => {
  let HL7Message, m
  beforeEach(() => {
    HL7Message = loadSandbox().module.exports
    m = new HL7Message(ADT)
  })

  it('getSegments returns all segments of a type', () => {
    expect(m.getSegments('OBX').length).toBe(2)
    expect(m.getSegments('PID').length).toBe(1)
    expect(m.getSegments('ZZZ').length).toBe(0)
  })

  it('getSegment defaults to index 1 and indexes are 1-based', () => {
    expect(m.getSegment('OBX')[0]).toBe('OBX')
    expect(m.getSegment('OBX', 2)[0]).toBe('OBX')
    // identity: getSegment('OBX',2) is the same object the 2nd OBX get() reads from
    expect(m.getSegment('OBX', 2)).toBe(m.getSegments('OBX')[1])
    expect(m.get('OBX[1].1.1')).toBe('1') // OBX-1 of first OBX
    expect(m.get('OBX[2].1.1')).toBe('2') // OBX-1 of second OBX
  })

  it('getSegment returns undefined for a missing segment', () => {
    expect(m.getSegment('ZZZ')).toBeUndefined()
  })

  it('getSegments asserts a string arg', () => {
    expect(() => m.getSegments(5)).toThrow(/must be a string/)
  })
})

describe('set: fields, components, subcomponents, reps', () => {
  let HL7Message, m
  beforeEach(() => {
    HL7Message = loadSandbox().module.exports
    m = new HL7Message(ADT, [])
  })

  it('sets a subcomponent string', () => {
    m.set('PID.5.1', 'Smith')
    expect(m.get('PID.5.1')).toBe('Smith')
    expect(m.get('PID.5.2')).toBe('John') // siblings preserved
  })

  it('sets a numeric value (coerced to string)', () => {
    m.set('PID.7.1', 19991231)
    expect(m.get('PID.7.1')).toBe('19991231')
  })

  it('sets a field from an array (1-based components)', () => {
    m.set('PID.5', ['Smith', 'Jane', 'B'])
    expect(m.get('PID.5.1')).toBe('Smith')
    expect(m.get('PID.5.2')).toBe('Jane')
    expect(m.get('PID.5.3')).toBe('B')
  })

  it('sets a component from an array (1-based subcomponents)', () => {
    m.set('OBX.3.1', ['a', 'b'])
    expect(m.get('OBX.3.1.1')).toBe('a')
    expect(m.get('OBX.3.1.2')).toBe('b')
  })

  it('sets a field repetition by [n]', () => {
    m.set('PID.13[2].1', 'rep2')
    expect(m.get('PID.13[2].1')).toBe('rep2')
  })

  it('set auto-creates a new segment', () => {
    const ns = new HL7Message('MSH|^~\\&|A', [])
    ns.set('ZZ1.1.1', 'hello')
    expect(ns.get('ZZ1.1.1')).toBe('hello')
    expect(ns.segments.map(s => s[0])).toEqual(['MSH', 'ZZ1'])
    expect(ns.toString()).toBe('MSH|^~\\&|A\rZZ1|hello')
  })

  it('records operations in logs', () => {
    m.set('PID.5.1', 'X')
    expect(m.logs.length).toBeGreaterThan(0)
    expect(m.logs.some(l => l.msg === 'set')).toBe(true)
  })

  it('a plain object value spreads into components (1-based keys)', () => {
    // isPOJO is realm-agnostic now, so the object recurses and spreads into
    // components instead of being stringified to "[object Object]".
    m.set('PID.3', { 1: 'A', 2: 'B' })
    expect(m.get('PID.3.1')).toBe('A')
    expect(m.get('PID.3.2')).toBe('B')
  })

  it('set works WITHOUT a java mock on array/object values (java reference is guarded)', () => {
    const noJava = loadTemplates(['Globals/HL7Message.js']).module.exports
    const msg = new noJava(ADT, [])
    expect(() => msg.set('PID.5', ['a', 'b'])).not.toThrow()
    expect(msg.get('PID.5.1')).toBe('a')
    expect(msg.get('PID.5.2')).toBe('b')
    // a plain string set also works without java (primitive short-circuit).
    expect(() => msg.set('PID.5.1', 'ok')).not.toThrow()
    expect(msg.get('PID.5.1')).toBe('ok')
  })
})

describe('delete (prod-flagged)', () => {
  let HL7Message
  beforeEach(() => { HL7Message = loadSandbox().module.exports })

  it('delete component works: delete(PID.5.1) removes component 1', () => {
    const m = new HL7Message(ADT, [])
    m.delete('PID.5.1')
    expect(m.get('PID.5.1')).toBeUndefined()
    // remaining components preserved
    expect(m.get('PID.5.2')).toBe('John')
    expect(m.toString().split('\r')[1]).toContain('^John^A')
  })

  it('delete component works: delete(PID.5.2) removes only component 2', () => {
    const m = new HL7Message(ADT, [])
    m.delete('PID.5.2')
    expect(m.get('PID.5.1')).toBe('Doe')
    expect(m.get('PID.5.2')).toBeUndefined()
    expect(m.toString().split('\r')[1]).toContain('Doe^^A')
  })

  it('delete segment works: delete(NK1) removes the segment', () => {
    const m = new HL7Message(ADT, [])
    m.delete('NK1')
    expect(m.getSegments('NK1').length).toBe(0)
    expect(m.segments.map(s => s[0])).toEqual(['MSH', 'PID', 'OBX', 'OBX'])
  })

  it('delete indexed segment works: delete(OBX[2]) removes the 2nd OBX', () => {
    const m = new HL7Message(ADT, [])
    m.delete('OBX[2]')
    expect(m.getSegments('OBX').length).toBe(1)
    expect(m.get('OBX[1].3.1')).toBe('GLU')
  })

  // Fixed 2026-05-29: delete() now parses the path WITHOUT autoResolve, so a
  // field-level path removes the whole field (previously it auto-filled comp/sub
  // and only cleared subcomponent 5.1.1, leaving the field/component branches dead).
  it('delete(PID.5) removes the WHOLE field', () => {
    const m = new HL7Message(ADT, [])
    m.delete('PID.5')
    expect(m.get('PID.5.1')).toBeUndefined()
    expect(m.get('PID.5.2')).toBeUndefined()
    expect(m.toString().split('\r')[1]).toContain('PID|1||12345^^^MR|||') // empty PID-5
  })
})

describe('deleteAllSegments', () => {
  it('removes every segment of a given name', () => {
    const HL7Message = loadSandbox().module.exports
    const m = new HL7Message(ADT, [])
    m.deleteAllSegments('OBX')
    expect(m.getSegments('OBX').length).toBe(0)
    expect(m.segments.map(s => s[0])).toEqual(['MSH', 'PID', 'NK1'])
  })
})

describe('search: findInSegment / findSegment', () => {
  let HL7Message, sandbox, m
  const mkRe = (src, flags) =>
    vm.runInContext('new RegExp(' + JSON.stringify(src) + (flags ? ',' + JSON.stringify(flags) : '') + ')', sandbox)
  beforeEach(() => {
    sandbox = loadSandbox()
    HL7Message = sandbox.module.exports
    m = new HL7Message(ADT)
  })

  it('findInSegment returns the matching return-field value', () => {
    expect(m.findInSegment('OBX.3.1', mkRe('GLU'), 'OBX.5.1')).toEqual(['95'])
  })

  it('findInSegment collects across all matching segments', () => {
    expect(m.findInSegment('OBX.3.1', mkRe('.'), 'OBX.5.1')).toEqual(['95', '14.2'])
  })

  it('findInSegment with a sandbox-realm extractor returns capture group 1', () => {
    // "14.2" -> /(\d+)\.(\d+)/ -> match[1] = "14"
    expect(m.findInSegment('OBX.3.2', mkRe('Hemoglobin'), 'OBX.5.1', mkRe('(\\d+)\\.(\\d+)'))).toEqual(['14'])
  })

  it('findInSegment returns [] when nothing matches', () => {
    expect(m.findInSegment('OBX.3.1', mkRe('NOPE'), 'OBX.5.1')).toEqual([])
  })

  it('findSegment returns the first matching segment object', () => {
    const seg = m.findSegment('OBX.3.2', mkRe('Hemoglobin'))
    expect(seg[0]).toBe('OBX')
    // the matched segment is the 2nd OBX (OBX-1 == "2")
    expect(seg).toBe(m.getSegments('OBX')[1])
  })

  it('findSegment returns undefined when no segment matches', () => {
    expect(m.findSegment('OBX.3.1', mkRe('NOPE'))).toBeUndefined()
  })
})

describe('diff', () => {
  let HL7Message
  beforeEach(() => { HL7Message = loadSandbox().module.exports })

  it('reports a single differing subcomponent with an HL7 path', () => {
    const a = new HL7Message(ADT)
    const b = new HL7Message(ADT.replace('Doe^John^A', 'Doe^Jane^A'))
    expect(a.diff(b)).toEqual(['PID[1].5[1].2.1: John != Jane'])
  })

  it('identical messages diff to []', () => {
    const a = new HL7Message(ADT)
    expect(a.diff(new HL7Message(ADT))).toEqual([])
  })

  it('ignoreCase option suppresses case-only differences', () => {
    const a = new HL7Message(ADT)
    const b = new HL7Message(ADT.replace('Doe^John^A', 'Doe^JOHN^A'))
    expect(a.diff(b)).not.toEqual([])
    expect(a.diff(b, { ignoreCase: true })).toEqual([])
  })

  it('reports a segment missing in the other message', () => {
    const a = new HL7Message(ADT)
    const b = new HL7Message(ADT.split('\r').filter(l => !l.startsWith('NK1')).join('\r'))
    expect(a.diff(b)).toContain('NK1[1]: missing in other')
  })

  it('reports a segment missing in this message', () => {
    const a = new HL7Message(ADT.split('\r').filter(l => !l.startsWith('NK1')).join('\r'))
    const b = new HL7Message(ADT)
    expect(a.diff(b)).toContain('NK1[1]: missing in this')
  })
})

describe('validation', () => {
  let HL7Message, sandbox
  const mkRe = (src) => vm.runInContext('new RegExp(' + JSON.stringify(src) + ')', sandbox)
  beforeEach(() => {
    sandbox = loadSandbox()
    HL7Message = sandbox.module.exports
  })

  it('addRule / validate: failing rule surfaces in validationIssues', () => {
    const m = new HL7Message(ADT, [])
    m.addRule(() => true)
    m.addRule(() => 'always-bad')
    expect(m.isValid).toBe(false)
    expect(m.validationIssues).toContain('always-bad')
  })

  it('addRule asserts the rule is a function', () => {
    const m = new HL7Message(ADT, [])
    expect(() => m.addRule('x')).toThrow(/must be a function/)
  })

  it('addRules adds multiple rules', () => {
    const m = new HL7Message(ADT, [])
    m.addRules([() => true, () => 'bad'])
    // The validationIssues getter now runs validate() on read.
    expect(m.validationIssues).toContain('bad')
  })

  it('addRuleIsRequired passes when present, fails when missing', () => {
    const ok = new HL7Message(ADT, []).addRuleIsRequired('PID.5.1')
    expect(ok.isValid).toBe(true)

    const bad = new HL7Message(ADT, []).addRuleIsRequired('ZZZ.1.1', 'need it')
    expect(bad.isValid).toBe(false)
    expect(bad.validationIssues[0]).toContain('ZZZ.1.1 is missing')
  })

  it('addRulesIsRequired adds multiple required rules', () => {
    const m = new HL7Message(ADT, [])
    m.addRulesIsRequired([['PID.5.1', ''], ['ZZZ.1.1', 'missing']])
    expect(m.validate().length).toBe(1)
  })

  it('addRuleMatches passes on match, fails on mismatch (sandbox-realm regex)', () => {
    const ok = new HL7Message(ADT, []).addRuleMatches('MSH.9.1', mkRe('^ADT'), 'bad')
    expect(ok.isValid).toBe(true)

    const bad = new HL7Message(ADT, []).addRuleMatches('MSH.9.1', mkRe('^ORU'), 'expected ORU')
    expect(bad.isValid).toBe(false)
    expect(bad.validationIssues[0]).toContain('does not match')
  })

  it('addRuleMatches asserts regex must be a RegExp', () => {
    const m = new HL7Message(ADT, [])
    expect(() => m.addRuleMatches('MSH.9.1', 'notregex', 'x')).toThrow(/must be a regular expression/)
  })

  it('addRulesMatches adds multiple matches rules', () => {
    const m = new HL7Message(ADT, [])
    m.addRulesMatches([['MSH.9.1', mkRe('^ADT'), ''], ['PID.8.1', mkRe('^F$'), 'sex']])
    expect(m.validate().length).toBe(1) // PID.8.1 == 'M' fails
  })

  it('addRuleEnum passes when value is in list, fails otherwise', () => {
    const ok = new HL7Message(ADT, []).addRuleEnum('PID.8.1', ['M', 'F'])
    expect(ok.isValid).toBe(true)

    const bad = new HL7Message(ADT, []).addRuleEnum('PID.8.1', ['F', 'X'], 'sex')
    expect(bad.isValid).toBe(false)
    expect(bad.validationIssues[0]).toContain('does not match the required values')
  })

  it('addRuleEnum asserts values is an array', () => {
    const m = new HL7Message(ADT, [])
    expect(() => m.addRuleEnum('PID.8.1', 'M')).toThrow(/must be an array/)
  })

  it('addRulesEnum adds multiple enum rules', () => {
    const m = new HL7Message(ADT, [])
    m.addRulesEnum([['PID.8.1', ['M'], ''], ['MSH.9.1', ['ORU'], 'type']])
    expect(m.validate().length).toBe(1) // MSH.9.1 == ADT fails
  })

  it('validate() returns the issues array and updates validationIssues', () => {
    const m = new HL7Message(ADT, [() => 'x'])
    expect(m.validate()).toEqual(['x'])
    expect(m.validationIssues).toEqual(['x'])
  })

  it('validationIssues getter runs validation on read (like isValid)', () => {
    const m = new HL7Message(ADT, [() => 'x'])
    // reading validationIssues now triggers validate() itself; no explicit call needed.
    expect(m.validationIssues).toEqual(['x'])
    // and isValid agrees
    expect(m.isValid).toBe(false)
  })
})

describe('serialization & round-trip', () => {
  let HL7Message
  beforeEach(() => { HL7Message = loadSandbox().module.exports })

  it('toString round-trips the ADT message exactly (segments joined by \\r)', () => {
    const m = new HL7Message(ADT)
    expect(m.toString()).toBe(ADT)
    expect(m.toString().split('\r').length).toBe(5)
  })

  it('round-trips field repetitions', () => {
    expect(new HL7Message(REPS).toString()).toBe(REPS)
  })

  it('round-trips subcomponents', () => {
    expect(new HL7Message(SUBCOMP).toString()).toBe(SUBCOMP)
  })

  it('MSH toString does not duplicate the field separator', () => {
    const m = new HL7Message(ADT)
    const mshLine = m.toString().split('\r')[0]
    expect(mshLine.startsWith('MSH|^~\\&|SENDAPP')).toBe(true)
  })

  it('valueOf returns a deep-cloned plain segments array', () => {
    const m = new HL7Message(ADT)
    const v = m.valueOf()
    expect(Array.isArray(v)).toBe(true)
    expect(v[0][0]).toBe('MSH')
    v[0][0] = 'XXX'
    expect(m.segments[0][0]).toBe('MSH') // clone, not reference
  })

  it('formattedJSON yields one JSON row per segment inside [ ]', () => {
    const m = new HL7Message(ADT)
    const out = m.formattedJSON()
    expect(out.startsWith('[\n')).toBe(true)
    expect(out.trimEnd().endsWith(']')).toBe(true)
    expect(out.split('\n').filter(l => l.trim().startsWith('{')).length).toBe(5)
  })
})

describe('createAckMessage', () => {
  it('swaps sender/receiver, sets MSH-9 ACK and copies MSA control id', () => {
    const HL7Message = loadSandbox().module.exports
    const m = new HL7Message(ADT)
    const ack = m.createAckMessage()
    expect(ack.get('MSH.9.1')).toBe('ACK')
    expect(ack.get('MSH.3.1')).toBe('RECVAPP') // was MSH.5.1
    expect(ack.get('MSH.4.1')).toBe('RECVFAC') // was MSH.6.1
    expect(ack.get('MSH.5.1')).toBe('SENDAPP') // was MSH.3.1
    expect(ack.get('MSH.6.1')).toBe('SENDFAC') // was MSH.4.1
    expect(ack.get('MSA.1.1')).toBe('AA')
    expect(ack.get('MSA.2.1')).toBe('MSG00001') // copies MSH.10.1 (control id)
    expect(ack.get('MSH.12.1')).toBe('2.3')
  })
})

describe('arrayToHl7Path', () => {
  let HL7Message, m
  beforeEach(() => {
    HL7Message = loadSandbox().module.exports
    m = new HL7Message(ADT)
  })

  it('builds dotted/indexed paths', () => {
    expect(m.arrayToHl7Path(['PID'])).toBe('PID')
    expect(m.arrayToHl7Path(['PID', 2])).toBe('PID[2]')
    expect(m.arrayToHl7Path(['PID', 1, 5])).toBe('PID[1].5')
    expect(m.arrayToHl7Path(['PID', 1, 5, 2])).toBe('PID[1].5[2]')
    expect(m.arrayToHl7Path(['PID', 1, 5, 1, 2, 3])).toBe('PID[1].5[1].2.3')
  })

  it('asserts a segment is present', () => {
    expect(() => m.arrayToHl7Path([])).toThrow(/must have a segment/)
  })
})

describe('custom (non-standard) encoding', () => {
  let HL7Message
  beforeEach(() => { HL7Message = loadSandbox().module.exports })

  it('parses messages with non-standard encoding chars from MSH', () => {
    // field=#, component=@, fieldRepetition=!, escape=\, subcomponent=$
    const custom = 'MSH#@!\\$#A#B\rPID#1#x@y'
    const m = new HL7Message(custom)
    expect(m.encoding.field).toBe('#')
    expect(m.encoding.component).toBe('@')
    expect(m.encoding.fieldRepetition).toBe('!')
    expect(m.encoding.subcomponent).toBe('$')
    expect(m.get('PID.2.1')).toBe('x')
    expect(m.get('PID.2.2')).toBe('y')
  })

  it('encoding is reflected in toString separators', () => {
    const custom = 'MSH#@!\\$#A#B\rPID#1#x@y'
    const m = new HL7Message(custom)
    // round-trips with the custom field separator (MSH gets a trailing field sep)
    expect(m.toString().split('\r')[1]).toBe('PID#1#x@y')
  })
})

describe('toXML (XML + SerializerFactory mocked)', () => {
  function loadWithXml() {
    return loadSandbox({
      XML: function (s) { this.s = s },
      SerializerFactory: {
        getSerializer: () => ({
          toXML: (s) => '<HL7>' + s + '</HL7>',
          fromXML: () => 'MSH|^~\\&|FROMXML',
        }),
      },
    })
  }

  it('toXML calls the HL7V2 serializer and wraps the result in XML', () => {
    const sandbox = loadWithXml()
    const HL7Message = sandbox.module.exports
    const m = new HL7Message('MSH|^~\\&|A|B\rPID|1')
    const xml = m.toXML()
    expect(xml).toBeInstanceOf(sandbox.XML)
    expect(xml.s).toBe('<HL7>MSH|^~\\&|A|B\rPID|1</HL7>')
  })

  it('toXML removes literal null/undefined when removeNullish (default)', () => {
    const sandbox = loadWithXml()
    const HL7Message = sandbox.module.exports
    const m = new HL7Message('MSH|^~\\&|A|B\rNTE|nullX|undefinedY')
    expect(m.toXML().s).toBe('<HL7>MSH|^~\\&|A|B\rNTE|X|Y</HL7>')
  })

  it('toXML throws when XML global is absent (non-Mirth env)', () => {
    const HL7Message = loadSandbox().module.exports
    const m = new HL7Message(ADT)
    expect(() => m.toXML()).toThrow(/XML type not detected/)
  })

  it('parses an XML-instance input via the serializer fromXML path', () => {
    const sandbox = loadWithXml()
    const HL7Message = sandbox.module.exports
    const xmlInput = new sandbox.XML('whatever')
    const m = new HL7Message(xmlInput)
    expect(m.get('MSH.3.1')).toBe('FROMXML')
  })
})
