# HL7Message — API Reference & Examples

`HL7Message` is a self-contained **HL7 v2** message model for **Mirth Connect / Rhino**. It
parses a pipe-delimited HL7 message into an addressable object tree and lets you **read, write,
delete, search, validate, diff, ACK, and re-encode** messages by a simple path syntax
(`SEG[n].field[n].comp.sub`).

The single source file
[`src/codeTempaltes/Globals/HL7Message.js`](../src/codeTempaltes/Globals/HL7Message.js) bundles
**two** classes — `Encoding` (the encoding-character helper) first, then `HL7Message` (which
depends on it). Paste the one file into a Mirth Code Template and both `HL7Message` and `Encoding`
become available.

Every example below is taken from, and verified against, the live code through the repo's vm test
harness (`test/hl7message.test.js`, `test/encoding.test.js`). Returned values shown in `//`
comments are the actual results.

---

## Table of contents

1. [Overview](#1-overview)
2. [Getting started](#2-getting-started)
3. [Path syntax](#3-path-syntax)
4. [Reading](#4-reading)
5. [Writing](#5-writing)
6. [Deleting](#6-deleting)
7. [Searching](#7-searching)
8. [Validation](#8-validation)
9. [Diffing](#9-diffing)
10. [Serialization / conversion](#10-serialization--conversion)
11. [Encoding](#11-encoding)
12. [Statics & helpers](#12-statics--helpers)
13. [Gotchas](#13-gotchas)

---

## 1. Overview

`HL7Message` models an HL7 v2 message as an array of **segments**, each segment an object keyed by
1-based field index (key `0` is the segment name). Fields hold repetitions, repetitions hold
components, components hold subcomponents — all keyed 1-based. You never touch that structure
directly; you address it with a **path string** like `PID.5.1`.

What you can do:

- **Parse** a raw HL7 string (or a Mirth `XML` object) and **re-encode** it back (`toString`).
- **Read** values with `get` / `getRange` and pull segments with `getSegments` / `getSegment`.
- **Write** with `set` (strings, numbers, arrays, and objects), auto-creating missing segments/fields.
- **Delete** at any depth (segment / field / repetition / component / subcomponent).
- **Search** segments by regex (`findInSegment`, `findSegment`).
- **Validate** against composable rules (`addRule*`, `validate`, `isValid`, `validationIssues`).
- **Diff** two messages and build an **ACK** (`createAckMessage`).

The bundled **`Encoding`** class manages the HL7 encoding characters (`MSH-1` field separator and
`MSH-2` `^~\&`), supports non-standard delimiters, and provides `escapeString` / `unescapeString`.

### Requirement: `rhinoLanguageVersion >= 180`

The library uses `let` and **object destructuring**, which Rhino only supports when Mirth's server
setting **`rhinoLanguageVersion` is `180` (VERSION_1_8) or higher**. On a default Mirth
(`rhinoLanguageVersion = 0`) the template will fail to compile. See
[`docs/RHINO-COMPATIBILITY.md`](RHINO-COMPATIBILITY.md) for the full feature matrix.

### Errors vs. silent empties

- **Reads are forgiving.** `get('ZZZ.1.1')` on a missing path returns `''` (empty string), not an
  error. `getSegment` returns `undefined` for a missing segment.
- **Some operations throw.** Constructing/parsing a non-string or a string that doesn't start with
  `MSH` throws (`HL7Message.assert`). `set` with an invalid component value throws. `toXML` throws
  outside Mirth. `addRule*` assert their argument types. These are called out where relevant.

---

## 2. Getting started

### In a Mirth transformer (the common case)

```js
// rhinoLanguageVersion must be >= 180 (see Overview).
var msg = new HL7Message($('rawMessage'));   // parse the inbound message
var mrn = msg.get('PID.3.1');                // read a value
msg.set('PID.5.1', 'Smith');                 // modify a value
channelMap.put('ack', msg.createAckMessage().toString());
```

You can also pass a Mirth `XML` object (e.g. `connectorMessage.getTransformedData()` parsed to
`XML`); the constructor converts it via Mirth's HL7V2 serializer.

### In Node / tests

The class is exposed as a CommonJS export with `Encoding` attached, and is loaded in tests through
the vm harness:

```js
import { loadTemplates } from './mirthHarness.js'
const HL7Message = loadTemplates(
  ['Globals/HL7Message.js'],
  { java: { lang: { Object: function () {} } } },
).module.exports
const Encoding = HL7Message.Encoding
```

> The `java` mock mirrors the Mirth runtime, but the library is realm-safe and no longer *requires*
> it — plain objects/arrays/RegExps created in Node work in `set`, `addRuleMatches`, etc.

### Parse a raw string and read a value

```js
var raw = 'MSH|^~\\&|SENDAPP|SENDFAC|RECVAPP|RECVFAC|20240101120000||ADT^A01|MSG00001|P|2.3';
var msg = new HL7Message(raw);
msg.get('MSH.9.1'); // 'ADT'
msg.get('MSH.9.2'); // 'A01'
```

An **empty constructor** seeds a minimal header:

```js
new HL7Message().toString();   // 'MSH|^~\\&'
new HL7Message().get('MSH.1.1'); // '|'    (field separator -> MSH-1)
new HL7Message().get('MSH.2.1'); // '^~\\&' (encoding chars -> MSH-2)
```

### The sample message used throughout

Most examples below operate on this realistic **ORU^R01** lab result. It is shown once here and
referenced as `ORU` afterward (segments joined by `\r`):

```
MSH|^~\&|LAB|HOSPlab|EHR|HOSP|20240315093000||ORU^R01|MSG0001|P|2.5.1
PID|1||MRN12345^^^HOSP^MR||Smith^John^Q||19850210|M|||100 Elm St^Apt 2^Boston^MA^02134||617-555-0100~617-555-0199
OBR|1||ACC987|CBC^Complete Blood Count^L
OBX|1|NM|WBC^White Blood Cell^L||7.2|10*3/uL|4.0-11.0|N|||F
OBX|2|NM|HGB^Hemoglobin^L||14.5|g/dL|13.0-17.0|N|||F
OBX|3|CE|ABO^Blood Group^L||A^Positive&strong||||||F
```

```js
var ORU = [
  'MSH|^~\\&|LAB|HOSPlab|EHR|HOSP|20240315093000||ORU^R01|MSG0001|P|2.5.1',
  'PID|1||MRN12345^^^HOSP^MR||Smith^John^Q||19850210|M|||100 Elm St^Apt 2^Boston^MA^02134||617-555-0100~617-555-0199',
  'OBR|1||ACC987|CBC^Complete Blood Count^L',
  'OBX|1|NM|WBC^White Blood Cell^L||7.2|10*3/uL|4.0-11.0|N|||F',
  'OBX|2|NM|HGB^Hemoglobin^L||14.5|g/dL|13.0-17.0|N|||F',
  'OBX|3|CE|ABO^Blood Group^L||A^Positive&strong||||||F',
].join('\r');
var msg = new HL7Message(ORU);
```

---

## 3. Path syntax

A path addresses one element of the message:

```
SEG[segIdx].field[fieldIdx].comp.sub
```

| Token       | Meaning                                            | Notes |
| ----------- | -------------------------------------------------- | ----- |
| `SEG`       | 3-char segment name (`A–Z`/`0–9`), e.g. `PID`      | required |
| `[segIdx]`  | which occurrence of that segment, **1-based**      | optional; defaults to `1` |
| `.field`    | field number, **1-based**                          | optional |
| `[fieldIdx]`| which **field repetition** (the `~` separator), 1-based | optional; defaults to `1` |
| `.comp`     | component number, **1-based** (the `^` separator)  | optional; defaults to `1` when reading deeper |
| `.sub`      | subcomponent number, **1-based** (the `&` separator) | optional; defaults to `1` |

Everything is **1-based**. Segment repetition uses `SEG[n]`; field repetition uses `field[n]`.

The `%` wildcard is only used by [`getRange`](#getrange) to sweep a numeric position over a range.

### What paths address on the sample message

| Path                | Addresses                                         | Value on `ORU` |
| ------------------- | ------------------------------------------------- | -------------- |
| `MSH.9.1`           | MSH-9, component 1 (message type)                 | `'ORU'` |
| `MSH.9.2`           | MSH-9, component 2 (trigger event)                | `'R01'` |
| `PID.3.1`           | PID-3, component 1 (MRN)                           | `'MRN12345'` |
| `PID.3.4`           | PID-3, component 4 (assigning authority)          | `'HOSP'` |
| `PID.5.1`           | PID-5, component 1 (last name)                     | `'Smith'` |
| `PID.5.2`           | PID-5, component 2 (first name)                    | `'John'` |
| `PID.11.2`          | PID-11, component 2 (address line 2)              | `'Apt 2'` |
| `PID.13[1].1`       | PID-13, **1st repetition**, component 1 (phone)    | `'617-555-0100'` |
| `PID.13[2].1`       | PID-13, **2nd repetition**, component 1 (phone)    | `'617-555-0199'` |
| `OBX[2].5.1`        | **2nd** OBX, OBX-5, component 1 (value)            | `'14.5'` |
| `OBX[3].5.1.1`      | 3rd OBX, OBX-5, component 1, subcomponent 1        | `'A'` |
| `OBX[3].5.2.1`      | 3rd OBX, OBX-5, component 2, subcomponent 1        | `'Positive'` |
| `OBX[3].5.2.2`      | 3rd OBX, OBX-5, component 2, subcomponent 2        | `'strong'` |

> Note `A^Positive&strong`: `^` makes two **components** (`A`, then `Positive&strong`); `&` splits
> the *second* component into subcomponents `Positive` and `strong`. So the detail lives under
> component **2**, not component 1.

---

## 4. Reading

### `get(path, [autoResolve=true])`

Returns the value at `path`. Missing paths return `''`.

```js
var msg = new HL7Message(ORU);

// components & subcomponents
msg.get('PID.5.1');     // 'Smith'
msg.get('PID.5.2');     // 'John'
msg.get('OBX[3].5.1.1');// 'A'
msg.get('OBX[3].5.2.2');// 'strong'

// repeated segments by [n]
msg.get('OBX[1].5.1');  // '7.2'
msg.get('OBX[2].5.1');  // '14.5'

// field repetitions by [n]
msg.get('PID.13[1].1'); // '617-555-0100'
msg.get('PID.13[2].1'); // '617-555-0199'

// missing -> empty string
msg.get('ZZZ.1.1');     // ''
```

#### `autoResolve`: value vs. reference

With `autoResolve = true` (default), a short path is **resolved down** to its leaf string. With
`autoResolve = false` you get the **underlying object reference** at exactly the depth you named —
and mutating it mutates the message.

```js
// true (default): resolves PID.5 -> PID.5.1.1 and returns a string
msg.get('PID.5');         // 'Smith'

// false: returns the object reference at that level
msg.get('PID.5', false);  // { 1: { 1: { 1: 'Smith' }, 2: { 1: 'John' }, 3: { 1: 'Q' } } }
msg.get('PID.5.1', false);// { 1: 'Smith' }
```

A **segment-only** path returns the segment object (key `0` is the name):

```js
msg.get('PID')[0]; // 'PID'
```

### `getRange(path, start, stop, [autoResolve=true])`

Sweeps the `%` wildcard from `start` to `stop` (inclusive) and returns an array. Missing positions
come back as `''`.

```js
// MSH-3..MSH-6, component 1
msg.getRange('MSH.%.1', 3, 6); // ['LAB', 'HOSPlab', 'EHR', 'HOSP']

// OBR-1..OBR-4 (OBR-2 is empty here)
msg.getRange('OBR.%.1', 1, 4); // ['1', '', 'ACC987', 'CBC']
```

### `getSegments(name)`

Returns **all** segments of a name (empty array if none).

```js
msg.getSegments('OBX').length; // 3
msg.getSegments('PID').length; // 1
msg.getSegments('ZZZ').length; // 0
```

### `getSegment(name, [idx=1])`

Returns one segment object (1-based), or `undefined` if missing.

```js
msg.getSegment('OBX')[0];        // 'OBX'  (defaults to index 1)
msg.getSegment('OBX', 2)[0];     // 'OBX'  (the 2nd OBX)
msg.getSegment('ZZZ');           // undefined

// identity: getSegment(name, n) is the same object get('SEG[n]...') reads from
msg.getSegment('OBX', 2) === msg.getSegments('OBX')[1]; // true
```

---

## 5. Writing

### `set(path, value, [autoResolve=false])`

Sets the element at `path`. `value` may be a **string**, **number** (coerced to string), **array**
(spread into 1-based child elements), or **plain object** (spread into 1-based keys). Missing
segments/fields are **auto-created**.

```js
var msg = new HL7Message(ORU, []);

// string subcomponent — siblings preserved
msg.set('PID.5.1', 'Doe');
msg.get('PID.5.1'); // 'Doe'
msg.get('PID.5.2'); // 'John' (unchanged)

// number (coerced to string)
msg.set('PID.7.1', 19850210);
msg.get('PID.7.1'); // '19850210'
```

#### Array value → 1-based elements

An array sets consecutive children starting at index 1.

```js
// at field level -> components 1,2,3
msg.set('PID.5', ['Brown', 'Mary', 'K']);
msg.get('PID.5.1'); // 'Brown'
msg.get('PID.5.2'); // 'Mary'
msg.get('PID.5.3'); // 'K'

// at component level -> subcomponents 1,2
msg.set('PID.5.1', ['Doe', 'Jr']);
msg.get('PID.5.1.1'); // 'Doe'
msg.get('PID.5.1.2'); // 'Jr'
// PID-5.1 now serializes as 'Doe&Jr':
//   PID|1||MRN12345^^^HOSP^MR||Doe&Jr^John^Q||...
```

#### Object value → spread into keyed children

A plain object spreads into the numbered children you supply (others untouched). Keys must be
positive integers.

```js
msg.set('PID.3', { 1: 'NEWMRN', 4: 'FAC' });
msg.get('PID.3.1'); // 'NEWMRN'
msg.get('PID.3.4'); // 'FAC'
```

> An object with a non-positive-integer key at component level throws
> (`expected Component got {...}`).

#### Field repetitions

Address a repetition with `[n]`:

```js
msg.set('PID.13[2].1', '617-555-0000');
msg.get('PID.13[2].1'); // '617-555-0000'
```

#### Auto-creating segments and fields

`set` creates whatever the path needs, appending new segments at the end:

```js
var m = new HL7Message('MSH|^~\\&|A', []);
m.set('ZZ1.1.1', 'hello');
m.segments.map(function (s) { return s[0]; }); // ['MSH', 'ZZ1']
m.toString(); // 'MSH|^~\\&|A\rZZ1|hello'
```

Before/after on the sample:

```js
var m = new HL7Message(ORU, []);
m.toString().split('\r')[1];
// before: PID|1||MRN12345^^^HOSP^MR||Smith^John^Q||19850210|M|||100 Elm St^Apt 2^Boston^MA^02134||617-555-0100~617-555-0199
m.set('PID.5', ['Brown', 'Mary', 'K']);
m.toString().split('\r')[1];
// after:  PID|1||MRN12345^^^HOSP^MR||Brown^Mary^K||19850210|M|||100 Elm St^Apt 2^Boston^MA^02134||617-555-0100~617-555-0199
```

---

## 6. Deleting

### `delete(path)`

The **path depth selects what is removed** (it parses without `autoResolve`, so a field path
removes the whole field — not just `5.1.1`):

| Path           | Removes |
| -------------- | ------- |
| `SEG` / `SEG[n]` | a whole segment |
| `SEG.f`        | a whole field (all repetitions) |
| `SEG.f[n]`     | one field repetition |
| `SEG.f.c`      | one component |
| `SEG.f.c.s`    | one subcomponent |

```js
// subcomponent
var m = new HL7Message(ORU, []);
m.delete('OBX[3].5.2.2');
m.get('OBX[3].5.2.1'); // 'Positive' (kept)
m.get('OBX[3].5.2.2'); // undefined

// component
m = new HL7Message(ORU, []);
m.delete('PID.5.2');
m.get('PID.5.1'); // 'Smith'
m.get('PID.5.2'); // undefined
m.toString().split('\r')[1]; // ...||Smith^^Q||... (empty component 2)

// whole field
m = new HL7Message(ORU, []);
m.delete('PID.5');
m.get('PID.5.1'); // undefined

// one field repetition (note: it leaves the index gap, it does NOT renumber)
m = new HL7Message(ORU, []);
m.delete('PID.13[1]');
m.get('PID.13[1].1'); // undefined
m.get('PID.13[2].1'); // '617-555-0199' (still at index 2)
m.toString().split('\r')[1]; // ...||~617-555-0199 (leading empty repetition)

// indexed segment
m = new HL7Message(ORU, []);
m.delete('OBX[2]');
m.getSegments('OBX').length; // 2
m.get('OBX[2].3.1');         // 'ABO' (3rd OBX is now index 2)

// whole segment (segment-only path defaults to the first match)
m = new HL7Message(ORU, []);
m.delete('OBR');
m.getSegments('OBR').length; // 0
```

### `deleteAllSegments(name)`

Removes **every** segment of a name in one call.

```js
var m = new HL7Message(ORU, []);
m.deleteAllSegments('OBX');
m.getSegments('OBX').length;            // 0
m.segments.map(function (s) { return s[0]; }); // ['MSH', 'PID', 'OBR']
```

---

## 7. Searching

### `findInSegment(searchPath, searchValue, returnPath, [extractor])`

For every segment of `searchPath`'s type, test `searchValue` (a **RegExp**) against the value at
`searchPath`. For each match, collect the value at `returnPath` (same segment). Returns a (possibly
empty) array.

The examples below operate on the shared `ORU` message — its segments repeated here for reference:

```
MSH|^~\&|LAB|HOSPlab|EHR|HOSP|20240315093000||ORU^R01|MSG0001|P|2.5.1
PID|1||MRN12345^^^HOSP^MR||Smith^John^Q||19850210|M|||100 Elm St^Apt 2^Boston^MA^02134||617-555-0100~617-555-0199
OBR|1||ACC987|CBC^Complete Blood Count^L
OBX|1|NM|WBC^White Blood Cell^L||7.2|10*3/uL|4.0-11.0|N|||F
OBX|2|NM|HGB^Hemoglobin^L||14.5|g/dL|13.0-17.0|N|||F
OBX|3|CE|ABO^Blood Group^L||A^Positive&strong||||||F
```

```js
var msg = new HL7Message(ORU);

// find the OBX whose OBX-3.1 is "HGB", return its OBX-5.1
msg.findInSegment('OBX.3.1', /HGB/, 'OBX.5.1'); // ['14.5']

// matches collect across ALL matching segments
msg.findInSegment('OBX.3.2', /Cell|Hemoglobin/, 'OBX.5.1'); // ['7.2', '14.5']

// nothing matches -> []
msg.findInSegment('OBX.3.1', /NOPE/, 'OBX.5.1'); // []
```

#### Optional `extractor` (RegExp capture group)

If `extractor` is a RegExp, it's run against each return value; the result uses capture group 1 if
present, otherwise the whole match (`match[1] || match[0]`).

```js
// pull the integer part of "14.5"
msg.findInSegment('OBX.5.1', /14\.5/, 'OBX.5.1', /(\d+)\.(\d+)/); // ['14']
```

### `findSegment(searchPath, searchValue)`

Returns the **first** segment object whose `searchPath` value matches the RegExp, or `undefined`.

```js
var seg = msg.findSegment('OBX.3.1', /HGB/);
seg[0];            // 'OBX'
seg['1']['1']['1']['1']; // '2'  (OBX-1 of the matched segment)

msg.findSegment('OBX.3.1', /NOPE/); // undefined
```

---

## 8. Validation

Rules are functions `(message) => true | string`. A rule returns `true` when valid, or an **error
message string** when not. Add rules at construction or with the `addRule*` helpers (all chainable),
then run them.

- `validate()` runs all rules and returns the array of issues.
- `isValid` (getter) runs validation on read and returns `true` when there are no issues.
- `validationIssues` (getter) runs validation on read and returns the issues array.

### Helpers

| Method | Purpose |
| ------ | ------- |
| `addRule(fn)` | add one raw rule function |
| `addRules([fn, ...])` | add several raw rules |
| `addRuleIsRequired(path, [errorText])` | fail if `get(path)` is empty |
| `addRulesIsRequired([[path, errorText], ...])` | several required rules |
| `addRuleMatches(path, regex, [errorText])` | fail if value doesn't match `regex` |
| `addRulesMatches([[path, regex, errorText], ...])` | several match rules |
| `addRuleEnum(path, values, [errorText])` | fail if value not in `values` |
| `addRulesEnum([[path, values, errorText], ...])` | several enum rules |

### Passing

```js
var msg = new HL7Message(ORU, []);
msg.addRuleIsRequired('PID.5.1')
   .addRuleMatches('MSH.9.1', /^ORU/, '')
   .addRuleEnum('PID.8.1', ['M', 'F']);
msg.isValid;           // true
msg.validationIssues;  // []
```

### Failing (and the resulting messages)

```js
// required
var m = new HL7Message(ORU, []).addRuleIsRequired('ZZZ.1.1', 'need it');
m.isValid;          // false
m.validationIssues; // ['ZZZ.1.1 is missing. need it']

// matches
m = new HL7Message(ORU, []).addRuleMatches('MSH.9.1', /^ADT/, 'expected ADT');
m.validationIssues; // ['MSH.9.1 does not match the required pattern: /^ADT/ expected ADT']

// enum
m = new HL7Message(ORU, []).addRuleEnum('PID.8.1', ['F', 'O'], 'sex');
m.validationIssues; // ['PID.8.1 does not match the required values: [F, O] sex']
```

### Raw rules and batches

```js
// raw rule
var m = new HL7Message(ORU, []);
m.addRule(function () { return true; });
m.addRule(function () { return 'always-bad'; });
m.validationIssues.indexOf('always-bad') > -1; // true

// rules via the constructor
new HL7Message(ORU, [function () { return 'x'; }]).validate(); // ['x']

// batch helpers
m = new HL7Message(ORU, []);
m.addRulesIsRequired([['PID.5.1', ''], ['ZZZ.1.1', 'missing']]);
m.validate().length; // 1  (PID.5.1 present, ZZZ.1.1 missing)
```

> Assertions: `addRule` requires a function, `addRuleMatches` requires a RegExp, `addRuleEnum`
> requires an array — otherwise they throw.

---

## 9. Diffing

### `diff(other, [options])`

Compares two `HL7Message` instances and returns an array of human-readable differences in the form
`path: thisValue != otherValue`. `options.ignoreCase` (default `false`) suppresses case-only
differences.

```js
var a = new HL7Message(ORU);
var b = new HL7Message(ORU.replace('Smith^John^Q', 'Smith^Jane^Q'));

a.diff(b);                 // ['PID[1].5[1].2.1: John != Jane']
a.diff(new HL7Message(ORU)); // [] (identical)

// case-insensitive
var c = new HL7Message(ORU.replace('Smith^John^Q', 'Smith^JOHN^Q'));
a.diff(c);                    // [ ...a difference... ]
a.diff(c, { ignoreCase: true }); // []
```

Missing segments are reported too:

```js
var d = new HL7Message(ORU.split('\r').filter(function (l) {
  return l.indexOf('OBR') !== 0;
}).join('\r'));
a.diff(d); // ['OBR[1]: missing in other']
// (and from the other direction: 'OBR[1]: missing in this')
```

---

## 10. Serialization / conversion

### `toString()`

Re-encodes the message to a pipe-delimited string (segments joined by `\r`). Round-trips exactly,
including field repetitions and subcomponents, and does **not** duplicate the MSH field separator.

```js
new HL7Message(ORU).toString() === ORU; // true
```

### `valueOf()`

Returns a deep-cloned plain segments array (safe to mutate without touching the message). Each
segment is an object keyed by field index (`0` = name):

```js
var v = new HL7Message(ORU).valueOf();
v[0][0];        // 'MSH'
JSON.stringify(v[0]['9']); // {"1":{"1":{"1":"ORU"},"2":{"1":"R01"}}}
```

### `formattedJSON()`

Returns a JSON string with **one segment per line** inside `[ ... ]` — handy for logging.

```js
console.log(new HL7Message(ORU).formattedJSON());
// [
//   {"0":"MSH","1":{"1":{"1":{"1":"|"}}},"2":{"1":{"1":{"1":"^~\\&"}}}, ... },
//   {"0":"PID", ... },
//   {"0":"OBR", ... },
//   {"0":"OBX", ... },
//   {"0":"OBX", ... },
//   {"0":"OBX", ... }
// ]
```

### `parse(hl7)`

Re-parses a string into the **same** instance, replacing all current values.

```js
var m = new HL7Message(ORU);
m.parse('MSH|^~\\&|NEW\rPID|9');
m.get('MSH.3.1');          // 'NEW'
m.getSegments('OBX').length; // 0
```

### `createAckMessage()`

Builds a new `HL7Message` ACK: swaps sending/receiving app & facility, sets `MSH-9 = ACK`,
processing id `P`, copies the version, and sets `MSA-1 = AA` with `MSA-2` = the original control id
(`MSH-10`).

```js
var ack = new HL7Message(ORU).createAckMessage();
ack.get('MSH.3.1'); // 'EHR'      (was MSH-5)
ack.get('MSH.4.1'); // 'HOSP'     (was MSH-6)
ack.get('MSH.5.1'); // 'LAB'      (was MSH-3)
ack.get('MSH.6.1'); // 'HOSPlab'  (was MSH-4)
ack.get('MSH.9.1'); // 'ACK'
ack.get('MSH.11.1');// 'P'
ack.get('MSH.12.1');// '2.5.1'
ack.get('MSA.1.1'); // 'AA'
ack.get('MSA.2.1'); // 'MSG0001'  (copied from MSH-10)

ack.toString();
// MSH|^~\&|EHR|HOSP|LAB|HOSPlab|<timestamp>||ACK|<timestamp>|P|2.5.1\rMSA|AA|MSG0001
// (MSH-7 and MSH-10 are the current UTC timestamp, e.g. 20240315093000.123)
```

### `toXML([options])` — Mirth only

Converts to a Mirth `XML` object via `SerializerFactory.getSerializer('HL7V2')`. Options:
`removeNullish` (default `true`, strips literal `null`/`undefined` text) and `replaceInvalidChars`
(default `true`). **Requires the Mirth runtime** — it throws outside Mirth:

```js
// In Node/tests without the XML global:
new HL7Message(ORU).toXML(); // throws: 'XML type not detected! ... only valid in Mirth environment'
```

In Mirth it returns an `XML` instance wrapping the serialized message.

---

## 11. Encoding

`Encoding` holds the six delimiters: `field` (`|`), `component` (`^`), `fieldRepetition` (`~`),
`escape` (`\`), `subcomponent` (`&`), and `segment` (`\r`). `HL7Message` creates one for you and
exposes it as `msg.encoding`, but you can use the class directly.

### Defaults & overrides

```js
var enc = new Encoding();
enc.field;           // '|'
enc.component;       // '^'
enc.fieldRepetition; // '~'
enc.escape;          // '\\'
enc.subcomponent;    // '&'
enc.segment;         // '\r'
enc.toString();      // '|^~\\&' (the 5 HL7 encoding fields, joined)

new Encoding({ field: '#', component: '@' }).field; // '#'
```

### Parsing encoding from a message (custom delimiters)

`HL7Message` reads non-standard delimiters straight from MSH-1/MSH-2, so a message with custom
separators just works:

```js
// field=#, component=@, fieldRepetition=!, escape=\, subcomponent=$
var custom = 'MSH#@!\\$#A#B\rPID#1#x@y';
var m = new HL7Message(custom);
m.encoding.field;     // '#'
m.encoding.component; // '@'
m.get('PID.2.1');     // 'x'
m.get('PID.2.2');     // 'y'
m.toString().split('\r')[1]; // 'PID#1#x@y' (round-trips with custom separators)

// directly:
new Encoding({ hl7: 'MSH|^~\\&|SENDAPP' }).toString(); // '|^~\\&'
```

### `escapeString` / `unescapeString`

Encode/decode HL7 escape sequences (`\F\`, `\S\`, `\T\`, `\R\`, `\E\`). The escape char is handled
first so it can't double-escape the others.

```js
var enc = new Encoding();
var escaped = enc.escapeString('a|b^c&d~e\\f');
escaped; // 'a\\F\\b\\S\\c\\T\\d\\R\\e\\E\\f'
//          a \F\ b \S\ c \T\ d \R\ e \E\ f
enc.unescapeString(escaped); // 'a|b^c&d~e\\f'
```

### `toJSON` / `fromJSON`

Serialize all six fields as an array (in order) and rebuild from it.

```js
var enc = new Encoding();
enc.toJSON(); // ['|', '^', '~', '\\', '&', '\r']

var clone = Encoding.fromJSON(enc.toJSON());
clone.toJSON(); // ['|', '^', '~', '\\', '&', '\r']
```

---

## 12. Statics & helpers

| Static | Description |
| ------ | ----------- |
| `HL7Message.toJsPrimitive(val)` | Converts known Java objects (`java.lang.String`/`Integer`/…, via `getClass()`) to JS primitives; recurses plain objects/arrays; passes JS primitives through. Falls back to `toString()` for unknown Java types. Used internally by `set`. |
| `HL7Message.parser(hl7, [encoding])` | Low-level parse. Returns `[segments, encoding]`. Throws on non-string / non-`MSH` input. |
| `HL7Message.assert(predicate, msg)` | Throws `Error(msg)` when `predicate` is falsy. |
| `HL7Message.isPOJO(v)` | Realm-safe plain-object check (false for arrays, `null`, Java objects, `Date`/`Map`/`Set`). |
| `HL7Message.isStrNum(v)` | `true` for `string` or `number`. |
| `HL7Message.isPositiveInteger(n)` | `true` when `n` is a positive integer (string or number). |
| `HL7Message.isRegExp(v)` | Realm-safe RegExp check (works across vm realms, unlike `instanceof`). |

```js
HL7Message.toJsPrimitive(5);            // 5
HL7Message.toJsPrimitive({ a: 1 });     // { a: 1 }
HL7Message.isPOJO({ a: 1 });            // true
HL7Message.isPOJO([]);                  // false
HL7Message.isStrNum('x');               // true
HL7Message.isPositiveInteger('3');      // true
HL7Message.isPositiveInteger('0');      // false
HL7Message.isRegExp(/x/);               // true

var parsed = HL7Message.parser('MSH|^~\\&|A\rPID|1');
parsed[1].field;   // '|'   (the encoding)
parsed[0][0][0];   // 'MSH' (segments[0] name)

HL7Message.assert(true, 'ok');  // no-op
HL7Message.assert(false, 'boom'); // throws Error('boom')
```

`arrayToHl7Path(arr)` (instance method) builds a path from `[seg, segIdx, field, fieldIdx, comp, sub]`:

```js
msg.arrayToHl7Path(['PID', 1, 5, 1, 2, 3]); // 'PID[1].5[1].2.3'
msg.arrayToHl7Path(['PID', 2]);             // 'PID[2]'
```

---

## 13. Gotchas

- **`rhinoLanguageVersion >= 180` is required.** The library uses `let` and object destructuring,
  which a default Mirth (`rhinoLanguageVersion = 0`) does not support. Raise it to `180`
  (VERSION_1_8) or `200` (VERSION_ES6). See [`docs/RHINO-COMPATIBILITY.md`](RHINO-COMPATIBILITY.md).
- **`toXML` is Mirth-only.** It needs Mirth's `XML` type and `SerializerFactory`; outside Mirth it
  throws `XML type not detected!`. Everything else (parse/get/set/delete/validate/diff/ACK/toString)
  works in plain Node.
- **Realm / Java safety is handled.** The library guards the `java` reference
  (`typeof java !== 'undefined' && val instanceof java.lang.Object`), uses `isPOJO`/`isRegExp`
  duck-typing instead of `instanceof`, and `Array.isArray`, so objects/arrays/RegExps from any realm
  work in `set`, `addRuleMatches`, and `findInSegment` without a `java` mock.
- **Reads never throw; they return `''`** for missing paths (and `getSegment` returns `undefined`).
  Don't rely on a thrown error to detect a missing field — check for the empty string.
- **`delete('SEG.f[n]')` does not renumber repetitions.** Deleting repetition 1 leaves repetition 2
  at index 2, which serializes as a leading empty repetition (`...||~617-555-0199`). Delete the whole
  field or rewrite the remaining repetition if you need to compact it.
- **Subcomponents live under their component.** In `A^Positive&strong`, the `&` detail is under
  component **2** (`OBX[3].5.2.1` / `.5.2.2`), not component 1.
- **`set` defaults to `autoResolve = false`; `get`/`getRange` default to `true`.** Pass the flag
  explicitly when you want a reference from `get` or a non-resolving `set`.
```
