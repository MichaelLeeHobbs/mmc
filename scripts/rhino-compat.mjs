#!/usr/bin/env node
/*
 * rhino-compat.mjs
 *
 * Runs the feature probe suite (scripts/rhino/probes.js) through Mirth
 * Connect's ACTUAL Rhino engine (rhino-1.7.13.jar, extracted from the Mirth
 * Docker image) at several Rhino language versions, then writes a Markdown
 * compatibility matrix to docs/RHINO-COMPATIBILITY.md.
 *
 * Why: this catches Rhino-only behavior (e.g. for-let scoping, template
 * literals, E4X) that Node/vitest tests cannot.
 *
 * Run:  node scripts/rhino-compat.mjs    (or: pnpm run rhino:compat)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ---------------------------- configuration ---------------------------- */

const MIRTH_VERSION = "4.5.2";
const MIRTH_IMAGE = `nextgenhealthcare/connect:${MIRTH_VERSION}`;
const JAR_NAME = "rhino-1.7.13.jar";
const JAR_PATH_IN_IMAGE = `/opt/connect/server-lib/${JAR_NAME}`;
const JDK_IMAGE = "eclipse-temurin:17-jdk";

// Rhino language versions to test (matrix columns).
//   0   = Context.VERSION_DEFAULT (Mirth's default rhinoLanguageVersion)
//   180 = VERSION_1_8
//   200 = VERSION_ES6
const VERSIONS = [0, 180, 200];

const VERSION_LABELS = {
  0: "v0 (default)",
  180: "v180 (1.8)",
  200: "v200 (ES6)",
};

/* ------------------------------- paths -------------------------------- */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rhinoDir = path.resolve(__dirname, "rhino");
const cacheDir = path.resolve(rhinoDir, ".cache");
const jarCachePath = path.resolve(cacheDir, JAR_NAME);
const docsDir = path.resolve(projectRoot, "docs");
const reportPath = path.resolve(docsDir, "RHINO-COMPATIBILITY.md");

/* ------------------------------- helpers ------------------------------ */

function log(msg) {
  process.stdout.write(`[rhino-compat] ${msg}\n`);
}

function docker(args, opts = {}) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
}

/* ------------------------- step 1: extract jar ------------------------ */

function ensureJar() {
  if (existsSync(jarCachePath)) {
    log(`Using cached ${JAR_NAME} at ${jarCachePath}`);
    return;
  }
  mkdirSync(cacheDir, { recursive: true });
  log(`Extracting ${JAR_NAME} from ${MIRTH_IMAGE} ...`);
  // Argument array (no shell) so Windows paths pass cleanly.
  docker([
    "run", "--rm",
    "-v", `${cacheDir}:/out`,
    "--entrypoint", "sh",
    MIRTH_IMAGE,
    "-c", `cp ${JAR_PATH_IN_IMAGE} /out/`,
  ], { stdio: ["ignore", "inherit", "inherit"] });
  if (!existsSync(jarCachePath)) {
    throw new Error(`Extraction reported success but ${jarCachePath} is missing`);
  }
  log(`Extracted ${JAR_NAME}`);
}

/* ------------------- step 2: stage java + probes ---------------------- */

function stageSources() {
  // Place RunProbes.java + probes.js next to the jar in the cache/work dir.
  copyFileSync(path.resolve(rhinoDir, "RunProbes.java"), path.resolve(cacheDir, "RunProbes.java"));
  copyFileSync(path.resolve(rhinoDir, "probes.js"), path.resolve(cacheDir, "probes.js"));
  log("Staged RunProbes.java + probes.js into cache/work dir");
}

/* ------------------- step 3: compile + run in JDK --------------------- */

function compileAndRun() {
  // The sh -c string runs INSIDE the container (not host), so /work paths are
  // safe. We pass the host mount via the Node arg array.
  const versionLoop = VERSIONS.join(" ");
  const innerScript =
    `set -e; cd /work; ` +
    `javac -cp ${JAR_NAME} RunProbes.java; ` +
    `for v in ${versionLoop}; do ` +
    `echo "===VERSION_START $v==="; ` +
    `java -cp ".:${JAR_NAME}" RunProbes probes.js "$v"; ` +
    `echo "===VERSION_END $v==="; ` +
    `done`;

  log(`Compiling + running probes at versions [${VERSIONS.join(", ")}] in ${JDK_IMAGE} ...`);
  const out = docker([
    "run", "--rm",
    "-v", `${cacheDir}:/work`,
    "-w", "/work",
    JDK_IMAGE,
    "sh", "-c", innerScript,
  ]);
  return out;
}

/* ------------------------- step 4: parse output ----------------------- */

function parseOutput(raw) {
  const lines = raw.split(/\r?\n/);
  // version -> { impl, fatal, results: Map<"cat\tfeature", {category,feature,status,detail,order}> }
  const byVersion = new Map();
  // global ordering of (category, feature) as first seen, for stable tables.
  const featureOrder = [];
  const featureOrderSeen = new Set();
  let impl = null;
  let currentVersion = null;

  for (const line of lines) {
    let m;
    if ((m = line.match(/^===VERSION_START (\-?\d+)===$/))) {
      currentVersion = Number(m[1]);
      byVersion.set(currentVersion, { impl: null, fatal: null, results: new Map() });
      continue;
    }
    if (line.match(/^===VERSION_END /)) {
      currentVersion = null;
      continue;
    }
    if (currentVersion === null) continue;
    const bucket = byVersion.get(currentVersion);

    const parts = line.split("\t");
    const tag = parts[0];
    if (tag === "IMPL") {
      bucket.impl = parts[1] || "";
      if (!impl) impl = bucket.impl;
    } else if (tag === "VERSION") {
      // informational; already keyed by version markers
    } else if (tag === "FATAL") {
      bucket.fatal = parts.slice(1).join("\t");
    } else if (tag === "RESULT") {
      const category = parts[1] || "";
      const feature = parts[2] || "";
      const status = parts[3] || "";
      const detail = parts.slice(4).join("\t") || "";
      const key = category + "\t" + feature;
      bucket.results.set(key, { category, feature, status, detail });
      if (!featureOrderSeen.has(key)) {
        featureOrderSeen.add(key);
        featureOrder.push({ category, feature, key });
      }
    }
  }

  return { byVersion, featureOrder, impl };
}

/* ------------------------- step 5: render report ---------------------- */

const STATUS_ICON = { YES: "✅", NO: "❌", PARTIAL: "⚠️" };

function iconFor(entry) {
  if (!entry) return "❔"; // unknown / not reported
  return STATUS_ICON[entry.status] || "❔";
}

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function buildReport({ byVersion, featureOrder, impl }) {
  const lines = [];
  const generatedNote = "`pnpm run rhino:compat` (scripts/rhino-compat.mjs)";

  lines.push("# Rhino Compatibility Report");
  lines.push("");
  lines.push(`- **Target:** Mirth Connect ${MIRTH_VERSION} (\`${MIRTH_IMAGE}\`)`);
  lines.push(`- **Rhino engine:** \`${JAR_NAME}\`, implementation version: \`${impl || "unknown"}\``);
  lines.push(`- **Generated by:** ${generatedNote}`);
  lines.push("- **JavaScript language version is configurable in Mirth.** `MirthContextFactory`");
  lines.push("  sets the Rhino `Context` language version from the server setting");
  lines.push("  **`rhinoLanguageVersion`**, which **defaults to `Context.VERSION_DEFAULT` (0)**.");
  lines.push("  ES6 syntax (e.g. `let`, object destructuring) requires raising it; set");
  lines.push("  **`rhinoLanguageVersion` to `200` (VERSION_ES6)** to enable the ES6 column below.");
  lines.push("");
  lines.push("Columns are Rhino language versions: **0 = VERSION_DEFAULT (Mirth default)**,");
  lines.push("**180 = VERSION_1_8**, **200 = VERSION_ES6**.");
  lines.push("");
  lines.push("Legend: ✅ supported / spec-correct · ⚠️ partial or non-spec behavior · ❌ not supported / throws");
  lines.push("");
  lines.push(
    "> **Scope caveat:** probes run against a bare Rhino scope (`ImporterTopLevel`, which provides " +
      "`importPackage`/`importClass`). This measures the **engine**: JavaScript syntax/semantics and the " +
      "standard library. Mirth additionally injects channel globals (`msg`, `connectorMessage`, `$c`, " +
      "`ChannelUtil`, the `userutil` classes, …) and its full server classpath — those are **not** measured " +
      "here. So the language/syntax rows are authoritative for Mirth; the Java-interop rows reflect only the " +
      "JDK + Rhino, not Mirth's added libraries.",
  );
  lines.push("");

  // Note any fatal failures per version.
  const fatals = [];
  for (const v of VERSIONS) {
    const b = byVersion.get(v);
    if (b && b.fatal) {
      fatals.push(`- **${VERSION_LABELS[v]}**: FATAL — ${b.fatal}`);
    }
  }
  if (fatals.length) {
    lines.push("> **Note:** one or more versions reported a top-level FATAL error:");
    lines.push(...fatals);
    lines.push("");
  }

  // Group features by category, preserving first-seen order within & across.
  const categories = [];
  const catSeen = new Set();
  for (const f of featureOrder) {
    if (!catSeen.has(f.category)) {
      catSeen.add(f.category);
      categories.push(f.category);
    }
  }

  for (const cat of categories) {
    lines.push(`## ${cat}`);
    lines.push("");
    lines.push(`| Feature | ${VERSIONS.map((v) => VERSION_LABELS[v]).join(" | ")} | Notes |`);
    lines.push(`| --- | ${VERSIONS.map(() => "---").join(" | ")} | --- |`);

    const featsInCat = featureOrder.filter((f) => f.category === cat);
    for (const f of featsInCat) {
      const cells = VERSIONS.map((v) => {
        const b = byVersion.get(v);
        const entry = b ? b.results.get(f.key) : null;
        return iconFor(entry);
      });

      // Build a Notes column: prefer the most informative non-empty detail,
      // annotating with the version it came from when versions differ.
      const note = buildNote(byVersion, f.key);

      lines.push(`| ${mdEscape(f.feature)} | ${cells.join(" | ")} | ${mdEscape(note)} |`);
    }
    lines.push("");
  }

  lines.push(...buildGotchas(byVersion));

  return lines.join("\n") + "\n";
}

function detailFor(byVersion, version, key) {
  const b = byVersion.get(version);
  if (!b) return null;
  const e = b.results.get(key);
  return e || null;
}

function buildNote(byVersion, key) {
  // Collect distinct details across versions; if a behavior differs by
  // version, annotate. Otherwise show a single detail.
  const seen = [];
  for (const v of VERSIONS) {
    const e = detailFor(byVersion, v, key);
    if (e && e.detail) {
      seen.push({ v, status: e.status, detail: e.detail });
    }
  }
  if (seen.length === 0) return "";

  // If all details identical, just show it once.
  const allSame = seen.every((s) => s.detail === seen[0].detail);
  if (allSame) return seen[0].detail;

  // Otherwise annotate per version label.
  return seen.map((s) => `${VERSION_LABELS[s.v]}: ${s.detail}`).join("; ");
}

/* --------------------------- gotchas section -------------------------- */

function statusAt(byVersion, version, key) {
  const e = detailFor(byVersion, version, key);
  return e ? e.status : null;
}

function detailAt(byVersion, version, key) {
  const e = detailFor(byVersion, version, key);
  return e ? e.detail : "";
}

function buildGotchas(byVersion) {
  const out = [];
  out.push("## Gotchas");
  out.push("");
  out.push("High-value warnings for script authors writing JavaScript in Mirth channels.");
  out.push("Remember that **Mirth defaults to `rhinoLanguageVersion = 0` (VERSION_DEFAULT)**,");
  out.push("so unless your administrator raised it, the **v0 column is what you actually get**.");
  out.push("");

  const K = {
    let: "Scoping\tlet declaration",
    objDestr: "Destructuring\tobject destructuring",
    arrDestr: "Destructuring\tarray destructuring",
    const: "Scoping\tconst declaration",
    block: "Scoping\tblock scoping (let does not leak)",
    forLet: "Scoping\tfor-let per-iteration binding (closure capture)",
    constLoop: "Scoping\tconst re-declared each loop iteration",
    forConstOf: "Scoping\tfor-const-of per-iteration const",
    tmpl: "Literals\ttemplate literal interpolation",
  };

  const icon = (v, k) => iconFor(detailFor(byVersion, v, k));

  // 1. let / const availability.
  out.push("### `let` / `const` availability and block scoping");
  out.push("");
  out.push(
    `- \`let\` is **${statusAt(byVersion, 0, K.let) === "YES" ? "available" : "NOT available"}** at v0 (default), ` +
    `${statusAt(byVersion, 180, K.let) === "YES" ? "available" : "not available"} at v180, ` +
    `and ${statusAt(byVersion, 200, K.let) === "YES" ? "available" : "not available"} at v200.`
  );
  if (statusAt(byVersion, 0, K.let) !== "YES") {
    out.push(`  - At v0, \`let\` fails: \`${detailAt(byVersion, 0, K.let)}\`. Use \`var\` unless \`rhinoLanguageVersion\` is raised.`);
  }
  out.push(
    `- \`const\` is **${statusAt(byVersion, 0, K.const) === "YES" ? "available" : "NOT available"}** at v0 (default).`
  );
  out.push(
    `- Block scoping (a \`let\` inside \`{ }\` not leaking out): v0 ${icon(0, K.block)}, v180 ${icon(180, K.block)}, v200 ${icon(200, K.block)}. ` +
    `Detail @v200: ${detailAt(byVersion, 200, K.block) || "n/a"}.`
  );
  out.push("");

  // 2. The headline loop gotchas.
  out.push("### Loops: `let`/`const` per iteration (the reported gotcha)");
  out.push("");
  out.push(
    `- **\`for (let i ...)\` closure capture:** v0 ${icon(0, K.forLet)}, v180 ${icon(180, K.forLet)}, v200 ${icon(200, K.forLet)}.`
  );
  for (const v of VERSIONS) {
    const d = detailAt(byVersion, v, K.forLet);
    if (d) out.push(`  - ${VERSION_LABELS[v]}: ${d}`);
  }
  out.push(
    `- **\`const\` re-declared each loop iteration** (\`for (var k...) { const c = k; }\`): ` +
    `v0 ${icon(0, K.constLoop)}, v180 ${icon(180, K.constLoop)}, v200 ${icon(200, K.constLoop)}.`
  );
  for (const v of VERSIONS) {
    const d = detailAt(byVersion, v, K.constLoop);
    if (d) out.push(`  - ${VERSION_LABELS[v]}: ${d}`);
  }
  out.push(
    `- **\`for (const x of ...)\`** per-iteration const: ` +
    `v0 ${icon(0, K.forConstOf)}, v180 ${icon(180, K.forConstOf)}, v200 ${icon(200, K.forConstOf)}.`
  );
  out.push("");

  // 3. Destructuring asymmetry.
  out.push("### Destructuring: array vs object differ at the default version");
  out.push("");
  out.push(
    `- **Array** destructuring (\`var [a,b]=[1,2]\`): v0 ${icon(0, K.arrDestr)}, v180 ${icon(180, K.arrDestr)}, v200 ${icon(200, K.arrDestr)}.`
  );
  out.push(
    `- **Object** destructuring (\`var {a}=o\`): v0 ${icon(0, K.objDestr)}, v180 ${icon(180, K.objDestr)}, v200 ${icon(200, K.objDestr)}.`
  );
  if (statusAt(byVersion, 0, K.arrDestr) === "YES" && statusAt(byVersion, 0, K.objDestr) !== "YES") {
    out.push(
      "  - **Surprise:** at the default v0, **array** destructuring works but **object** " +
      "destructuring does NOT. Authors targeting default Mirth must avoid `{ }` destructuring."
    );
  }
  out.push("");

  // 4. Template literals.
  out.push("### Template literals do not interpolate");
  out.push("");
  out.push(
    `- Template literal interpolation (\`\\\`\${x}\\\`\`): v0 ${icon(0, K.tmpl)}, v180 ${icon(180, K.tmpl)}, v200 ${icon(200, K.tmpl)}.`
  );
  for (const v of VERSIONS) {
    const d = detailAt(byVersion, v, K.tmpl);
    if (d) out.push(`  - ${VERSION_LABELS[v]}: ${d}`);
  }
  out.push(
    "  - **Do not rely on backtick `${...}` interpolation in Mirth.** Use string " +
    "concatenation (`'a' + x`) instead."
  );
  out.push("");

  return out;
}

/* --------------------------------- main ------------------------------- */

function main() {
  ensureJar();
  stageSources();
  const raw = compileAndRun();
  const parsed = parseOutput(raw);

  if (parsed.featureOrder.length === 0) {
    process.stderr.write("Raw output had no RESULT lines. Dumping raw output:\n");
    process.stderr.write(raw + "\n");
    throw new Error("No probe results parsed - see raw output above.");
  }

  mkdirSync(docsDir, { recursive: true });
  const report = buildReport(parsed);
  writeFileSync(reportPath, report, "utf8");
  log(`Wrote report: ${reportPath}`);
  log(`Rhino impl version: ${parsed.impl}`);
  log(`Probes: ${parsed.featureOrder.length} features across versions [${VERSIONS.join(", ")}]`);
}

main();
