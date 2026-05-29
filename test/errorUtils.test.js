import { describe, it, expect } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

// Minimal faithful java.io mock: StringWriter accumulates, PrintWriter writes to it.
function makeJavaIoMock() {
  class StringWriter {
    constructor() { this.buf = '' }
    toString() { return this.buf }
  }
  class PrintWriter {
    constructor(sw) { this.sw = sw }
    write(s) { this.sw.buf += s }
    flush() {}
  }
  return { io: { StringWriter, PrintWriter } }
}

function load(env) {
  const sandbox = loadTemplate('Globals/errorUtils.js', env)
  return sandbox.errorUtils
}

// Some tests need sandbox-realm Errors because the source uses `instanceof Error`,
// which is realm-sensitive under the vm context.
function loadSandbox(env) {
  return loadTemplate('Globals/errorUtils.js', env)
}

describe('errorUtils.toString', () => {
  it('returns a sentinel for null/undefined', () => {
    const errorUtils = load()
    expect(errorUtils.toString(null)).toBe('null or undefined error object')
    expect(errorUtils.toString(undefined)).toBe('null or undefined error object')
  })

  it('formats a plain Error with name, message, and stack', () => {
    const errorUtils = load()
    const e = new Error('boom')
    const out = errorUtils.toString(e)
    expect(out).toContain('Error: ')
    expect(out).toContain('boom')
    // stack is appended (and short-circuits before any java branch)
    expect(out).toContain(String(e.stack))
  })

  it('falls back to message when there is no stack/java info', () => {
    // The message is appended once up front (message + "\n"), then again by the
    // later `if (e.message)` fallback branch, so it appears twice.
    const errorUtils = load()
    const out = errorUtils.toString({ message: 'just a message' })
    expect(out).toBe('just a message\njust a message')
  })

  it('returns the default Object.toString for a plain object (toString branch wins over JSON)', () => {
    // A normal object inherits toString, so `typeof e.toString === "function"`
    // is true and that branch returns "[object Object]" BEFORE the JSON branch.
    const errorUtils = load()
    expect(errorUtils.toString({ foo: 'bar' })).toBe('[object Object]')
  })

  it('falls through to JSON.stringify only when there is no usable toString', () => {
    // A null-prototype object has no inherited toString, so the JSON branch runs.
    const errorUtils = load()
    const bag = Object.create(null)
    bag.foo = 'bar'
    expect(errorUtils.toString(bag)).toBe('{"foo":"bar"}')
  })

  it('handles a Java-exception-style error via injected java.io mock', () => {
    const errorUtils = load({ java: makeJavaIoMock() })
    const javaEx = {
      getMessage: () => 'NullPointerException happened',
      printStackTrace: (pw) => {
        pw.write('at com.example.Foo(Foo.java:1)\n')
        pw.write('at com.example.Bar(Bar.java:2)\n')
      },
    }
    // No `stack` so the javaException branch is reached.
    const e = { name: 'JavaError', javaException: javaEx }
    const out = errorUtils.toString(e)
    expect(out).toContain('JavaError: ')
    expect(out).toContain('NullPointerException happened')
    expect(out).toContain('at com.example.Foo(Foo.java:1)')
    expect(out).toContain('at com.example.Bar(Bar.java:2)')
  })

  it('handles a direct Java throwable (printStackTrace on e) via injected mock', () => {
    const errorUtils = load({ java: makeJavaIoMock() })
    const e = {
      getMessage: () => 'direct java msg',
      printStackTrace: (pw) => pw.write('stack-line\n'),
    }
    const out = errorUtils.toString(e)
    expect(out).toContain('direct java msg')
    expect(out).toContain('stack-line')
  })
})

describe('errorUtils.combine', () => {
  it('returns null when given no valid (non-null) errors', () => {
    const errorUtils = load()
    expect(errorUtils.combine()).toBeNull()
    expect(errorUtils.combine(null, undefined)).toBeNull()
  })

  it('returns the single error unchanged when only one valid error is given', () => {
    const errorUtils = load()
    const e = new Error('only')
    expect(errorUtils.combine(null, e)).toBe(e)
  })

  it('merges string and non-error values into one numbered, newline-joined message', () => {
    // Strings/numbers are realm-independent: string -> used directly, other ->
    // String(). The returned error is a sandbox-realm Error (its message holds).
    const errorUtils = load()
    const combined = errorUtils.combine('first', 'second', 42)
    expect(combined.message).toBe('Error 1: first\nError 2: second\nError 3: 42')
  })

  it('reads a same-realm Error message via the `instanceof Error` branch', () => {
    // combine() returns a sandbox-realm Error; feeding it back in means the
    // source's `instanceof Error` holds and `.message` is read directly (no
    // extra "Error: " prefix that String() would add).
    const errorUtils = loadSandbox().errorUtils
    const seed = errorUtils.combine('a', 'b') // sandbox-realm Error
    const combined = errorUtils.combine(seed, 'tail')
    expect(combined.message).toBe('Error 1: Error 1: a\nError 2: b\nError 2: tail')
  })

  it('skips null/undefined entries while combining', () => {
    const errorUtils = load()
    const combined = errorUtils.combine(null, 'a', undefined, 'b')
    expect(combined.message).toBe('Error 1: a\nError 2: b')
  })

  it('stringifies non-same-realm Errors via String() (documented cross-realm behavior)', () => {
    // A Node-realm Error is NOT `instanceof` the sandbox Error, so it falls to
    // the String(currentError) branch => "Error: <message>".
    const errorUtils = load()
    const combined = errorUtils.combine(new Error('x'), new Error('y'))
    expect(combined.message).toBe('Error 1: Error: x\nError 2: Error: y')
  })
})
