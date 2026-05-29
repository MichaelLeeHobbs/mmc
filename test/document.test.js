import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// Document.js bundles four classes in dependency order and ends with
//   module.exports = { Document, Page, Template, AdvanceString }
// It is pure string manipulation EXCEPT Document.prototype.toHL7, which calls the
// Mirth global `createSegment`. For toHL7 we inject a fake createSegment via the harness.
const { Document, Page, Template, AdvanceString } = loadTemplate('Document.js').module.exports

// ---------------------------------------------------------------------------
// AdvanceString
// ---------------------------------------------------------------------------
describe('AdvanceString', () => {
  describe('construction & options', () => {
    it('applies sensible defaults', () => {
      const s = new AdvanceString('hello')
      expect(s.options.maxLength).toBe(80)
      expect(s.options.crlf).toBe('\n')
      expect(s.options.centered).toBe(false)
      expect(s.options.autoWrap).toBe(false)
      expect(s.options.autoRemap).toBe(false)
      expect(s.options.specialCharacterMap).toEqual({})
      expect(s.toString()).toBe('hello')
    })

    it('normalizes line breaks to the configured crlf', () => {
      const s = new AdvanceString('a\r\nb\rc\nd', { crlf: '\n' })
      expect(s.toString()).toBe('a\nb\nc\nd')
    })

    it('honors a custom crlf string when normalizing', () => {
      const s = new AdvanceString('a\r\nb\nc', { crlf: '|' })
      expect(s.toString()).toBe('a|b|c')
    })

    it('respects a custom crlfRegex', () => {
      // Only split on literal ';' -- real newlines are left untouched.
      const s = new AdvanceString('a;b\nc', { crlf: '\n', crlfRegex: /;/g })
      expect(s.toString()).toBe('a\nb\nc')
    })

    it('valueOf returns the same primitive as toString', () => {
      const s = new AdvanceString('xyz')
      expect(s.valueOf()).toBe('xyz')
      expect('' + s).toBe('xyz')
    })
  })

  describe('toArray / lineLength', () => {
    it('toArray splits on line breaks', () => {
      const s = new AdvanceString('one\ntwo\nthree', { crlf: '\n' })
      expect(s.toArray()).toEqual(['one', 'two', 'three'])
    })

    it('lineLength reports the number of lines', () => {
      const s = new AdvanceString('one\ntwo\nthree', { crlf: '\n' })
      expect(s.lineLength).toBe(3)
    })
  })

  describe('template() substitution (#token# syntax)', () => {
    it('substitutes a #token# and pads the result to the match length', () => {
      // The token "#name#" is 6 chars; "Bob" is padded to 6 -> "Bob   ",
      // and the whole string is padEnd'd to the match length as well.
      const out = new AdvanceString('Name: #name#', { maxLength: 80 }).template({ name: 'Bob' }).toString()
      expect(out).toBe('Name: Bob   ')
    })

    it('substitutes an inline token and keeps surrounding text', () => {
      // "X#a#Y": match "#a#" len 3, "Q" -> "Q  ", giving "XQ  Y".
      const out = new AdvanceString('X#a#Y', { maxLength: 80 }).template({ a: 'Q' }).toString()
      expect(out).toBe('XQ  Y')
    })

    it('renders a missing value as spaces padded to the token length', () => {
      // "#x#" -> match len 3 -> three spaces.
      const out = new AdvanceString('#x#', { maxLength: 80 }).template({}).toString()
      expect(out).toBe('   ')
    })

    it('treats trailing # characters as part of the token width', () => {
      // "a#nm####b": token name "nm", full match "#nm####" len 7 -> "Z" padded to 7.
      const out = new AdvanceString('a#nm####b', { maxLength: 80 }).template({ nm: 'Z' }).toString()
      expect(out).toBe('aZ      b')
    })

    it('does NOT substitute a non-matching token (no trailing #)', () => {
      // The regex requires at least one trailing '#'. "#x" alone never matches.
      const out = new AdvanceString('#x', { maxLength: 80 }).template({ x: 'NOPE' }).toString()
      expect(out).toBe('#x')
    })

    it('returns a new AdvanceString (immutability)', () => {
      const base = new AdvanceString('#a#', { maxLength: 80 })
      const out = base.template({ a: 'Z' })
      expect(out).not.toBe(base)
      expect(base.toString()).toBe('#a#')
      expect(out).toBeInstanceOf(AdvanceString)
    })
  })

  describe('word wrap', () => {
    it('word-wraps when autoWrap is enabled at construction', () => {
      const s = new AdvanceString('the quick brown fox jumps', { maxLength: 10, autoWrap: true })
      s.toArray().forEach((line) => expect(line.length).toBeLessThanOrEqual(10))
    })

    it('wraps at word boundaries (not mid-word)', () => {
      const s = new AdvanceString('aaaa bbbb cccc', { maxLength: 9, autoWrap: true })
      expect(s.toArray()).toEqual(['aaaa bbbb', 'cccc'])
    })

    it('keeps a word equal to maxLength on its own line (exact boundary)', () => {
      const s = new AdvanceString('123456789 12345', { maxLength: 9, autoWrap: true })
      expect(s.toArray()).toEqual(['123456789', '12345'])
    })

    it('wordWrap() rewraps an existing instance', () => {
      const s = new AdvanceString('aaaa bbbb cccc', { maxLength: 9 })
      expect(s.wordWrap().toArray()).toEqual(['aaaa bbbb', 'cccc'])
    })
  })

  describe('centering', () => {
    it('centers text within maxLength at construction', () => {
      const s = new AdvanceString('hi', { maxLength: 10, centered: true })
      const out = s.toString()
      expect(out.length).toBe(10)
      expect(out.trim()).toBe('hi')
    })

    it('center() produces a string padded to the requested length', () => {
      const out = new AdvanceString('hi').center(8).toString()
      expect(out.length).toBe(8)
      expect(out.trim()).toBe('hi')
    })
  })

  describe('splitOnLineCount', () => {
    it('chunks lines into groups of n joined by \\n', () => {
      const s = new AdvanceString('a\nb\nc\nd\ne', { crlf: '\n' })
      expect(s.splitOnLineCount(2)).toEqual(['a\nb', 'c\nd', 'e'])
    })

    it('returns a single chunk when n exceeds the line count', () => {
      const s = new AdvanceString('a\nb', { crlf: '\n' })
      expect(s.splitOnLineCount(10)).toEqual(['a\nb'])
    })

    it('throws on a negative line count', () => {
      const s = new AdvanceString('a\nb', { crlf: '\n' })
      expect(() => s.splitOnLineCount(-1)).toThrow('Cannot split on negative line count!')
    })

    // BUG: splitOnLineCount(0) does `arr.splice(0,0)` forever, producing an
    // ever-growing result array until "RangeError: Invalid array length".
    // The class only guards against negative n, not zero.
    it('throws RangeError on a zero line count (off-by quirk, not the friendly error)', () => {
      const s = new AdvanceString('a\nb', { crlf: '\n' })
      expect(() => s.splitOnLineCount(0)).toThrow('Invalid array length')
    })
  })

  describe('set()', () => {
    it('replaces the string, applying word wrap when autoWrap is on', () => {
      const base = new AdvanceString('', { maxLength: 5, autoWrap: true })
      expect(base.set('aa bb cc dd').toArray()).toEqual(['aa bb', 'cc dd'])
    })

    it('replaces the string verbatim when autoWrap is off', () => {
      const base = new AdvanceString('orig', { maxLength: 5, autoWrap: false })
      expect(base.set('aa bb cc dd').toString()).toBe('aa bb cc dd')
    })

    it('coerces non-string input via String()', () => {
      const base = new AdvanceString('orig')
      expect(base.set(123).toString()).toBe('123')
    })
  })

  describe('special-character remapping', () => {
    const scm = { 'á': 'a', 'ñ': 'n' }

    it('remaps characters via a custom specialCharacterMap when autoRemap is true', () => {
      const s = new AdvanceString('áñb', { specialCharacterMap: scm, autoRemap: true })
      expect(s.toString()).toBe('anb')
    })

    it('leaves characters untouched when autoRemap is false', () => {
      const s = new AdvanceString('áñb', { specialCharacterMap: scm, autoRemap: false })
      expect(s.toString()).toBe('áñb')
    })

    it('static characterRemap maps mapped chars and passes others through', () => {
      expect(AdvanceString.characterRemap('cáfeñ', scm)).toBe('cafen')
    })
  })

  describe('static decode + encodings', () => {
    it('exposes HL7 encodings', () => {
      expect(AdvanceString.encodings.HL7.FIELD_SEPARATOR.decode).toBe('|')
    })

    it('decode applies an encoding map of encode->decode', () => {
      // FIELD_SEPARATOR.encode is the regex source "\\F\\" -> matches literal "\F\".
      const out = AdvanceString.decode('a\\F\\b', AdvanceString.encodings.HL7)
      expect(out).toBe('a|b')
    })
  })
})

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
describe('Template', () => {
  describe('construction & length', () => {
    it('defaults to an empty line list and maxLineLength 80', () => {
      const tpl = new Template()
      expect(tpl.length).toBe(0)
      expect(tpl._maxLineLength).toBe(80)
    })

    it('coerces a non-array lines argument to an empty list', () => {
      const tpl = new Template('not-an-array')
      expect(tpl.length).toBe(0)
    })

    it('reports its length as the number of lines', () => {
      expect(new Template(['a', 'b', 'c']).length).toBe(3)
    })
  })

  describe('getLine / setLine', () => {
    it('round-trips a line', () => {
      const tpl = new Template([], { maxLineLength: 80 })
      tpl.setLine(0, 'hello')
      expect(tpl.getLine(0)).toBe('hello')
    })

    it('throws via Template.ERRORS when a line exceeds maxLineLength', () => {
      const tpl = new Template([], { maxLineLength: 5 })
      expect(() => tpl.setLine(0, 'toolong')).toThrow('Input with length of 7 exceeds max length of 5!')
    })

    it('Template.ERRORS.toLong throws the formatted message', () => {
      expect(() => Template.ERRORS.toLong(5, 7)).toThrow('Input with length of 7 exceeds max length of 5!')
    })
  })

  describe('transformers', () => {
    it('getLineTransformers / setLineTransformers round-trip', () => {
      const tpl = new Template(['a'])
      tpl.setLineTransformers(1, ['toUpperCase'])
      expect(tpl.getLineTransformers(1)).toEqual(['toUpperCase'])
    })

    it('applies a globalTransformer to every line', () => {
      const tpl = new Template(['hi', 'yo'], { globalTransformer: ['toUpperCase'] })
      expect(tpl.toString({})).toBe('HI\nYO')
    })

    // Per-line transformers are looked up at index (i+1), NOT i. So a transformer
    // placed at index 0 applies to line 1 (the second line), and index 1 -> line ... etc.
    it('applies per-line transformers at index i+1 (off-by-one indexing)', () => {
      // transformers[1] applies to line index 0 ("hello"); line index 1 ("world")
      // would need transformers[2]. With [['x'],['toUpperCase']]:
      //   line 0 uses transformers[1] = ['toUpperCase'] -> HELLO
      //   line 1 uses transformers[2] = undefined        -> world
      const tpl = new Template(['hello', 'world'], { transformers: [['noop'], ['toUpperCase']] })
      expect(tpl.toString({})).toBe('HELLO\nworld')
    })
  })

  describe('toString(values)', () => {
    it('renders #token# placeholders from values', () => {
      const tpl = new Template(['Name: #name#'], { maxLineLength: 80 })
      expect(tpl.toString({ name: 'Bob' })).toContain('Bob')
    })

    it('joins multiple lines with \\n', () => {
      const tpl = new Template(['a', 'b'], { maxLineLength: 80 })
      expect(tpl.toString({})).toBe('a\nb')
    })

    it('combines globalTransformer + substitution', () => {
      const tpl = new Template(['name=#n#'], { maxLineLength: 80, globalTransformer: ['toUpperCase'] })
      expect(tpl.toString({ n: 'bob' })).toBe('NAME=BOB')
    })
  })
})

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
describe('Page', () => {
  describe('defaults & getter/setters', () => {
    it('applies documented defaults', () => {
      const p = new Page()
      expect(p.maxLines).toBe(60)
      expect(p.minLines).toBe(60) // defaults to maxLines
      expect(p.maxLineLength).toBe(78)
      expect(p.pageNumber).toBe(1)
      expect(p.totalPages).toBe(1)
      expect(p.header).toBeInstanceOf(Template)
      expect(p.footer).toBeInstanceOf(Template)
    })

    it('getter/setters created via createGetterSetter are read/write', () => {
      const p = new Page()
      p.pageNumber = 5
      p.totalPages = 9
      expect(p.pageNumber).toBe(5)
      expect(p.totalPages).toBe(9)
      p.maxLines = 30
      expect(p.maxLines).toBe(30)
    })
  })

  describe('setBody', () => {
    it('stores the body as an AdvanceString that word-wraps by default', () => {
      const p = new Page({ maxLineLength: 9 })
      p.setBody('aaaa bbbb cccc')
      expect(p._body.toArray()).toEqual(['aaaa bbbb', 'cccc'])
    })

    it('coerces null/empty text to an empty body', () => {
      const p = new Page()
      p.setBody(null)
      expect(p._body.toString()).toBe('')
    })
  })

  describe('trimBody', () => {
    it('keeps the first chunk and returns the overflow', () => {
      const p = new Page({ text: 'l1\nl2\nl3\nl4\nl5', maxLines: 2, maxLineLength: 20 })
      const overflow = p.trimBody()
      expect(p._body.toString()).toBe('l1\nl2')
      expect(overflow).toBe('l3\nl4\nl5')
    })

    it('returns an empty string when everything fits', () => {
      const p = new Page({ text: 'l1\nl2', maxLines: 10, maxLineLength: 20 })
      expect(p.trimBody()).toBe('')
    })

    it('throws when maxLines - (header.length + footer.length) < 0', () => {
      const p = new Page({
        text: 'x', maxLines: 1,
        header: new Template(['a']), footer: new Template(['b']),
      })
      expect(() => p.trimBody()).toThrow('Cannot trim because maxLines - (header.length + footer.length) is < 0!')
    })
  })

  describe('toString', () => {
    it('renders header + body + footer with page-number substitution', () => {
      const p = new Page({
        text: 'b1\nb2', maxLines: 60, minLines: 5, maxLineLength: 78,
        header: new Template(['HEAD #pageNumber#/#totalPages#']),
        footer: new Template(['FOOT']),
      })
      p.pageNumber = 1
      p.totalPages = 2
      const lines = p.toString().split('\n')
      expect(lines[0]).toMatch(/^HEAD 1/)
      expect(lines[0]).toContain('/2')
      expect(lines).toContain('b1')
      expect(lines).toContain('b2')
      expect(lines[lines.length - 1]).toBe('FOOT')
    })

    it('pads with blank lines toward the minimum line requirement', () => {
      // minLines 8, header 1 line ("H"), body "only", footer "F".
      // header+body+trailing\n split -> ['H','only',''] (len 3).
      // requiredLines = minLines - footer.length = 8 - 1 = 7, so it pads to 7
      // body+padding lines, then appends the footer => 7 total lines.
      const p = new Page({
        text: 'only', maxLines: 60, minLines: 8, maxLineLength: 78,
        header: new Template(['H']), footer: new Template(['F']),
      })
      const lines = p.toString().split('\n')
      expect(lines).toEqual(['H', 'only', '', '', '', '', 'F'])
    })

    it('renders an empty leading line for an empty header Template', () => {
      // An empty Template.toString() yields '' so the header occupies one blank line.
      const p = new Page({ text: 'a\nb', maxLines: 60, minLines: 5 })
      const lines = p.toString().split('\n')
      expect(lines[0]).toBe('')
      expect(lines).toContain('a')
      expect(lines).toContain('b')
    })
  })
})

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
describe('Document', () => {
  describe('constructor & defaults', () => {
    it('applies documented defaults', () => {
      const d = new Document()
      expect(d._maxLines).toBe(60)
      expect(d._minLines).toBe(60)
      expect(d._maxLineLength).toBe(78)
      expect(d._crlf).toBe('\n')
      expect(d._autoRemap).toBe(true)
      expect(d._header).toBeInstanceOf(Template)
      expect(d._footer).toBeInstanceOf(Template)
      expect(d._text).toBe('')
    })

    it('honors minLines override', () => {
      const d = new Document({ maxLines: 50, minLines: 10 })
      expect(d._minLines).toBe(10)
    })
  })

  describe('cloneData', () => {
    it('shallow-clones a data object into a new object', () => {
      const src = { a: 1, b: 2 }
      const clone = Document.cloneData(src)
      expect(clone).toEqual(src)
      expect(clone).not.toBe(src)
    })
  })

  describe('toString', () => {
    it('renders body text on a single page when it fits', () => {
      const doc = new Document({ text: 'line one\nline two', maxLines: 60, maxLineLength: 78 })
      const out = doc.toString()
      expect(out).toContain('line one')
      expect(out).toContain('line two')
    })

    it('wraps long lines to maxLineLength', () => {
      const doc = new Document({ text: 'the quick brown fox jumps over the lazy dog', maxLines: 60, maxLineLength: 10 })
      doc.toArray().forEach((line) => expect(line.length).toBeLessThanOrEqual(10))
    })

    it('paginates across multiple pages, preserving all rows', () => {
      const lines = Array.from({ length: 10 }, (_, i) => 'row' + i).join('\n')
      const doc = new Document({ text: lines, maxLines: 3, minLines: 3, maxLineLength: 20 })
      const out = doc.toString()
      for (let i = 0; i < 10; i++) expect(out).toContain('row' + i)
    })

    it('substitutes pageNumber/totalPages per page and produces the expected page count', () => {
      // 6 rows, maxLines 3. trimBody capacity = maxLines - (header.length + footer.length)
      // = 3 - 1 = 2 body rows per page => 3 pages. (The header DOES count against capacity.)
      const lines = Array.from({ length: 6 }, (_, i) => 'row' + i).join('\n')
      const doc = new Document({
        text: lines, maxLines: 3, minLines: 3, maxLineLength: 20,
        header: new Template(['P#pageNumber# of #totalPages#']),
      })
      const out = doc.toString()
      // Headers are substituted with the running page number and total page count.
      expect(out).toMatch(/P1\s+of 3/)
      expect(out).toMatch(/P2\s+of 3/)
      expect(out).toMatch(/P3\s+of 3/)
      // Three page headers => exactly three "of 3" occurrences.
      const headerCount = (out.match(/of 3/g) || []).length
      expect(headerCount).toBe(3)
    })

    it('produces a realistic multi-page document with header, footer, wrapping and totals', () => {
      const body = [
        'Patient presented with mild symptoms and was evaluated thoroughly today',
        'Vitals were within normal limits across the board for this visit',
        'Recommended follow up in two weeks with the primary care provider',
        'No acute distress noted during the comprehensive physical examination',
      ].join('\n')
      const doc = new Document({
        text: body,
        maxLines: 4,
        minLines: 4,
        maxLineLength: 30,
        header: new Template(['REPORT - page #pageNumber# of #totalPages#']),
        footer: new Template(['--- end of page #pageNumber# ---']),
        specialCharacterMap: { '’': "'" },
        autoRemap: true,
      })
      const out = doc.toString()
      const lines = out.split('\n')
      // Only the BODY is wrapped to maxLineLength; headers/footers are not wrapped.
      // The body sentences are the original four (now wrapped). Verify wrapped body
      // lines obey the limit by excluding the known header/footer lines.
      lines
        .filter((l) => !l.startsWith('REPORT - page') && !l.startsWith('--- end of page'))
        .forEach((line) => expect(line.length).toBeLessThanOrEqual(30))
      // Multiple pages were produced.
      const pageHeaders = out.match(/REPORT - page \d+\s+of \d+/g) || []
      expect(pageHeaders.length).toBeGreaterThan(1)
      // The total-pages token equals the actual number of page headers.
      const total = pageHeaders.length
      pageHeaders.forEach((h) => expect(h).toContain('of ' + total))
      // Footer rendered on the first page.
      expect(out).toContain('end of page 1')
    })

    it('remaps special characters in the body via specialCharacterMap', () => {
      const doc = new Document({
        text: 'café naïve',
        maxLines: 60, maxLineLength: 78,
        specialCharacterMap: { 'é': 'e', 'ï': 'i' },
        autoRemap: true,
      })
      expect(doc.toString()).toContain('cafe naive')
    })

    it('renders an empty document as a single (blank) page', () => {
      const out = new Document({ text: '', maxLines: 5, minLines: 1 }).toString()
      // One page: empty header line + empty body line + trailing crlf from page + doc crlf.
      expect(out).toBe('\n\n\n')
    })
  })

  describe('toArray', () => {
    it('returns an array of lines split on crlf', () => {
      const doc = new Document({ text: 'a\nb\nc', maxLines: 60 })
      const arr = doc.toArray()
      expect(Array.isArray(arr)).toBe(true)
      expect(arr).toContain('a')
      expect(arr).toContain('b')
      expect(arr).toContain('c')
    })
  })
})

// ---------------------------------------------------------------------------
// Document.toHL7 (requires the Mirth global `createSegment`)
// ---------------------------------------------------------------------------
describe('Document.toHL7', () => {
  // toHL7 writes into segment objects shaped like obx['OBX.1']['OBX.1.1'] = value.
  // We inject a fake createSegment that produces such nested objects and records
  // every segment it created against the supplied message object.
  function makeSegment() {
    const seg = {}
    for (const n of [1, 2, 3, 5, 11, 14]) {
      seg['OBX.' + n] = {}
    }
    return seg
  }

  function loadWithFakeSegment() {
    const calls = []
    const env = {
      createSegment: function (name, msgObj, index) {
        const seg = makeSegment()
        calls.push({ name: name, index: index, seg: seg })
        if (!msgObj.segments) msgObj.segments = []
        msgObj.segments.push(seg)
        return seg
      },
    }
    const exported = loadTemplate('Document.js', env).module.exports
    return { Document: exported.Document, Template: exported.Template, calls }
  }

  it('creates one OBX segment per rendered line and fills the expected fields', () => {
    const { Document, calls } = loadWithFakeSegment()
    const doc = new Document({ text: 'hello\nworld', maxLines: 60, maxLineLength: 78 })
    const rendered = doc.toString()
    const expectedLineCount = rendered.split('\n').length

    const hl7msg = {}
    doc.toHL7(hl7msg)

    // One createSegment('OBX', ...) call per line of the rendered document.
    expect(calls.length).toBe(expectedLineCount)
    expect(calls.every((c) => c.name === 'OBX')).toBe(true)

    // Set-numbers are sequential starting at 1; value type defaults to 'FT'.
    calls.forEach((c, i) => {
      expect(c.seg['OBX.1']['OBX.1.1']).toBe(i + 1)
      expect(c.seg['OBX.2']['OBX.2.1']).toBe('FT')
    })

    // OBX.5.1 carries each rendered line of text in order.
    const renderedLines = rendered.split('\n')
    calls.forEach((c, i) => {
      expect(c.seg['OBX.5']['OBX.5.1']).toBe(renderedLines[i])
    })
  })

  it('passes the segment index through to createSegment', () => {
    const { Document, calls } = loadWithFakeSegment()
    const doc = new Document({ text: 'a\nb\nc', maxLines: 60, maxLineLength: 78 })
    doc.toHL7({})
    calls.forEach((c, i) => expect(c.index).toBe(i))
  })

  it('honors custom OBX options', () => {
    const { Document, calls } = loadWithFakeSegment()
    const doc = new Document({ text: 'x', maxLines: 60, maxLineLength: 78 })
    doc.toHL7({}, { 'OBX.2.1': 'TX', 'OBX.3.1': 'CODE', 'OBX.11.1': 'F', 'OBX.14.1': '20260101' })
    const c = calls[0]
    expect(c.seg['OBX.2']['OBX.2.1']).toBe('TX')
    expect(c.seg['OBX.3']['OBX.3.1']).toBe('CODE')
    expect(c.seg['OBX.11']['OBX.11.1']).toBe('F')
    expect(c.seg['OBX.14']['OBX.14.1']).toBe('20260101')
  })
})
