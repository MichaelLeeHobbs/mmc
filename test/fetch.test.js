import { describe, it, expect, vi } from 'vitest'
import { loadTemplate } from './mirthHarness.js'

/**
 * Build a full fake of the Apache HttpClient class chain that fetch.mirth.js
 * walks. The strategy: every Packages.org.apache.http.* class fetch destructures
 * is a constructor or object we control. The builder methods are chainable and
 * record what was set so tests can assert on dispatch and SSL branches.
 *
 * `httpClient.execute(req)` returns a fake response exposing the exact surface
 * fetch reads: getStatusLine().getStatusCode()/getReasonPhrase(),
 * getLastHeader('Location'), getAllHeaders() and getEntity().
 */
function makeChain(opts = {}) {
  const calls = {
    requests: [], // {ctor, url, headers:[], entity}
    builderUsed: null, // 'custom' (SSL) or 'create' (plain)
    redirect: null, // 'lax' | 'disabled'
    sslSocketFactorySet: false,
    loadKeyMaterial: 0,
    loadTrustMaterial: 0,
    keyStoreType: null,
    fileInputStreamPath: null,
    fileInputStreamClosed: false,
    keyStoreLoaded: false,
  }

  // Http* constructors return an object from `new`, which replaces `this`.
  // Use a shared factory so every request is recorded uniformly.
  function makeRequestUrl(ctor, url) {
    const req = {
      __ctor: ctor,
      __url: url,
      __headers: [],
      __entity: null,
      addHeader(k, v) { this.__headers.push([k, v]) },
      setEntity(e) { this.__entity = e },
    }
    calls.requests.push(req)
    return req
  }

  const response = opts.response || makeResponse()

  const httpClient = {
    execute: vi.fn(() => response),
  }

  // builder that both the SSL and plain branches funnel through
  function makeBuilder(kind) {
    calls.builderUsed = calls.builderUsed || kind
    const builder = {
      setSSLSocketFactory(_f) { calls.sslSocketFactorySet = true; return builder },
      setRedirectStrategy(_s) { calls.redirect = 'lax'; return builder },
      disableRedirectHandling() { calls.redirect = 'disabled'; return builder },
      build() { return httpClient },
    }
    return builder
  }

  const Packages = {
    org: {
      apache: {
        http: {
          entity: {
            StringEntity: function StringEntity(body) { this.__body = body },
          },
          ssl: {
            SSLContextBuilder: function SSLContextBuilder() {
              this.loadKeyMaterial = (ks, pw) => { calls.loadKeyMaterial++; this.__ks = ks; this.__keyPw = pw }
              this.loadTrustMaterial = (a, ts) => { calls.loadTrustMaterial++; this.__trust = ts }
              this.build = () => ({ __sslContext: true })
            },
            TrustStrategy: { __iface: 'TrustStrategy' },
          },
          conn: {
            ssl: {
              SSLConnectionSocketFactory: Object.assign(
                function SSLConnectionSocketFactory(ctx, verifier) { this.__ctx = ctx; this.__verifier = verifier },
                {
                  ALLOW_ALL_HOSTNAME_VERIFIER: 'ALLOW_ALL',
                  getDefaultHostnameVerifier: () => 'DEFAULT',
                }
              ),
            },
          },
          impl: {
            client: {
              HttpClients: { custom: () => makeBuilder('custom') },
              HttpClientBuilder: { create: () => makeBuilder('create') },
              LaxRedirectStrategy: function LaxRedirectStrategy() {},
            },
          },
          client: {
            methods: {
              HttpGet: function HttpGet(url) { return makeRequestUrl('GET', url) },
              HttpPut: function HttpPut(url) { return makeRequestUrl('PUT', url) },
              HttpPost: function HttpPost(url) { return makeRequestUrl('POST', url) },
              HttpDelete: function HttpDelete(url) { return makeRequestUrl('DELETE', url) },
            },
          },
          util: {
            EntityUtils: {
              toString: vi.fn((entity, _enc) => (entity && entity.__text != null ? entity.__text : '')),
              toByteArray: vi.fn((entity) => (entity && entity.__bytes != null ? entity.__bytes : [])),
            },
          },
        },
      },
    },
    java: {
      security: {
        KeyStore: {
          getInstance: (type) => {
            calls.keyStoreType = type
            return {
              load: (_stream, _pw) => { calls.keyStoreLoaded = true },
            }
          },
        },
      },
      io: {
        FileInputStream: function FileInputStream(path) {
          calls.fileInputStreamPath = path
          this.close = () => { calls.fileInputStreamClosed = true }
        },
      },
      lang: {
        String: function String_(s) {
          this.__s = s
          this.toCharArray = () => ('' + s).split('')
        },
      },
    },
  }

  return { Packages, calls, httpClient, response }
}

function makeResponse(o = {}) {
  const status = o.status != null ? o.status : 200
  const reason = o.reason != null ? o.reason : 'OK'
  const headers = o.headers || [['Content-Type', 'application/json']]
  const location = o.location // string | undefined
  const entity = o.entity !== undefined ? o.entity : { __text: '{"a":1}', __bytes: [1, 2, 3] }
  return {
    getStatusLine: () => ({
      getStatusCode: () => status,
      getReasonPhrase: () => reason,
    }),
    getLastHeader: (name) => (name === 'Location' && location ? { getName: () => 'Location', getValue: () => location } : null),
    getAllHeaders: () => headers.map(([k, v]) => ({ getName: () => k, getValue: () => v })),
    getEntity: () => entity,
  }
}

// JavaAdapter just returns the impl object (so .isTrusted etc are callable).
// The source uses `new JavaAdapter(iface, impl)`, and returning an object from a
// constructor replaces `this`, so a plain function works under `new` too.
function JavaAdapter(_iface, impl) { return impl }
// XML stand-in records the source string
function FakeXML(src) { this.__src = src }

function load(env) {
  const sandbox = loadTemplate('Globals/fetch.mirth.js', {
    JavaAdapter,
    XML: FakeXML,
    ...env,
  })
  return sandbox.fetch
}

describe('fetch (Apache HttpClient shim)', () => {
  it('dispatches GET via HttpGet and returns ok/status/statusText', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    const res = fetch('http://x/y')
    expect(calls.requests).toHaveLength(1)
    expect(calls.requests[0].__ctor).toBe('GET')
    expect(calls.requests[0].__url).toBe('http://x/y')
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)
    expect(res.statusText).toBe('OK')
    expect(res.type).toBe('default')
  })

  it('dispatches POST/PUT/DELETE based on method', () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const { Packages, calls } = makeChain()
      const fetch = load({ Packages })
      fetch('http://x', { method })
      expect(calls.requests[0].__ctor).toBe(method)
    }
  })

  it('lowercase method is upcased for dispatch', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { method: 'post' })
    expect(calls.requests[0].__ctor).toBe('POST')
  })

  it('non-2xx status => ok is false', () => {
    const { Packages } = makeChain({ response: makeResponse({ status: 404, reason: 'Not Found' }) })
    const fetch = load({ Packages })
    const res = fetch('http://x')
    expect(res.ok).toBe(false)
    expect(res.status).toBe(404)
    expect(res.statusText).toBe('Not Found')
  })

  it('json() parses the entity string', () => {
    const { Packages } = makeChain({ response: makeResponse({ entity: { __text: '{"a":1}' } }) })
    const fetch = load({ Packages })
    expect(fetch('http://x').json()).toEqual({ a: 1 })
  })

  it('text() returns the entity string', () => {
    const { Packages } = makeChain({ response: makeResponse({ entity: { __text: 'hello' } }) })
    const fetch = load({ Packages })
    expect(fetch('http://x').text()).toBe('hello')
  })

  it('byteArray() returns the entity bytes', () => {
    const { Packages } = makeChain({ response: makeResponse({ entity: { __bytes: [9, 8, 7] } }) })
    const fetch = load({ Packages })
    expect(fetch('http://x').byteArray()).toEqual([9, 8, 7])
  })

  it('xml() wraps the entity string in XML', () => {
    const { Packages } = makeChain({ response: makeResponse({ entity: { __text: '<r/>' } }) })
    const fetch = load({ Packages })
    const x = fetch('http://x').xml()
    expect(x).toBeInstanceOf(FakeXML)
    expect(x.__src).toBe('<r/>')
  })

  it('reading the body twice throws "Body already used!"', () => {
    const { Packages } = makeChain()
    const fetch = load({ Packages })
    const res = fetch('http://x')
    res.text()
    expect(() => res.json()).toThrow('Body already used!')
  })

  it('GET with a body throws before executing', () => {
    const { Packages, httpClient } = makeChain()
    const fetch = load({ Packages })
    expect(() => fetch('http://x', { body: 'data' })).toThrow('GET requests cannot have a body!')
    expect(httpClient.execute).not.toHaveBeenCalled()
  })

  it('POST sets a StringEntity from the body', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { method: 'POST', body: 'payload' })
    expect(calls.requests[0].__entity).toBeTruthy()
    expect(calls.requests[0].__entity.__body).toBe('payload')
  })

  it('headers as an object are applied to the request', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { headers: { 'Content-Type': 'text/plain', 'X-A': '1' } })
    expect(calls.requests[0].__headers).toEqual([
      ['Content-Type', 'text/plain'],
      ['X-A', '1'],
    ])
  })

  it('headers as [[k,v]] pairs are applied to the request', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { headers: [['A', '1'], ['B', '2']] })
    expect(calls.requests[0].__headers).toEqual([['A', '1'], ['B', '2']])
  })

  it('builds rawHeaders and a Map of headers from the response', () => {
    const { Packages } = makeChain({
      response: makeResponse({ headers: [['Content-Type', 'application/json'], ['X-Req', 'abc']] }),
    })
    const fetch = load({ Packages })
    const res = fetch('http://x')
    expect(res.rawHeaders).toEqual([
      ['Content-Type', 'application/json'],
      ['X-Req', 'abc'],
    ])
    // It's a Map from the vm sandbox realm, so `instanceof Map` (this realm)
    // is false; assert Map-ness structurally instead.
    expect(res.headers.constructor.name).toBe('Map')
    expect(typeof res.headers.get).toBe('function')
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.headers.get('X-Req')).toBe('abc')
  })

  it('url comes from the Location header when present', () => {
    const { Packages } = makeChain({ response: makeResponse({ location: 'http://final/' }) })
    const fetch = load({ Packages })
    const res = fetch('http://x')
    expect(res.url).toBe('http://final/')
    expect(res.redirected).toBe(true)
  })

  it('url is empty and redirected false with no Location header', () => {
    const { Packages } = makeChain({ response: makeResponse({ location: undefined }) })
    const fetch = load({ Packages })
    const res = fetch('http://x')
    expect(res.url).toBe('')
    expect(res.redirected).toBe(false)
  })

  it("redirect:'follow' sets the lax redirect strategy", () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { redirect: 'follow' })
    expect(calls.redirect).toBe('lax')
  })

  it('redirect default is follow (lax)', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x')
    expect(calls.redirect).toBe('lax')
  })

  it("redirect other than 'follow' disables redirect handling", () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { redirect: 'manual' })
    expect(calls.redirect).toBe('disabled')
  })

  it('plain request uses HttpClientBuilder.create (no custom SSL)', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x')
    expect(calls.builderUsed).toBe('create')
    expect(calls.sslSocketFactorySet).toBe(false)
  })

  it('ignoreSSLError takes the custom-SSL branch with trust-all + all-hostname verifier', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { ignoreSSLError: true })
    expect(calls.builderUsed).toBe('custom')
    expect(calls.sslSocketFactorySet).toBe(true)
    expect(calls.loadTrustMaterial).toBe(1)
    expect(calls.loadKeyMaterial).toBe(0)
  })

  it('clientCert takes the custom-SSL branch and loads a keystore via FileInputStream', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { clientCert: { path: '/certs/client.p12', password: 'changeit' } })
    expect(calls.builderUsed).toBe('custom')
    expect(calls.loadKeyMaterial).toBe(1)
    expect(calls.loadTrustMaterial).toBe(0)
    expect(calls.keyStoreType).toBe('PKCS12')
    expect(calls.fileInputStreamPath).toBe('/certs/client.p12')
    expect(calls.fileInputStreamClosed).toBe(true)
    expect(calls.keyStoreLoaded).toBe(true)
  })

  it('clientCert auto-detects JKS keystore type from .jks extension', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { clientCert: { path: '/certs/store.jks', password: 'pw' } })
    expect(calls.keyStoreType).toBe('JKS')
  })

  it('clientCert + ignoreSSLError loads both key and trust material', () => {
    const { Packages, calls } = makeChain()
    const fetch = load({ Packages })
    fetch('http://x', { ignoreSSLError: true, clientCert: { path: '/c.p12', password: 'x' } })
    expect(calls.loadKeyMaterial).toBe(1)
    expect(calls.loadTrustMaterial).toBe(1)
  })

  it('then(onFulfilled) runs synchronously and returns the handler result', () => {
    const { Packages } = makeChain()
    const fetch = load({ Packages })
    const out = fetch('http://x').then((r) => r.status)
    expect(out).toBe(200)
  })

  it('then() returns a catchable wrapper when the handler throws', () => {
    const { Packages } = makeChain()
    const fetch = load({ Packages })
    const chained = fetch('http://x').then(() => { throw new Error('boom') })
    const caught = chained.catch((e) => 'caught:' + e.message)
    expect(caught).toBe('caught:boom')
  })

  it('then() with a non-function returns the response itself', () => {
    const { Packages } = makeChain()
    const fetch = load({ Packages })
    const res = fetch('http://x')
    expect(res.then(null)).toBe(res)
  })
})
