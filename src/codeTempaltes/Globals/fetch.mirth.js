function fetch(url, options) {
  const fetchLibs = {
    HttpClientBuilder: Packages.org.apache.http.impl.client.HttpClientBuilder,
    HttpGet: Packages.org.apache.http.client.methods.HttpGet,
    HttpPut: Packages.org.apache.http.client.methods.HttpPut,
    HttpPost: Packages.org.apache.http.client.methods.HttpPost,
    HttpDelete: Packages.org.apache.http.client.methods.HttpDelete,
    HttpOptions: Packages.org.apache.http.client.methods.HttpOptions,
    HttpPatch: Packages.org.apache.http.client.methods.HttpPatch,
    HttpTrace: Packages.org.apache.http.client.methods.HttpTrace,
    EntityUtils: Packages.org.apache.http.util.EntityUtils,
    StringEntity: Packages.org.apache.http.entity.StringEntity,
  }

  options = options || {}
  options.headers = options.headers || []
  const method = options.method || 'GET'
  const client = fetchLibs.HttpClientBuilder.create().build()
  var httpConfig = undefined
  if (method === 'GET') {
    httpConfig = new fetchLibs.HttpGet(url)
  }
  if (method === 'PUT') {
    httpConfig = new fetchLibs.HttpPut(url)
  }
  if (method === 'POST') {
    httpConfig = new fetchLibs.HttpPost(url)
  }
  if (method === 'DELETE') {
    httpConfig = new fetchLibs.HttpDelete(url)
  }

  options.headers.forEach(header => httpConfig.addHeader(header[0], header[1]))

  if (httpConfig && options.body) {
    httpConfig.setEntity(new fetchLibs.StringEntity(options.body))
  }

  var response = client.execute(httpConfig)
  var statusCode = response.getStatusLine().getStatusCode()
  var entity = response.getEntity()
  return fetchLibs.EntityUtils.toString(entity, 'UTF-8')
}

/* global Packages */
