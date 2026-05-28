<div id="top"></div>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Apache 2.0 License][license-shield]][license-url]



<!-- PROJECT TITLE -->
<br />
<div align="center">
<h1 align="center">Mike's Mirth Code</h1>

  <p align="center">
    Battle-tested JavaScript code templates, helpers, and channels for
    <a href="https://www.nextgen.com/solutions/interoperability/mirth-integration-engine">Mirth Connect</a> (NextGen Connect).
    <br />
    Drop-in utilities pulled straight from production HL7/healthcare integrations.
    <br />
    <br />
    <a href="https://github.com/MichaelLeeHobbs/mmc/issues">Report Bug</a>
    ·
    <a href="https://github.com/MichaelLeeHobbs/mmc/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#whats-inside">What's Inside</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#using-a-code-template">Using a Code Template</a></li>
        <li><a href="#using-a-global-script">Using a Global Script</a></li>
        <li><a href="#importing-a-channel">Importing a Channel</a></li>
        <li><a href="#a-local-mirth-for-testing">A Local Mirth for Testing</a></li>
      </ul>
    </li>
    <li><a href="#the-mirth-helpers">The Mirth $ Helpers</a></li>
    <li><a href="#usage-examples">Usage Examples</a></li>
    <li><a href="#compatibility-notes">Compatibility Notes</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[Mirth Connect](https://www.nextgen.com/solutions/interoperability/mirth-integration-engine) is a healthcare
integration engine whose channels are scripted in JavaScript, executed on the JVM by the
[Mozilla Rhino](https://github.com/mozilla/rhino) engine. That gives you a familiar JavaScript surface with full
access to the underlying Java standard library and Mirth's own Java APIs — a powerful combination, but one with sharp
edges (limited/older ECMAScript support, no `npm`, and a lot of `Packages.*` boilerplate).

**Mike's Mirth Code (`mmc`)** is a curated set of reusable building blocks that smooth over those edges: a `fetch()`
polyfill, a database-connection base class, persistent maps, an HL7 message parser, batch handlers, time-zone
conversion, and a grab-bag of small utilities — all written to be pasted into Mirth as **Code Templates** or
**Global Scripts**. Everything here has run in real production deployments.

Most files are self-contained and authored so that their leading JSDoc block doubles as the Mirth code-template
description. Read the source — each function documents its parameters, return value, and usually an `@example`.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- WHAT'S INSIDE -->
## What's Inside

### 🌐 Globals — [`src/codeTempaltes/Globals`](src/codeTempaltes/Globals)

General-purpose helpers meant to live in your Code Template Library (or, where noted, a Global Script).

| Template | What it does |
| --- | --- |
| [`fetch.mirth.js`](src/codeTempaltes/Globals/fetch.mirth.js) | A partial `fetch()` implementation over Apache HttpClient. Supports GET/POST/PUT/DELETE, headers, redirects, self-signed certs (`ignoreSSLError`), **mutual TLS (`clientCert`)**, and `.json()` / `.text()` / `.xml()` / `.byteArray()` body readers. |
| [`$t.js`](src/codeTempaltes/Globals/$t.js) | Inline try/catch — `$t(() => a.b.c)` stands in for optional chaining (`a?.b?.c`), which Rhino lacks. |
| [`$retry.js`](src/codeTempaltes/Globals/$retry.js) | Retries a callback with configurable attempts and backoff; optionally rethrows the last error. |
| [`$sleep.js`](src/codeTempaltes/Globals/$sleep.js) | Blocks the thread for N milliseconds via `java.lang.Thread.sleep`. |
| [`Timer.js`](src/codeTempaltes/Globals/Timer.js) | Code timer that survives across a channel's source/destination scopes by stashing timings in the channel map. |
| [`assert.js`](src/codeTempaltes/Globals/assert.js) | Throws if a condition is falsy. |
| [`required.js`](src/codeTempaltes/Globals/required.js) | Fails fast at deploy time if expected functions/libraries aren't on the classpath — no more cloning a channel just to find out a template is missing. |
| [`atob.js`](src/codeTempaltes/Globals/atob.js) / [`btoa.js`](src/codeTempaltes/Globals/btoa.js) | Base-64 decode/encode using `java.util.Base64`. |
| [`combineErrors.js`](src/codeTempaltes/Globals/combineErrors.js) | Merges two errors (messages + stack traces) into one. |
| [`convertTimeZone.js`](src/codeTempaltes/Globals/convertTimeZone.js) | Converts an `yyyyMMddHHmmss` date-time string between IANA time zones using `java.time`. |
| [`arrayListToArray.js`](src/codeTempaltes/Globals/arrayListToArray.js) | Converts a Java `List`/`ArrayList` into a JS array. |
| [`denormalizeSQL.js`](src/codeTempaltes/Globals/denormalizeSQL.js) | Inlines parameters into a `?`-placeholder SQL string for readable logging. |
| [`extractTextFromPDF.js`](src/codeTempaltes/Globals/extractTextFromPDF.js) | Extracts text from a PDF byte array using Mirth's bundled iText (2.1.7). |
| [`getSourceMsg.js`](src/codeTempaltes/Globals/getSourceMsg.js) | Fetches any representation (raw, transformed, encoded, response, …) of the current source message. |
| [`batchJsonHandler.js`](src/codeTempaltes/Globals/batchJsonHandler.js) / [`batchTextHandler.js`](src/codeTempaltes/Globals/batchTextHandler.js) | Custom batch processors that split an inbound message into individual records, one per `next()` call. |
| [`fixHL7LineBreaks.js`](src/codeTempaltes/Globals/fixHL7LineBreaks.js) | Repairs HL7 messages with stray, unescaped line breaks inside fields. |
| [`xmlToHL7.js`](src/codeTempaltes/Globals/xmlToHL7.js) | Serializes Mirth XML back to encoded HL7 v2, cleaning common artifacts. |
| [`xmlToJson.js`](src/codeTempaltes/Globals/xmlToJson.js) | Converts Mirth E4X XML to JSON, with an optional per-node transform callback. |
| [`mapMessageRoute.js`](src/codeTempaltes/Globals/mapMessageRoute.js) | Records the channel-to-channel route a message took into `$c('route')`. Designed for the Preprocessor Global Script. |
| [`responseHandler.js`](src/codeTempaltes/Globals/responseHandler.js) | Rule-driven response transformer for retry/error handling based on the response error message. |
| [`splitStringOnSpaceAndLength.js`](src/codeTempaltes/Globals/splitStringOnSpaceAndLength.js) / [`limitArrElementLength.js`](src/codeTempaltes/Globals/limitArrElementLength.js) | Word-wrap helpers for length-limited fields (e.g. OBX/NTE). |

### 🗄️ Database — [`src/codeTempaltes/DB`](src/codeTempaltes/DB)

| Template | What it does |
| --- | --- |
| [`DBConnection.js`](src/codeTempaltes/DB/DBConnection.js) | Reusable base class wrapping Mirth's `DatabaseConnectionFactory`, with optional cross-channel connection caching. Extend it for your own DB helpers. |
| [`ChannelUtils.js`](src/codeTempaltes/DB/ChannelUtils.js) | `DBConnection` subclass with conveniences for querying Mirth's own database. |
| [`PersistentMap.js`](src/codeTempaltes/DB/PersistentMap.js) | A DB-backed map that persists across restarts and is reachable from any channel, with per-entry expiration. |
| [`PersistentChannelMap.js`](src/codeTempaltes/DB/PersistentChannelMap.js) | Like `PersistentMap`, but scoped/keyed per channel. |

### 🏥 HL7 Message — [`src/codeTempaltes/HL7Message`](src/codeTempaltes/HL7Message)

| Template | What it does |
| --- | --- |
| [`HL7Message.es5.js`](src/codeTempaltes/HL7Message/HL7Message.es5.js) | An ES5 HL7 v2 message model — parse, read/modify segments and fields, validate, and re-encode. Also `require()`-able under Node for testing. |
| [`Encoding.es5.js`](src/codeTempaltes/HL7Message/Encoding.es5.js) | Parses and represents the HL7 encoding characters (`MSH-1`/`MSH-2`) used by `HL7Message`. |

### 💾 Standalone Mirth Backup — [`src/codeTempaltes/StandaloneMirthBackup`](src/codeTempaltes/StandaloneMirthBackup)

A channel-driven backup system that exports the full Mirth server configuration on an hourly/daily/weekly/monthly
rotation via File Writer destinations. See [`mirthBackup.js`](src/codeTempaltes/StandaloneMirthBackup/mirthBackup.js)
for the full setup instructions, plus the small date helpers (`getDayName`, `getWeekNumber`, `getMonthName`,
`getDayOfYear`, `getMirthConfig`) it relies on.

### 📡 Channels — [`src/channels`](src/channels)

Importable channel XML, including [`StandaloneMirthBackup.xml`](src/channels/StandaloneMirthBackup.xml).

### 📚 Examples — [`src/Examples`](src/Examples)

- [`customBatchProcessor.js`](src/Examples/customBatchProcessor.js) — a custom CSV batch processor that treats the
  first row as headers and emits each subsequent row as a JSON object.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

There's nothing to build or install — these are source files you paste into Mirth Connect. Pick the integration
style that matches the file.

### Using a Code Template

Most files in `Globals`, `DB`, and `HL7Message` are designed to be Code Templates:

1. In the Mirth Administrator, open **Channels → Code Templates** (Edit Code Templates).
2. Create a new code template, set its **Type** to *Function*, and paste in the contents of the file.
3. Add the template to a **Code Template Library** and assign that library to the channels that need it.
4. Call the function from any connector/transformer/filter script on those channels.

> 💡 The leading JSDoc comment in each file is written to double as the template's description field.

### Using a Global Script

A few templates are meant for **Global Scripts** rather than the template library — for example
[`mapMessageRoute.js`](src/codeTempaltes/Globals/mapMessageRoute.js) (Preprocessor) and the
[`StandaloneMirthBackup`](src/codeTempaltes/StandaloneMirthBackup) setup. Each file's header documents where it
belongs.

### Importing a Channel

For files under [`src/channels`](src/channels), use **Channels → Import Channel** in the Mirth Administrator and
select the `.xml` file.

### A Local Mirth for Testing

A [`docker-compose.yml`](docker-compose.yml) is included to spin up a throwaway Mirth instance:

```bash
docker compose up -d
```

This starts NextGen Connect 4.5.2 with the Administrator/API exposed on **https://localhost:10452**. Adjust the
image tag in `docker-compose.yml` to test against a different Mirth version.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- THE MIRTH HELPERS -->
## The Mirth `$` Helpers

Several templates use Mirth's built-in [User API](https://docs.nextgen.com/) shorthand map accessors. They're not
defined in this repo — Mirth provides them at runtime. For reference:

| Helper | Map |
| --- | --- |
| `$c(key[, val])` | Channel Map |
| `$co(key[, val])` | Connector Map |
| `$s(key[, val])` | Source Map |
| `$gc(key[, val])` | Global Channel Map |
| `$g(key[, val])` | Global Map |
| `$cfg(key[, val])` | Configuration Map |
| `$r(key[, val])` | Response Map |

The full set of expected runtime globals (`msg`, `connectorMessage`, `channelId`, `XML`, etc.) is listed in
[`.eslintrc`](.eslintrc), which lints this code as if those globals exist.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage Examples

**HTTP request with `fetch()`** — including mutual TLS:

```javascript
// Simple GET
var data = fetch('https://example.com/api/patients').json();

// POST JSON
var res = fetch('https://example.com/api', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({mrn: '12345'})
}).json();

// Mutual TLS (client certificate)
var secure = fetch('https://secure.example.com/api', {
  clientCert: {path: '/opt/mirth/certs/client.p12', password: 'changeit'}
}).json();
```

**Retry a flaky call with backoff:**

```javascript
var result = $retry(function () {
  return fetch('https://example.com/sometimes-down').json();
}, {retries: 3, backoff: 2000, throwOnFail: true});
```

**Fail fast if a dependency is missing (in a Deploy or Preprocessor script):**

```javascript
required(['$t', '$retry', 'assert', 'fetch']);
```

**A persistent, cross-channel map:**

```javascript
// Deploy Script — create the table once
var pm = new PersistentMap(JSON.parse($cfg('john_doe_memorial_persistent_map')));
pm.initialize();

// Anywhere later
var $p = new PersistentMap(JSON.parse($cfg('john_doe_memorial_persistent_map')));
$p.put('lastSeenMRN', '12345');
var mrn = $p.get('lastSeenMRN');
```

See each file's `@example` block for more.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- COMPATIBILITY NOTES -->
## Compatibility Notes

- **Runtime:** these scripts run on Rhino inside Mirth/NextGen Connect, **not** Node.js or a browser. Expect
  limited modern-ECMAScript support; some templates are deliberately written in ES5.
- **Version drift:** Mirth's bundled libraries and APIs change between releases. Notable callouts in the source:
  `fetch()`'s `Map`-based headers need Mirth 4.0 (and maybe 3.12); the Standalone Backup works on 3.11 but not 3.7.
  When in doubt, test against your target version (see [docker-compose](#a-local-mirth-for-testing)).
- **Java interop:** templates lean on `Packages.*` / `java.*` classes available on the Mirth classpath
  (Apache HttpClient, iText 2.1.7, `java.time`, `java.util.Base64`, etc.).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Expand usage examples for each template
- [ ] Document the `DBConnection` / `ChannelUtils` API surface
- [ ] Document `HL7Message` rules and validation
- [ ] Add tests for the `require()`-able ES5 modules

See the [open issues](https://github.com/MichaelLeeHobbs/mmc/issues) for the full list of proposed features and
known issues.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any
contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also
simply open an issue with the tag `enhancement`. Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Code is linted with the rules in [`.eslintrc`](.eslintrc) (single quotes, 1TBS braces, no mixed tabs/spaces).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the Apache-2.0 License. See [LICENSE](LICENSE) for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Michael Lee Hobbs — [@MichaelLeeHobbs](https://github.com/MichaelLeeHobbs)

Project Link: [https://github.com/MichaelLeeHobbs/mmc](https://github.com/MichaelLeeHobbs/mmc)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Jon Bartels](https://github.com/jonbartels)
* [Tony Germano](https://github.com/tonygermano)
* [Pacmano](https://github.com/pacmano1)
* The [Mirth Connect community](https://forums.mirthproject.io/)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/MichaelLeeHobbs/mmc.svg?style=for-the-badge
[contributors-url]: https://github.com/MichaelLeeHobbs/mmc/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/MichaelLeeHobbs/mmc.svg?style=for-the-badge
[forks-url]: https://github.com/MichaelLeeHobbs/mmc/network/members
[stars-shield]: https://img.shields.io/github/stars/MichaelLeeHobbs/mmc.svg?style=for-the-badge
[stars-url]: https://github.com/MichaelLeeHobbs/mmc/stargazers
[issues-shield]: https://img.shields.io/github/issues/MichaelLeeHobbs/mmc.svg?style=for-the-badge
[issues-url]: https://github.com/MichaelLeeHobbs/mmc/issues
[license-shield]: https://img.shields.io/github/license/MichaelLeeHobbs/mmc.svg?style=for-the-badge
[license-url]: https://github.com/MichaelLeeHobbs/mmc/blob/main/LICENSE
