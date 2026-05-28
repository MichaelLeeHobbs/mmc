import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// Document.js sets module.exports = { Document, Page, Template, AdvanceString }.
const { Document, AdvanceString, Template } = loadTemplate('Document.js').module.exports

describe('AdvanceString', () => {
  it('normalizes line breaks to the configured crlf', () => {
    const s = new AdvanceString('a\r\nb\rc\nd', { crlf: '\n' })
    expect(s.toString()).toBe('a\nb\nc\nd')
  })

  it('toArray splits on line breaks', () => {
    const s = new AdvanceString('one\ntwo\nthree', { crlf: '\n' })
    expect(s.toArray()).toEqual(['one', 'two', 'three'])
  })

  it('word-wraps when autoWrap is enabled', () => {
    const s = new AdvanceString('the quick brown fox jumps', { maxLength: 10, autoWrap: true })
    s.toArray().forEach((line) => expect(line.length).toBeLessThanOrEqual(10))
  })

  it('centers text within maxLength', () => {
    const s = new AdvanceString('hi', { maxLength: 10, centered: true })
    const out = s.toString()
    expect(out.length).toBe(10)
    expect(out.trim()).toBe('hi')
  })
})

describe('Template', () => {
  it('renders #token# placeholders from values', () => {
    const tpl = new Template(['Name: #name#'], { maxLineLength: 80 })
    const out = tpl.toString({ name: 'Bob' })
    expect(out).toContain('Bob')
  })

  it('reports its length as the number of lines', () => {
    const tpl = new Template(['a', 'b', 'c'])
    expect(tpl.length).toBe(3)
  })
})

describe('Document pagination', () => {
  it('toString renders body text', () => {
    const doc = new Document({ text: 'line one\nline two', maxLines: 60, maxLineLength: 78 })
    const out = doc.toString()
    expect(out).toContain('line one')
    expect(out).toContain('line two')
  })

  it('toArray returns an array of lines', () => {
    const doc = new Document({ text: 'a\nb\nc', maxLines: 60 })
    const arr = doc.toArray()
    expect(Array.isArray(arr)).toBe(true)
    expect(arr).toContain('a')
    expect(arr).toContain('b')
    expect(arr).toContain('c')
  })

  it('paginates body across multiple pages when it exceeds maxLines', () => {
    // 10 short lines, maxLines 3 (no header/footer) => multiple pages.
    const lines = Array.from({ length: 10 }, (_, i) => 'row' + i).join('\n')
    const doc = new Document({ text: lines, maxLines: 3, minLines: 3, maxLineLength: 20 })
    const out = doc.toString()
    // All rows should still be present after pagination.
    for (let i = 0; i < 10; i++) {
      expect(out).toContain('row' + i)
    }
  })

  it('wraps long lines to maxLineLength', () => {
    const doc = new Document({ text: 'the quick brown fox jumps over the lazy dog', maxLines: 60, maxLineLength: 10 })
    doc.toArray().forEach((line) => expect(line.length).toBeLessThanOrEqual(10))
  })
})
