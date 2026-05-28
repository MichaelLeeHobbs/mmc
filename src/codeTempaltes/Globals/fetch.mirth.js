/**
 * A Rhino/Mirth Connect partial implementation of Javascript Fetch. If the Javascript Map Type is not available then only raw headers will be available.
 * The Map type can be polyfilled at your own risk.
 *
 * @example
 * // Get XML example
 * const response = fetch('https://www.w3schools.com/xml/note.xml')
 * const props = {
 *  // this only works on the newest version of mirth 4.0 and maybe 3.12
 *    headers: Array.from(response.headers.entries()),
 *    ok: response.ok,
 *    redirected: response.redirected,
 *    status: response.status,
 *    statusText: response.statusText,
 *    type: response.type,
 *    url: response.url,
 * }
 * msg = response.xml()
 *
 * // Get JSON Example
 * const response = fetch('https://filesamples.com/samples/code/json/sample2.json')
 * msg = response.json()
 *
 * // Get Text Example
 * const response = fetch('https://file-examples.com/wp-content/uploads/2017/02/file_example_CSV_5000.csv')
 * msg = response.text()
 *
 * // Post JSON Example
 * const response = fetch('https://postman-echo.com/post',
 *  {method: 'POST', headers: {'Content-Type': 'application/json', body: JSON.stringify({message: 'test!'})}}
 * )
 * msg = response.json()
 *
 * // Mutual TLS (mTLS) Example
 * const response = fetch('https://secure.example.com/api',
 *  {clientCert: {path: '/opt/mirth/certs/client.p12', password: 'changeit'}}
 * )
 * msg = response.json()
 *
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.method='GET'] GET/POST/PUT/DELETE
 * @param {object} [options.headers={}] Dictionary of request headers.
 * @param {string} [options.body] Request body
 * @param {string} [options.redirect='follow'] If not follow redirects will be ignored
 * @param {boolean} [options.ignoreSSLError=false] If true will ignore all SSL errors. Useful for connecting to self-signed certs.
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
     * @property {function} byteArray Returns a Java ByteArray of the body.
     * @property {function} json Returns the body parsed as JSON.
     * @property {function} text Returns the body parsed as text.
     * @property {function} xml Returns the body parsed as Mirth/Rhino XML.
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
    const {HttpGet, HttpPut, HttpPost, HttpDelete, /* HttpOptions, HttpPatch, HttpTrace */} = Packages.org.apache.http.client.methods

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

    const method = options.method || 'GET'

    var httpConfig = undefined
    if (method.toUpperCase() === 'GET') {
        httpConfig = new HttpGet(url)
    }
    if (method.toUpperCase() === 'PUT') {
        httpConfig = new HttpPut(url)
    }
    if (method.toUpperCase() === 'POST') {
        httpConfig = new HttpPost(url)
    }
    if (method.toUpperCase() === 'DELETE') {
        httpConfig = new HttpDelete(url)
    }

    options.headers.forEach(header => httpConfig.addHeader(header[0], header[1]))

    if (method.toUpperCase() === 'GET' && options.body) {
        throw new Error('GET requests cannot have a body!')
    }

    if (httpConfig && options.body) {
        httpConfig.setEntity(new StringEntity(options.body))
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
