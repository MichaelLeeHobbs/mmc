/**
 * fetch - a synchronous, partial implementation of the WHATWG Fetch API for
 * Rhino / Mirth Connect, built on the Apache HttpClient classes
 * (`Packages.org.apache.http.*`) bundled with Mirth.
 *
 * SYNCHRONOUS: Mirth's Rhino engine has no event loop or Promises, so `fetch(...)`
 * returns a {@link FetchResponse} directly (not a Promise), and the body readers
 * (`json()`, `text()`, `xml()`, `byteArray()`) return their value directly. A
 * `.then()` / `.catch()` shim is provided so promise-style chaining reads
 * naturally, but it runs synchronously too.
 *
 * "Partial" - it covers the common request/response surface and omits the parts
 * that don't apply to a blocking, server-side HTTP client:
 *   Supported:     url, method (GET / HEAD / POST / PUT / PATCH / DELETE /
 *                  OPTIONS), request headers, a UTF-8 string body, redirect
 *                  follow on/off, connect/socket/connection-request timeouts, an
 *                  HTTP proxy, response status/ok/statusText/headers, and body
 *                  readers json() / text() / xml() / byteArray().
 *   Not supported: Promises/async; a `Request` or full `Headers` class;
 *                  AbortController / `signal` (use `timeout` instead);
 *                  `credentials` / `mode` (CORS) /
 *                  `cache` / `referrer` / `integrity` / `keepalive`; non-string or
 *                  streaming bodies (FormData / URLSearchParams / Blob /
 *                  ArrayBuffer - stringify yourself and set Content-Type
 *                  yourself); response `blob()` / `formData()` / `arrayBuffer()` /
 *                  `clone()` / `body`; TRACE; and the 'manual' / 'error' redirect
 *                  modes. `response.type` is always 'default'.
 *
 * Errors: like standard fetch, an HTTP error status (4xx/5xx) does NOT throw -
 * inspect `response.ok` / `response.status`. Network, connection, and TLS
 * failures DO throw, so wrap calls in try/catch (or the repo's `tryCatch` /
 * `$retry`). The body can be read ONCE; a second body call throws
 * "Body already used!".
 *
 * Headers: `response.headers` is a JS `Map` when the Rhino build provides `Map`
 * (Mirth 4.0+, maybe 3.12); `response.rawHeaders` (an array of `[name, value]`
 * pairs) is always available as a fallback.
 *
 * Non-standard extensions for healthcare integrations: `ignoreSSLError` (trust any
 * server cert) and `clientCert` (mutual TLS). See
 * src/Examples/fetch.examples.js for many more usage examples.
 *
 * @example
 * // GET JSON, with an error check
 * const res = fetch('https://example.com/api/patients/123')
 * if (!res.ok) { throw new Error('HTTP ' + res.status + ' ' + res.statusText) }
 * const patient = res.json()
 *
 * @example
 * // GET XML / HL7 straight into the Mirth message (E4X)
 * msg = fetch('https://example.com/feed.xml').xml()
 *
 * @example
 * // POST JSON - note: `body` and `headers` are SEPARATE top-level options
 * const res = fetch('https://example.com/api/orders', {
 *   method: 'POST',
 *   headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token},
 *   body: JSON.stringify({mrn: '12345', test: 'CBC'}),
 * })
 * const created = res.json()
 *
 * @example
 * // Mutual TLS (mTLS)
 * const res = fetch('https://secure.example.com/api', {
 *   clientCert: {path: '/opt/mirth/certs/client.p12', password: 'changeit'},
 * })
 *
 * @example
 * // Timeouts - a single number (ms) applies to connect + socket + connectionRequest
 * const res = fetch('https://slow.example.com/api', {timeout: 5000})
 *
 * @example
 * // Per-phase timeouts (ms): fail fast on connect, allow a slow response body
 * const res = fetch('https://slow.example.com/api', {
 *   timeout: {connect: 2000, socket: 30000, connectionRequest: 1000},
 * })
 *
 * @example
 * // Route through an HTTP proxy
 * const res = fetch('https://partner.example.com/api', {
 *   proxy: {host: 'proxy.internal', port: 8080},
 * })
 *
 * @param {string} url The request URL.
 * @param {object} [options]
 * @param {('GET'|'HEAD'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS')} [options.method='GET'] HTTP method (case-insensitive). Only POST/PUT/PATCH may carry a body; supplying `body` for any other method throws. An unsupported method throws a clear error.
 * @param {object|[string,string][]} [options.headers={}] Request headers, as a `{name: value}` object or an array of `[name, value]` pairs. Nothing is inferred - set `Content-Type` yourself when sending a body.
 * @param {string} [options.body] Request body - a STRING only, sent UTF-8 encoded. `JSON.stringify(...)` objects yourself; build form bodies (`a=1&b=2`) yourself. Valid only for POST/PUT/PATCH.
 * @param {('follow'|string)} [options.redirect='follow'] 'follow' follows redirects (lax); any other value disables redirect handling.
 * @param {(number|{connect?:number,socket?:number,connectionRequest?:number})} [options.timeout] Non-standard. Request timeouts in milliseconds. A single number applies to all three Apache timeouts; an object sets them individually: `connect` (establish the TCP connection), `socket` (max gap waiting for response data), `connectionRequest` (wait for a pooled connection). 0 = infinite; negative = system default; omitted = no timeout (Apache default).
 * @param {object} [options.proxy] Non-standard. Route the request through an HTTP proxy.
 * @param {string} options.proxy.host Proxy hostname or IP.
 * @param {number} [options.proxy.port=-1] Proxy port. Defaults to -1 (the scheme's default port).
 * @param {boolean} [options.ignoreSSLError=false] Non-standard. Trust ANY server certificate and skip hostname verification. Use only for self-signed dev endpoints.
 * @param {object} [options.clientCert] Client certificate for mutual TLS (mTLS). The keystore must contain both the client certificate and its private key.
 * @param {string} options.clientCert.path Filesystem path (on the Mirth server) to the keystore file (PKCS12 .p12/.pfx or JKS .jks).
 * @param {string} [options.clientCert.password] Password used to unlock the keystore.
 * @param {string} [options.clientCert.keyPassword] Password for the private key, if different from the keystore password. Defaults to options.clientCert.password.
 * @param {string} [options.clientCert.type] Keystore type, 'PKCS12' or 'JKS'. Auto-detected from the file extension (.jks => JKS, otherwise PKCS12) when omitted.
 * @return {FetchResponse}
 */
function fetch(url, options) {
    const INTERNALS = Symbol('Response internals')

    /**
     * Fetch Response. If any, body function is called more than once will throw.
     * @typedef {Object} FetchResponse Stores a boolean value that declares whether the body has been used in a response yet.
     * @property {boolean} bodyUsed
     * @property {Map} headers The Headers Map associated with the response.
     * @property {[[string, string]]} rawHeaders The Headers array associated with the response.
     * @property {boolean} ok A boolean indicating whether the response was successful (status in the range 200–299) or not.
     * @property {boolean} redirected Indicates if the response is the result of a redirect (that is, its URL list has more than one entry).
     * @property {number} status The status code of the response. (This will be 200 for a success).
     * @property {string} statusText The status message corresponding to the status code. (e.g., OK for 200).
     * @property {string} type The type of the response (e.g., basic, cors).
     * @property {string} url The URL of the response.
     * @property {function} byteArray Reads the body once and returns it as a Java `byte[]` (for binary downloads). Synchronous; throws if the body was already read.
     * @property {function} json Reads the body once and returns it parsed as JSON (synchronous - not a Promise).
     * @property {function} text Reads the body once and returns it as a UTF-8 string.
     * @property {function} xml Reads the body once and returns it as a Mirth/Rhino E4X XML object.
     * @property {function} then Synchronous promise-style shim: `then(onFulfilled)` calls `onFulfilled(response)` immediately and returns its result (with a chained `.catch`).
     */
    function FetchResponse(body, options) {
        body = body || null
        options = options || {}
        options.status = options.status != null ? options.status : 200

        this[INTERNALS] = {
            type: 'default',
            url: options.url,
            status: options.status,
            statusText: options.statusText || '',
            headers: options.headers,
            rawHeaders: options.rawHeaders,
            counter: options.counter,
            highWaterMark: options.highWaterMark,
            body: body,
            bodyUsed: false
        }

        Object.defineProperty(this, 'bodyUsed', {get: () => this[INTERNALS].bodyUsed})
        Object.defineProperty(this, 'headers', {get: () => this[INTERNALS].headers})
        Object.defineProperty(this, 'rawHeaders', {get: () => this[INTERNALS].rawHeaders})
        Object.defineProperty(this, 'ok', {get: () => this[INTERNALS].status >= 200 && this[INTERNALS].status < 300})
        Object.defineProperty(this, 'redirected', {get: () => this[INTERNALS].url > ''})
        Object.defineProperty(this, 'status', {get: () => this[INTERNALS].status})
        Object.defineProperty(this, 'statusText', {get: () => this[INTERNALS].statusText})
        Object.defineProperty(this, 'type', {get: () => this[INTERNALS].type})
        Object.defineProperty(this, 'url', {get: () => this[INTERNALS].url || ''})
    }

    FetchResponse.prototype.byteArray = function () {
        if (this[INTERNALS].bodyUsed) {
            throw new Error('Body already used!')
        }
        this[INTERNALS].bodyUsed = true
        if (this[INTERNALS].body) {
            return Packages.org.apache.http.util.EntityUtils.toByteArray(this[INTERNALS].body)
        }
    }

    FetchResponse.prototype.json = function () {
        if (this[INTERNALS].bodyUsed) {
            throw new Error('Body already used!')
        }
        this[INTERNALS].bodyUsed = true
        if (this[INTERNALS].body) {
            return JSON.parse(Packages.org.apache.http.util.EntityUtils.toString(this[INTERNALS].body, 'UTF-8'))
        }
    }

    FetchResponse.prototype.text = function () {
        if (this[INTERNALS].bodyUsed) {
            throw new Error('Body already used!')
        }
        this[INTERNALS].bodyUsed = true
        if (this[INTERNALS].body) {
            return Packages.org.apache.http.util.EntityUtils.toString(this[INTERNALS].body, 'UTF-8')
        }
    }

    FetchResponse.prototype.xml = function () {
        if (this[INTERNALS].bodyUsed) {
            throw new Error('Body already used!')
        }
        this[INTERNALS].bodyUsed = true
        if (this[INTERNALS].body) {
            return new XML(Packages.org.apache.http.util.EntityUtils.toString(this[INTERNALS].body, 'UTF-8'))
        }
    }

    FetchResponse.prototype.then = function (onFulfilled) {
        if (typeof onFulfilled !== 'function') {
            return this
        }
        try {
            return onFulfilled(this)
        } catch (e) {
            return {
                catch: function (onRejected) {
                    if (typeof onRejected !== 'function') {
                        return e
                    }
                    return onRejected(e)
                }
            }
        }
    }

    options = options || {}
    options.headers = options.headers || []
    options.redirect = options.redirect || 'follow'
    if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
        options.headers = Object.keys(options.headers).map(key => [key, options.headers[key]])
    }

    const {StringEntity} = Packages.org.apache.http.entity
    const {SSLContextBuilder, TrustStrategy} = Packages.org.apache.http.ssl
    const {SSLConnectionSocketFactory} = Packages.org.apache.http.conn.ssl
    const {HttpClients, HttpClientBuilder, LaxRedirectStrategy} = Packages.org.apache.http.impl.client
    const {HttpGet, HttpHead, HttpPut, HttpPost, HttpPatch, HttpDelete, HttpOptions} = Packages.org.apache.http.client.methods

    var httpClient
    // A custom SSLContext is only required when presenting a client certificate (mTLS)
    // and/or when bypassing server certificate validation (ignoreSSLError).
    if (options.clientCert || options.ignoreSSLError) {
        const sslContextBuilder = new SSLContextBuilder()

        if (options.clientCert) {
            const {KeyStore} = Packages.java.security
            const {FileInputStream} = Packages.java.io

            const certPath = String(options.clientCert.path)
            // Auto-detect the keystore type from the file extension when not specified.
            const certType = options.clientCert.type || (/\.jks$/i.test(certPath) ? 'JKS' : 'PKCS12')
            // Rhino: convert JS strings to char[] for the KeyStore/SSL APIs.
            const storePassword = options.clientCert.password != null ? new Packages.java.lang.String(options.clientCert.password).toCharArray() : null
            const keyPasswordRaw = options.clientCert.keyPassword != null ? options.clientCert.keyPassword : options.clientCert.password
            const keyPassword = keyPasswordRaw != null ? new Packages.java.lang.String(keyPasswordRaw).toCharArray() : null

            const keyStore = KeyStore.getInstance(certType)
            const certStream = new FileInputStream(certPath)
            try {
                keyStore.load(certStream, storePassword)
            } finally {
                certStream.close()
            }
            sslContextBuilder.loadKeyMaterial(keyStore, keyPassword)
        }

        if (options.ignoreSSLError) {
            const trustStrategy = new JavaAdapter(TrustStrategy, {isTrusted: () => true})
            sslContextBuilder.loadTrustMaterial(null, trustStrategy)
        }

        // Skip hostname verification only when SSL errors are explicitly ignored;
        // mTLS on its own must still verify the server's hostname.
        const hostnameVerifier = options.ignoreSSLError
            ? SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER
            : SSLConnectionSocketFactory.getDefaultHostnameVerifier()
        const sslConnectionSocketFactory = new SSLConnectionSocketFactory(sslContextBuilder.build(), hostnameVerifier)
        httpClient = HttpClients.custom()
            .setSSLSocketFactory(sslConnectionSocketFactory)
    } else {
        httpClient = HttpClientBuilder.create()
    }

    if (options.redirect === 'follow') {
        httpClient = httpClient.setRedirectStrategy(new LaxRedirectStrategy())
    } else {
        httpClient = httpClient.disableRedirectHandling()
    }

    httpClient = httpClient.build()

    const method = (options.method || 'GET').toUpperCase()

    // Map each supported method to its Apache request class. Only POST/PUT/PATCH
    // can carry a body (they extend HttpEntityEnclosingRequestBase); supplying a
    // body for any other method throws a clear error below.
    const methodConstructors = {
        GET: HttpGet, HEAD: HttpHead, POST: HttpPost,
        PUT: HttpPut, PATCH: HttpPatch, DELETE: HttpDelete, OPTIONS: HttpOptions
    }
    const MethodConstructor = methodConstructors[method]
    if (!MethodConstructor) {
        throw new Error('Unsupported HTTP method: ' + method + '. Supported: ' + Object.keys(methodConstructors).join(', ') + '.')
    }
    const httpConfig = new MethodConstructor(url)

    options.headers.forEach(header => httpConfig.addHeader(header[0], header[1]))

    const bodyMethods = {POST: true, PUT: true, PATCH: true}
    if (options.body && !bodyMethods[method]) {
        throw new Error(method + ' requests cannot have a body!')
    }
    if (options.body) {
        // Encode as UTF-8: Apache's single-arg StringEntity defaults to ISO-8859-1,
        // which corrupts non-Latin-1 characters. Mirrors the UTF-8 used when reading
        // the response body.
        httpConfig.setEntity(new StringEntity(options.body, 'UTF-8'))
    }

    // Per-request config (non-standard): timeouts and/or an upstream HTTP proxy.
    // `options.timeout` is a single number of milliseconds applied to all three
    // Apache timeouts, or an object {connect, socket, connectionRequest}:
    //   connect           -> setConnectTimeout           (establish the TCP connection)
    //   socket            -> setSocketTimeout            (max gap waiting for response data; SO_TIMEOUT)
    //   connectionRequest -> setConnectionRequestTimeout (wait for a connection from the pool)
    // 0 means infinite; a negative value means "use the system default".
    // `options.proxy` is {host, port} for an HTTP proxy (port defaults to -1 = scheme default).
    // When neither is set the Apache defaults apply, so prior behavior is unchanged.
    if ((options.timeout != null || options.proxy) && httpConfig) {
        const {RequestConfig} = Packages.org.apache.http.client.config
        const requestConfig = RequestConfig.custom()
        if (options.timeout != null) {
            const perPhase = typeof options.timeout === 'object'
            const connect = perPhase ? options.timeout.connect : options.timeout
            const socket = perPhase ? options.timeout.socket : options.timeout
            const connectionRequest = perPhase ? options.timeout.connectionRequest : options.timeout
            if (connect != null) requestConfig.setConnectTimeout(connect)
            if (socket != null) requestConfig.setSocketTimeout(socket)
            if (connectionRequest != null) requestConfig.setConnectionRequestTimeout(connectionRequest)
        }
        if (options.proxy) {
            const {HttpHost} = Packages.org.apache.http
            const proxyPort = options.proxy.port != null ? options.proxy.port : -1
            requestConfig.setProxy(new HttpHost(options.proxy.host, proxyPort))
        }
        httpConfig.setConfig(requestConfig.build())
    }

    const rawResponse = httpClient.execute(httpConfig)
    const locationHeader = rawResponse.getLastHeader('Location')
    const response = {
        // request: {url: url, options: options},
        status: parseInt(rawResponse.getStatusLine().getStatusCode()),
        statusText: String(rawResponse.getStatusLine().getReasonPhrase()),
        url: String(locationHeader ? locationHeader.getValue() : ''),
        type: 'default', // "basic", "cors", "default", "error", "opaque", or "opaqueredirect"
        rawHeaders: [],
    }
    if (typeof Map === 'undefined') {
        // logger.warn('Fetch could not find type Map! Only rawHeaders will be available!')
    } else {
        response.headers = new Map()
    }

    response.ok = response.status > 199 && response.status < 300
    response.redirected = response.url > ''

    rawResponse.getAllHeaders().forEach(header => {
        const key = String(header.getName())
        const value = String(header.getValue())
        if (response.headers) {
            response.headers.set(key, value)
        }
        response.rawHeaders.push([key, value])
    })
    // return response
    return new FetchResponse(rawResponse.getEntity(), response)
}

/* exported fetch */
