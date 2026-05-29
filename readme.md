<div id="top"></div>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



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
    <li><a href="#rhino-language-support">Rhino Language Support</a></li>
    <li><a href="#testing">Testing</a></li>
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

Related functions are grouped into consolidated namespace files (e.g. everything string-related lives
in `stringUtils`). Each function keeps its own JSDoc, so the per-function descriptions still show up in
Mirth. A small `utils` bridge exposes them all under one object (`utils.string`, `utils.date`, …).

| Template | What it does |
| --- | --- |
| [`fetch.mirth.js`](src/codeTempaltes/Globals/fetch.mirth.js) | A partial `fetch()` implementation over Apache HttpClient. Supports GET/POST/PUT/DELETE, headers, redirects, self-signed certs (`ignoreSSLError`), **mutual TLS (`clientCert`)**, and `.json()` / `.text()` / `.xml()` / `.byteArray()` body readers. |
| [`stringUtils.js`](src/codeTempaltes/Globals/stringUtils.js) | Text helpers: `atob`/`btoa` (Base-64 via `java.util.Base64`), word-wrap for length-limited fields (`wrapText`, `wrapArray`, `limitElementLength`), line-break encoding, and report parsing (`splitReportText`, `splitFindingsAndImpression`, `filterLinesContaining`). |
| [`arrayUtils.js`](src/codeTempaltes/Globals/arrayUtils.js) | Array helpers: `fromArrayList` (Java `List`/`ArrayList` → JS array) and `toObject`. |
| [`dateUtils.js`](src/codeTempaltes/Globals/dateUtils.js) | Date/time helpers: HL7 ⇄ ISO ⇄ `Date` conversions, `convertTimeZone` (IANA zones via `java.time`), `getAge`, `isOlderThan`, and the cross-scope `dateUtils.Timer`. |
| [`jsonUtils.js`](src/codeTempaltes/Globals/jsonUtils.js) | JSON helpers: circular-safe `stringify`/`stringifyCircular` for Rhino, `fromXml` (Mirth E4X XML → JSON with optional per-node callback), and `denormalizeSQL`. |
| [`errorUtils.js`](src/codeTempaltes/Globals/errorUtils.js) | Error helpers: `toString` (message + stack across JS/Java error types) and variadic `combine` (merges multiple errors into one). |
| [`validationUtils.js`](src/codeTempaltes/Globals/validationUtils.js) | Validation helpers: `parseInt` with default/min/max bounds. |
| [`channelUtils.js`](src/codeTempaltes/Globals/channelUtils.js) | Channel infrastructure: `batchJson`/`batchText` batch processors, `getSourceMsg`, `mapMessageRoute`, `routeJsonMsg`, the rule-driven `responseHandler`, and `required` (deploy-time dependency check). |
| [`hl7Utils.js`](src/codeTempaltes/Globals/hl7Utils.js) | HL7 v2 helpers: `fixLineBreaks` (repairs stray unescaped line breaks) and `fromXml` (Mirth XML → encoded HL7 v2). |
| [`pdfUtils.js`](src/codeTempaltes/Globals/pdfUtils.js) | `extractText` — pulls text out of a PDF byte array using Mirth's bundled iText (2.1.7). |
| [`mirthEventPoller.js`](src/codeTempaltes/Globals/mirthEventPoller.js) | Generic poller for Mirth's internal event log: `poll({eventName, onEvent, …})` matches events by name, de-dupes by event id in `$gc`, and hands each new event to a pluggable `onEvent` handler as a parsed object (`id`, `username`, `channelName`, `messageIds`, `attributes`, …). Plus `debugDumpEvents` for discovery. |
| [`utils.js`](src/codeTempaltes/Globals/utils.js) | Bridge object exposing all the namespaces above as `utils.string`, `utils.date`, `utils.json`, `utils.array`, `utils.error`, `utils.validation`, and `utils.channel`. |
| [`$t.js`](src/codeTempaltes/Globals/$t.js) | Inline try/catch — `$t(() => a.b.c)` stands in for optional chaining (`a?.b?.c`), which Rhino lacks. Swallows the error and returns `undefined`. |
| [`tryCatch.js`](src/codeTempaltes/Globals/tryCatch.js) | Synchronous Go-style result tuple — `tryCatch(fn)` returns `[data, null]` or `[null, error]`, surfacing the error instead of swallowing it (the explicit counterpart to `$t`). |
| [`$retry.js`](src/codeTempaltes/Globals/$retry.js) | Retries a callback with configurable attempts and backoff; optionally rethrows the last error. |
| [`$sleep.js`](src/codeTempaltes/Globals/$sleep.js) | Blocks the thread for N milliseconds via `java.lang.Thread.sleep`. |
| [`assert.js`](src/codeTempaltes/Globals/assert.js) | Throws if a condition is falsy; also `assert.ok` and `assert.array` for batches of `[condition, message]` pairs. |
| [`required.js`](src/codeTempaltes/Globals/required.js) | Deprecated thin wrapper that delegates to `channelUtils.required` — fails fast at deploy time if expected functions/libraries aren't on the classpath. |

### 🗄️ Database — [`src/codeTempaltes/DB`](src/codeTempaltes/DB)

| Template | What it does |
| --- | --- |
| [`DBConnection.js`](src/codeTempaltes/DB/DBConnection.js) | Reusable base class wrapping Mirth's `DatabaseConnectionFactory`, with optional cross-channel connection caching. Extend it for your own DB helpers. |
| [`ChannelUtils.js`](src/codeTempaltes/DB/ChannelUtils.js) | `DBConnection` subclass with conveniences for querying Mirth's own database. |
| [`PersistentMap.js`](src/codeTempaltes/DB/PersistentMap.js) | A DB-backed map that persists across restarts and is reachable from any channel, with per-entry expiration. |
| [`PersistentChannelMap.js`](src/codeTempaltes/DB/PersistentChannelMap.js) | Like `PersistentMap`, but scoped/keyed per channel. |

### 🏥 HL7 Message — [`src/codeTempaltes/Globals/HL7Message.js`](src/codeTempaltes/Globals/HL7Message.js)

A self-contained ES5 HL7 v2 message model in a single file: parse a message; read and modify
segments, fields, components, subcomponents, and repetitions by path; validate against rules; diff
two messages; build ACKs; and re-encode. The `Encoding` helper class (HL7 encoding characters,
`MSH-1`/`MSH-2`) is bundled in the same file. Requires Mirth's `rhinoLanguageVersion` ≥ 180 (it
uses `let` + object destructuring). Covered by tests in `test/hl7message.test.js` and
`test/encoding.test.js`.

📖 **Full API + examples: [docs/HL7Message.md](docs/HL7Message.md)** — path syntax, reading,
writing, deleting, searching, validation, diffing, ACKs, encoding, and gotchas (every example
verified against the live code).

### 💾 Standalone Mirth Backup — [`src/codeTempaltes/StandaloneMirthBackup`](src/codeTempaltes/StandaloneMirthBackup)

A channel-driven backup system that exports the full Mirth server configuration on an hourly/daily/weekly/monthly
rotation via File Writer destinations. It's now a single [`mirthBackup.js`](src/codeTempaltes/StandaloneMirthBackup/mirthBackup.js)
containing both `getMirthConfig` (serializes the running server config to XML) and `mirthBackup` (drives the
rotation). See the file's header for the full setup instructions.

### 📄 Document — [`src/codeTempaltes/Document.js`](src/codeTempaltes/Document.js)

A paginated text-document builder in a single file, four classes in dependency order:
`AdvanceString` (word-wrap, centering, templating, character remapping), `Template` (header/footer line
templates with per-line transformers), `Page` (header + word-wrapped body + footer with min/max line limits),
and `Document` (splits body text across as many pages as needed, numbering them). `Document.prototype.toHL7`
can emit the rendered text as HL7 `OBX` segments.

### 📡 Channels — [`src/channels`](src/channels)

Importable channel XML, including [`StandaloneMirthBackup.xml`](src/channels/StandaloneMirthBackup.xml).

### 📚 Examples — [`src/Examples`](src/Examples)

- [`customBatchProcessor.js`](src/Examples/customBatchProcessor.js) — a custom CSV batch processor that treats the
  first row as headers and emits each subsequent row as a JSON object.
- [`fetch.examples.js`](src/Examples/fetch.examples.js) — 17 `fetch` recipes: GET JSON/XML/text, binary
  download → attachment, POST JSON/form, Bearer/Basic auth, query params, PUT/DELETE, error-status vs
  network-error handling, reading response headers, self-signed certs, mutual TLS, disabling redirects, and a
  retry + `tryCatch` pattern.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

There's nothing to build or install — these are source files you paste into Mirth Connect. Pick the integration
style that matches the file.

### Using a Code Template

Most files in `Globals` and `DB` are designed to be Code Templates:

1. In the Mirth Administrator, open **Channels → Code Templates** (Edit Code Templates).
2. Create a new code template, set its **Type** to *Function*, and paste in the contents of the file.
3. Add the template to a **Code Template Library** and assign that library to the channels that need it.
4. Call the function from any connector/transformer/filter script on those channels.

> 💡 The leading JSDoc comment in each file is written to double as the template's description field.

### Using a Global Script

A few templates are meant for **Global Scripts** rather than the template library — for example
[`channelUtils.mapMessageRoute`](src/codeTempaltes/Globals/channelUtils.js) (Preprocessor) and the
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

**Handle errors explicitly with `tryCatch`** (forces you to deal with the failure path up front, instead of letting an exception escape):

```javascript
// Array destructuring works in Mirth's Rhino (verified on 1.7.13).
const [data, error] = tryCatch(function () { return fetch('https://example.com/api').json(); });
if (error) {
  logger.error('fetch failed: ' + error);
  return; // handle and bail
}
// data is safe to use here
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



<!-- RHINO LANGUAGE SUPPORT -->
## Rhino Language Support

Mirth 4.5.2 runs scripts on **Rhino 1.7.13**, and the JavaScript syntax you can use depends on the server setting
**`rhinoLanguageVersion`** (which defaults to `VERSION_DEFAULT` = `0`). To pin down exactly what works, this repo
ships an empirical, regenerable report:

**➡️ [`docs/RHINO-COMPATIBILITY.md`](docs/RHINO-COMPATIBILITY.md)** — a feature × language-version matrix
(v0 / v180 / v200) generated by running probes through Mirth's _actual_ Rhino jar.

```sh
pnpm run rhino:compat   # extracts the jar from the Mirth container and regenerates the report
```

Highlights (Rhino 1.7.13):

- **`const` and array destructuring work at every version**, including the default v0 — so
  `const [data, error] = tryCatch(...)` is safe.
- **`let`, object destructuring, and object _param_ destructuring (`function ({ a, b })`) require v180+** — they fail
  on a default Mirth. (Array param destructuring `function ([a, b])` works even at v0.)
- **No** ES6 `class`, `Promise`, default/rest/spread params, or **template-literal interpolation** at any version —
  use string concatenation, not `` `${x}` ``.
- **`for (let i…)` captures the final value** (no per-iteration binding); `for-of` / `Map` / `Set` / generators need
  v200 (ES6).

See the report for the full matrix and the Gotchas section.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- TESTING -->
## Testing

Unit tests run under [Vitest](https://vitest.dev/) in Node — even though the templates target Rhino. The trick is a
small harness ([`test/mirthHarness.js`](test/mirthHarness.js)) that loads a template's source into a Node `vm`
sandbox pre-seeded with mocked Mirth globals (`$c`/`$gc`/… as Map-backed functions, `logger`, and injectable
`java`/`Packages`/`XML`), then reads back the declared globals and `module.exports`. The templates are tested
**as-is**, with no changes to the source.

```sh
pnpm install
pnpm test            # run once
pnpm run test:watch  # watch mode
```

Tests currently cover the pure, dependency-light helpers — `tryCatch`, `$t`, `arrayUtils`, `validationUtils`,
`jsonUtils`, `stringUtils`, `Encoding`, and `Document`. Heavily Java/Mirth-coupled templates (`channelUtils`,
`mirthEventPoller`, `fetch.mirth`, `dateUtils.convertTimeZone`, …) need `java.*` mocks and are tracked as TODO.

> Note: because the harness loads template source through `vm`, V8 line-coverage reports 0% — the eval'd code isn't
> part of the instrumented module graph. The passing assertions are the signal, not the coverage number.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Expand usage examples for each template
- [ ] Document the `DBConnection` / `ChannelUtils` API surface
- [x] Document `HL7Message` rules and validation
- [x] Vitest harness + tests for the pure, `require()`-able helpers
- [ ] Extend tests to the Java/Mirth-coupled templates (mock `java.*`)
- [ ] Fix mutation issues — `HL7Message.get(path, false)` (and similar) return a **live reference** into the message, so mutating the result mutates the message. Return clones instead. (Deferred: touches several call sites.)
- [ ] **(breaking)** Make `Template` per-line transformers 0-based to match `getLine`/`setLine` — currently 1-based (`_transformers[i + 1]`). Consumers that key transformers 1-based (e.g. the prod radiology report header) must be updated in lockstep.
- [ ] **(breaking)** Fix `Page` min-line padding off-by-one so pages reach `minLines` instead of `minLines - 1` — changes rendered page line counts (e.g. prod report pages would go 48 → 49 lines/page).

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

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

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
[license-shield]: https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge
[license-url]: https://github.com/MichaelLeeHobbs/mmc/blob/main/LICENSE
