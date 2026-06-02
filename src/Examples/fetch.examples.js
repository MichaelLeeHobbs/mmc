/**
 * Usage examples for the `fetch` code template (src/codeTempaltes/Globals/fetch.mirth.js).
 *
 * `fetch` is a SYNCHRONOUS, partial Fetch implementation for Mirth/Rhino: it returns the
 * response directly (no Promises), an HTTP error status does NOT throw (check `response.ok`),
 * the body can be read once, and you set headers / stringify bodies yourself.
 *
 * These are copy-paste snippets for channel scripts (transformers, JavaScript readers/writers).
 * They reference Mirth globals (`fetch`, `msg`, `logger`, `$c`, …) and a few sibling helpers
 * (`stringUtils.btoa`, `tryCatch`, `$retry`, `addAttachment`) from this repo.
 *
 * @module mmc/Examples/fetch
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @license MIT
 */

/* eslint-disable no-unused-vars */
/* global fetch, msg, logger, $c, stringUtils, tryCatch, $retry, addAttachment */

// 1. GET JSON, with an error check (HTTP 4xx/5xx do not throw).
function getJson() {
  const res = fetch('https://example.com/api/patients/123')
  if (!res.ok) {
    throw new Error('GET failed: HTTP ' + res.status + ' ' + res.statusText)
  }
  return res.json() // parsed object, returned synchronously
}

// 2. GET XML/HL7 straight into the Mirth message as E4X.
function getXmlIntoMsg() {
  msg = fetch('https://example.com/adt/feed.xml').xml()
}

// 3. GET plain text (CSV, NDJSON, a raw HL7 string, …).
function getText() {
  const csv = fetch('https://example.com/exports/patients.csv').text()
  return csv.split('\n')
}

// 4. Download binary content as a Java byte[] and attach it to the message.
function downloadPdfAsAttachment() {
  const res = fetch('https://example.com/reports/42.pdf')
  if (!res.ok) {
    throw new Error('PDF download failed: HTTP ' + res.status)
  }
  const bytes = res.byteArray() // java byte[]
  return addAttachment(bytes, 'application/pdf', false) // base64Encode = false
}

// 5. POST JSON. NOTE: `body` and `headers` are SEPARATE top-level options.
function postJson() {
  const res = fetch('https://example.com/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mrn: '12345', test: 'CBC' }),
  })
  return res.json()
}

// 6. POST application/x-www-form-urlencoded (build the body yourself).
function postForm() {
  const form = ['grant_type=client_credentials', 'scope=orders.write'].join('&')
  const res = fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  return res.json().access_token
}

// 7a. Bearer token auth.
function withBearerToken(token) {
  return fetch('https://example.com/api/secure', {
    headers: { Authorization: 'Bearer ' + token },
  }).json()
}

// 7b. HTTP Basic auth (Base64 via the repo's stringUtils helper).
function withBasicAuth(user, password) {
  const credentials = stringUtils.btoa(user + ':' + password)
  return fetch('https://example.com/api/secure', {
    headers: { Authorization: 'Basic ' + credentials },
  }).json()
}

// 8. Query parameters - encode values yourself and assemble the URL.
function withQueryParams(mrn) {
  const qs = ['mrn=' + encodeURIComponent(mrn), 'active=true'].join('&')
  return fetch('https://example.com/api/patients?' + qs).json()
}

// 9. PUT to update a resource.
function putUpdate(id, patch) {
  const res = fetch('https://example.com/api/patients/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return res.ok
}

// 10. DELETE a resource.
function deleteResource(id) {
  const res = fetch('https://example.com/api/orders/' + encodeURIComponent(id), {
    method: 'DELETE',
  })
  return res.status === 204 || res.ok
}

// 11. Distinguish HTTP error statuses from success without throwing.
function handleErrorStatus() {
  const res = fetch('https://example.com/api/maybe-missing')
  if (res.status === 404) {
    return null // not found - a normal outcome, not an exception
  }
  if (!res.ok) {
    logger.warn('Unexpected status ' + res.status + ': ' + res.text())
    return null
  }
  return res.json()
}

// 12. Network / connection / TLS failures DO throw - guard with try/catch.
function handleNetworkError() {
  try {
    return fetch('https://down.example.com/api').json()
  } catch (e) {
    logger.error('fetch failed: ' + e)
    return null
  }
}

// 13. Read response headers. Prefer the Map when available; fall back to rawHeaders.
function readResponseHeaders() {
  const res = fetch('https://example.com/api/thing')
  let contentType
  if (res.headers) {
    contentType = res.headers.get('Content-Type') // Map, Mirth 4.0+
  } else {
    const hit = res.rawHeaders.filter((h) => String(h[0]).toLowerCase() === 'content-type')[0]
    contentType = hit && hit[1]
  }
  return contentType
}

// 14. Self-signed / dev endpoint - bypass certificate validation (non-standard).
function ignoreSelfSignedCert() {
  return fetch('https://self-signed.internal/api', { ignoreSSLError: true }).json()
}

// 15. Mutual TLS (mTLS) - present a client certificate from a keystore on the Mirth server.
function mutualTls() {
  return fetch('https://secure.partner.example.com/api', {
    clientCert: {
      path: '/opt/mirth/certs/client.p12',
      password: 'changeit',
      // type: 'PKCS12',   // auto-detected from the extension; 'JKS' for .jks keystores
      // keyPassword: '…', // only if the private key password differs from the store password
    },
  }).json()
}

// 16. Do not follow redirects (any redirect value other than 'follow' disables handling).
function noFollowRedirects() {
  const res = fetch('https://example.com/maybe-redirects', { redirect: 'manual' })
  return res.status // e.g. 301/302 instead of the followed 200
}

// 17. Resilient call: retry with backoff (sibling $retry), then a safe [data, error] tuple.
function resilientGet() {
  // Retry transient failures up to 3 times with exponential-ish backoff.
  const fetchOnce = function () {
    const res = fetch('https://flaky.example.com/api')
    if (!res.ok) {
      throw new Error('HTTP ' + res.status)
    }
    return res.json()
  }
  // Array destructuring works in Mirth's Rhino (verified on 1.7.13).
  const [data, error] = tryCatch(function () {
    return $retry(fetchOnce, { retries: 3, backoff: 1000, throwOnFail: true })
  })
  if (error) {
    logger.error('giving up after retries: ' + error)
    return null
  }
  return data
}

// 18. Timeouts (non-standard, milliseconds). Pass a single number to bound connect,
//     socket, and connection-request together, or an object to tune each phase.
function withTimeouts() {
  // Simple: 5s ceiling on every phase.
  const quick = fetch('https://slow.example.com/api', { timeout: 5000 }).json()

  // Per-phase: fail fast if we can't connect, but tolerate a slow response body.
  const tuned = fetch('https://slow.example.com/report', {
    timeout: { connect: 2000, socket: 30000, connectionRequest: 1000 },
  })

  // A connect/socket timeout surfaces as a thrown network error - guard it.
  try {
    return fetch('https://maybe-hung.example.com/api', { timeout: 3000 }).json()
  } catch (e) {
    logger.error('request timed out or failed: ' + e)
    return null
  }
}

// 19. PATCH a partial update (only POST/PUT/PATCH may carry a body).
function patchPartial(id, changes) {
  const res = fetch('https://example.com/api/patients/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/merge-patch+json' },
    body: JSON.stringify(changes),
  })
  return res.ok
}

// 20. Route through an HTTP proxy (non-standard). port defaults to -1 (scheme default).
function throughProxy() {
  return fetch('https://partner.example.com/api', {
    proxy: { host: 'proxy.internal', port: 8080 },
  }).json()
}

if (typeof module === 'object') {
  module.exports = {
    getJson,
    getXmlIntoMsg,
    getText,
    downloadPdfAsAttachment,
    postJson,
    postForm,
    withBearerToken,
    withBasicAuth,
    withQueryParams,
    putUpdate,
    deleteResource,
    handleErrorStatus,
    handleNetworkError,
    readResponseHeaders,
    ignoreSelfSignedCert,
    mutualTls,
    noFollowRedirects,
    resilientGet,
    withTimeouts,
    patchPartial,
    throughProxy,
  }
}
