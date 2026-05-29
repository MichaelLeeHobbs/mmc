---
name: 🔐 CVE / security vulnerability report
about: Track one or more CVEs (e.g. from a Docker Scout / image scan) for remediation.
title: "[CVE]: <image or component> — <N> findings"
labels: ["security", "vulnerability"]
---

<!--
Keep it tight — just the facts needed to fix it. One row per CVE in the table.
Use the optional Details/Notes section ONLY for CVEs that need a note (no fix yet,
mitigation, false positive). Delete any section you don't use.
Tip for Docker Scout: `docker scout cves <image> --only-severity critical,high --only-fixed`
keeps the list short and fixable.
-->

## Scan

|             |                                                                 |
|-------------|-----------------------------------------------------------------|
| **Target**  | `<image:tag or repo/component>`                                 |
| **Scanner** | `<tool + version>` <!-- e.g. Docker Scout 1.x -->               |
| **Date**    | `<YYYY-MM-DD>`                                                  |
| **Filter**  | `<e.g. severity ≥ High; base-image vulns excluded; fixed only>` |

**Totals:** 🔴 Critical `0` · 🟠 High `0` · 🟡 Medium `0` · ⚪ Low `0` — **fix available for `0/0`**

## Findings

| CVE                                                               | Sev | CVSS | Package | Installed | Fixed in | Exploit |
|-------------------------------------------------------------------|-----|------|---------|-----------|----------|---------|
| [CVE-0000-00000](https://nvd.nist.gov/vuln/detail/CVE-0000-00000) | 🔴  | 0.0  | `pkg`   | `0.0.0`   | `0.0.0`  |         |

<!--
Sev: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low
Fixed in: the first non-vulnerable version, or `none` if no fix is published yet.
Exploit: `KEV` (on CISA's Known Exploited list) or `PoC` (public exploit) — leave blank otherwise. Triage these first.
-->

## Remediation

Group fixes by the change that resolves them (usually a single package bump):

- [ ] Upgrade `<pkg>` `<installed>` → `<fixed>` — resolves CVE-…, CVE-…
- [ ] Rebuild on updated base image `<base:tag>` — resolves CVE-…
- [ ] No fix available — mitigate or accept-risk (see Notes) — CVE-…

## Notes <!-- optional; delete if empty -->

<details>
<summary>Per-CVE notes</summary>

- **CVE-0000-00000** — <one line: impact in this context, fix path, mitigation, or why it's a false positive>

</details>
