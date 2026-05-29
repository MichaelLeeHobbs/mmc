import { describe, it, expect, vi } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// A java.lang.StringBuilder stand-in (append is chainable, toString returns buffer).
function makeStringBuilder() {
  return function StringBuilder() {
    let buf = ''
    this.append = (s) => { buf += s; return this }
    this.toString = () => buf
  }
}

// Build the com.lowagie.text.pdf.{PdfReader, parser.PdfTextExtractor} chain.
function makeCom({ pages, pageText, readerThrows, closeSpy }) {
  return {
    lowagie: {
      text: {
        pdf: {
          PdfReader: function PdfReader(_bytes) {
            if (readerThrows) throw new Error(readerThrows)
            this.getNumberOfPages = () => pages
            this.close = closeSpy
          },
          parser: {
            PdfTextExtractor: function PdfTextExtractor(_reader) {
              this.getTextFromPage = (i) => pageText(i)
            },
          },
        },
      },
    },
  }
}

function load(env) {
  return loadTemplate('Globals/pdfUtils.js', {
    java: { lang: { StringBuilder: makeStringBuilder() } },
    ...env,
  })
}

describe('pdfUtils.extractText', () => {
  it('concatenates page text joined by blank lines and closes the reader', () => {
    const close = vi.fn()
    const sb = load({
      com: makeCom({ pages: 3, pageText: (i) => 'page' + i, closeSpy: close }),
    })
    const text = sb.pdfUtils.extractText([1, 2, 3])
    expect(text).toBe('page1\n\npage2\n\npage3')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('returns a single page with no trailing separator', () => {
    const close = vi.fn()
    const sb = load({
      com: makeCom({ pages: 1, pageText: () => 'only', closeSpy: close }),
    })
    expect(sb.pdfUtils.extractText([0])).toBe('only')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('returns empty string for a 0-page PDF', () => {
    const close = vi.fn()
    const sb = load({
      com: makeCom({ pages: 0, pageText: () => 'x', closeSpy: close }),
    })
    expect(sb.pdfUtils.extractText([])).toBe('')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('records the error to $c on failure and still returns "" (reader never opened, not closed)', () => {
    const sb = load({
      com: makeCom({ readerThrows: 'corrupt pdf', closeSpy: vi.fn() }),
    })
    const text = sb.pdfUtils.extractText([9, 9])
    expect(text).toBe('')
    expect(sb.__maps.$c.get('extractTextFromPDFError')).toBe('corrupt pdf')
  })

  it('records the error to $c but still closes the reader when text extraction fails mid-way', () => {
    const close = vi.fn()
    const sb = load({
      com: makeCom({
        pages: 2,
        pageText: (i) => { if (i === 2) throw new Error('bad page'); return 'p' + i },
        closeSpy: close,
      }),
    })
    const text = sb.pdfUtils.extractText([1])
    // page 1 appended, then '\n\n' (i<pages), then page 2 throws -> caught
    expect(text).toBe('p1\n\n')
    expect(sb.__maps.$c.get('extractTextFromPDFError')).toBe('bad page')
    expect(close).toHaveBeenCalledTimes(1)
  })
})
