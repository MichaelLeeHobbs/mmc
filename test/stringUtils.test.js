import { describe, it, expect, test } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// stringUtils.js sets module.exports = stringUtils. The pure functions need no Java.
// For atob/btoa we inject a Node-backed Packages.java.util.Base64 / java.lang.String mock.
function makeJavaMock() {
  // Minimal mock of the Rhino Java interop surface used by atob/btoa.
  const JavaString = function (arg) {
    // new Packages.java.lang.String(bytes) or (str)
    if (arg && arg.__bytes) {
      this._str = Buffer.from(arg.__bytes).toString('latin1')
    } else {
      this._str = String(arg)
    }
  }
  JavaString.prototype.getBytes = function () {
    return { __bytes: Buffer.from(this._str, 'latin1') }
  }
  JavaString.prototype.toString = function () {
    return this._str
  }
  // Packages.java.lang.String(str) is also called without `new` in atob.
  const StringFactory = function (s) {
    return new JavaString(s)
  }
  StringFactory.prototype = JavaString.prototype

  const Base64 = {
    getDecoder: () => ({
      decode: (jstr) => ({ __bytes: Buffer.from(String(jstr), 'utf8').toString ? Buffer.from(Buffer.from(jstr._str || String(jstr), 'latin1').toString('latin1'), 'base64') : null }),
    }),
    getEncoder: () => ({
      encode: (bytesObj) => ({ __bytes: Buffer.from(Buffer.from(bytesObj.__bytes).toString('latin1'), 'latin1').toString('base64') === undefined ? null : Buffer.from(bytesObj.__bytes).toString('base64') }),
    }),
  }

  return {
    Packages: { java: { lang: { String: StringFactory }, util: { Base64 } } },
  }
}

const { stringUtils } = loadTemplate('Globals/stringUtils.js')

describe('stringUtils.wrapText', () => {
  it('wraps on the first space at or before length', () => {
    expect(stringUtils.wrapText('the quick brown fox', 10)).toEqual(['the quick', 'brown fox'])
  })

  it('trims each element by default', () => {
    const out = stringUtils.wrapText('aaa bbb ccc', 4)
    out.forEach((s) => expect(s).toBe(s.trim()))
  })

  it('preserves trailing whitespace when noTrim is true', () => {
    const out = stringUtils.wrapText('aaa bbb', 4, true)
    expect(out.join('')).toContain('aaa ')
  })
})

describe('stringUtils.wrapArray', () => {
  it('splits each element and flattens', () => {
    expect(stringUtils.wrapArray(['the quick brown', 'fox'], 5)).toEqual(['the', 'quick', 'brown', 'fox'])
  })
})

describe('stringUtils.limitElementLength', () => {
  it('leaves short lines untouched', () => {
    expect(stringUtils.limitElementLength(['short', 'line'], 20)).toEqual(['short', 'line'])
  })

  it('wraps long lines beyond the limit', () => {
    const out = stringUtils.limitElementLength(['the quick brown fox jumps'], 10)
    out.forEach((s) => expect(s.length).toBeLessThanOrEqual(10))
    expect(out.length).toBeGreaterThan(1)
  })
})

describe('stringUtils.splitReportText', () => {
  it('splits body and impression when an IMPRESSION header exists', () => {
    const report = 'Findings here\nIMPRESSION: all clear'
    const { body, impression } = stringUtils.splitReportText(report)
    expect(body).toContain('Findings here')
    expect(impression).toContain('IMPRESSION:')
    expect(impression).toContain('all clear')
  })

  it('returns the whole report as impression when no IMPRESSION header', () => {
    const report = 'just findings'
    const { body, impression } = stringUtils.splitReportText(report)
    expect(body).toBe('')
    expect(impression).toContain('just findings')
  })
})

describe('stringUtils.splitFindingsAndImpression', () => {
  it('separates impression from findings', () => {
    const text = 'Finding one\nFinding two\nIMPRESSION: done'
    const [impression, findings] = stringUtils.splitFindingsAndImpression(text)
    expect(impression).toContain('IMPRESSION: done')
    expect(findings).toContain('Finding one')
    expect(findings).toContain('Finding two')
  })

  it('returns [trimmed text, ""] when no impression present', () => {
    const [impression, findings] = stringUtils.splitFindingsAndImpression('  only findings  ')
    expect(impression).toBe('only findings')
    expect(findings).toBe('')
  })
})

describe('stringUtils.filterLinesContaining', () => {
  it('removes lines containing any filter string', () => {
    const text = 'keep this\nremove SECRET\nkeep that'
    expect(stringUtils.filterLinesContaining(text, ['SECRET'])).toBe('keep this\nkeep that')
  })

  it('returns trimmed text when no filters provided', () => {
    expect(stringUtils.filterLinesContaining('  hello  ', [])).toBe('hello')
  })
})

describe('stringUtils.encodeLineBreak', () => {
  it('encodes line breaks with the default token', () => {
    expect(stringUtils.encodeLineBreak('a\r\nb\nc')).toBe('a\\.br\\b\\.br\\c')
  })

  it('uses a custom encoding token', () => {
    expect(stringUtils.encodeLineBreak('a\nb', '<BR>')).toBe('a<BR>b')
  })
})

describe('stringUtils.atob / btoa (with injected Java Base64 mock)', () => {
  // Re-load with the Java mock injected into the sandbox env.
  const env = makeJavaMock()
  const { stringUtils: su } = loadTemplate('Globals/stringUtils.js', env)

  it('btoa encodes and atob decodes ASCII round-trip', () => {
    const encoded = su.btoa('Hello')
    expect(encoded).toBe(Buffer.from('Hello', 'latin1').toString('base64'))
    expect(su.atob(encoded)).toBe('Hello')
  })
})
