<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# License substance audit A3 — MPL 2.0 / EUPL 1.2 disclosure scope (2026-10-11)

**Status:** targeted legal-text cross-check and Editorial Preview qualification. Not a legal opinion, not a Reviewed assessment, not a compatibility verdict.

**Baseline:** `main` at `2d73d09373f6c3db39f8feeaabc73fcf301718a3`.

## A3.1 — MPL-2.0: file-level disclosure is a distribution condition

**Existing fields:** `license.mpl-2.0` — `obligations.source_disclosure: file`, `rights.saas_hosting: yes`. These are coarse editorial categories, not unconditional compliance findings.

Mozilla's [normative MPL 2.0 text](https://www.mozilla.org/en-US/MPL/2.0/) §§1.4, 1.10 defines covered files and Modifications. §§3.1 and 3.2 require covered source to be made available to recipients when Covered Software is distributed, including executable form. §3.3 permits distribution of a Larger Work under chosen terms subject to MPL conditions for Covered Software, with extra conditions for Secondary Licenses. Mozilla's [issuer FAQ, Q8–Q11 and Q17](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) makes clear that merely providing server-side functionality over the web, without delivering a copy, is **not** distribution. Client-delivered source/JS is a different case.

**Defect:** “file” and “SaaS yes” without this distinction could be read as either an automatic source duty for hosted services or as exemption from all source duties in binaries and combined applications.

**Scoped correction:** Present a source-disclosure condition specific to `license.mpl-2.0` in its detailed card and license comparison, reusing the comparison CSV. Point `canonical_source` to the license steward's normative text instead of a secondary SPDX mirror. Do not revise historical candidate snapshots or change coarse scalar fields. Actual covered-file and combination boundaries are **UNKNOWN** until project facts are examined.

## A3.2 — EUPL-1.2: communication can include essential functionality

**Existing fields:** `license.eupl-1.2` — `obligations.source_disclosure: work`, `rights.saas_hosting: conditional`.

The [European Commission's official EUPL 1.2 text index](https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12) provides the 2017 official language versions. The [Commission-hosted English text](https://joinup.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt) contains Article 1's definition of Distribution or Communication, including making a Work's essential functionality available to another person. Articles 3 and 5 require source availability and applicable licence/notice/copy obligations when the Work is distributed or communicated. Article 5's compatibility route is expressly limited to a qualifying combined Derivative Work and a listed Compatible Licence in the Appendix. It does **not** prove every licence pair can be relicensed without constraints.

**Defect:** A short “work / conditional” label does not show that network access to essential functionality can count as Communication under this particular licence, unlike MPL's copy-delivery analysis.

**Scoped correction:** Show the applicable communication and derivative conditions with precise Article references in the EUPL editorial detail and comparison/CSV. Replace the secondary SPDX link with the Commission's official text index. Keep project-specific applicability, derivative status and combinations **UNKNOWN** until grounded.

## Machine-checkable record and verification limits

`catalog/audit/license-disclosure-scope.v0.3.json` contains exactly the two entities, retained scalar values, issuer URLs, qualifying conditions, section references, baseline and `EDITORIAL_PREVIEW_NOT_REVIEWED`. `tests/license-disclosure-scope-v03.test.ts` checks source parity, conditions, version status, exact entity allowlist, and presentation in the common comparison/CSV. A real Chromium smoke must also check both editorial card disclosures.

This neither modifies any of the 345 historical Seed-backed claims nor the 841 Unassessed-v0.2 profiles, historical v0.1 snapshots, Reviewed Decision Lab or Beta tag. No official source text bytes have been pinned. This is **not** proof that all rights/obligations of MPL/EUPL were reviewed, including patent limitations, jurisdiction, notices, time effects and downstream combination-specific compatibility.

**Required gates before merge:** Ubuntu, Windows, Chromium, Cross-platform replay, Security, Community. After squash merge separately verify `main` CI, Pages and release identity.
