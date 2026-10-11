<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# License substance audit A1 — GPL-2.0-or-later patent scope (2026-10-11)

**Review level:** manually cross-checked narrow editorial correction; **not** Reviewed evidence for the license, not legal advice, and **not** a completed audit of 32 editorial license profiles or 30 historic license claims.

**Baseline:** `main` at `e2782237f69c3ac45f5bad245f2a4878655e72a7`. Historical v0.1 snapshots, three seed matrices, Candidate-v0.2 records and existing Beta release are out of scope and unchanged.

## Finding A1 — incorrect unconditional editorial patent label

- **Object:** `license.gpl-2.0-or-later` in `src/product/license-decision-profiles.ts`, field `obligations.patent_grant`.
- **Prior Preview value:** `no`.
- **Problem:** The field was a blanket answer for an `-or-later` expression. GPLv2 does not contain the express contributor patent grant of GPLv3 §11, while GPLv3 does. Per GPLv3 §14 the recipient may select a later GPL version where that permission is given. Crucially, selecting GPLv3 does *not* automatically impose GPLv3 patent-license obligations on a distributor who conveyed the work under GPLv2 (FSF FAQ).
- **Conservative Preview correction:** `conditional` meaning **version and contributor dependent; not an assertion of a granted patent license**. Record `license_version_selected: UNKNOWN`. The GPLv2-only and GPLv3-only editorial fields remain `no` and `yes` respectively, where the labels only describe **express clauses**.
- **Secondary defect:** A bare “Patent grant: No” can be misread as a conclusion of zero patent rights; implied patent rights and actual contributor licenses are outside this narrow field. Product and comparison surfaces now explicitly warn that this is an express-license-text Preview classification, not patent clearance.
- **Versioned record:** `catalog/audit/license-patent-scope.v0.3.json` stores baseline, field, prior and corrected values, exact official sections, chosen-version UNKNOWN and verification limits. **It does not alter, review or promote the historical v0.1 records.**

### Authoritative source cross-check

1. [GNU GPL version 3 §11 — Patents](https://www.gnu.org/licenses/gpl-3.0.html#section11): affirmative express contributor patent license scoped to essential patent claims and contributor versions.
2. [GNU GPL version 3 §14 — Revised Versions](https://www.gnu.org/licenses/gpl-3.0.html#section14): for works specifying “or any later version”, allows following that version or later published versions.
3. [FSF GNU GPL FAQ, *v2OrLaterPatentLicense*](https://www.gnu.org/licenses/gpl-faq.html#v2OrLaterPatentLicense): “or later” does **not** automatically bind prior GPLv2 distributors to GPLv3 express patent-license obligations.

**Evidence limits:** The official web pages are linked by section but not content-hash-pinned. No work-specific notices, contributor patent ownership or actual selected version was verified. Do not promote to `Reviewed`. Different licenses and downstream combinations require fresh analysis; this is not a compatibility judgment.

### Reproduction / checks

- `node --test tests/license-patent-scope-v03.test.ts` — proves the new v0.3 evidence record matches the affected editorial field, compares GPLv2-only vs GPLv3-only, and checks caveats are visible in both product UI and comparison UI.
- `npm run verify` and actual browser/Windows/cross-platform/security/community GitHub gates required before merge.
- **Next:** cover each remaining `-or-later` license with source-specific qualifications; separately inspect AGPLv3 §13 network obligations, MPL 2.0 patent termination, EUPL network communication, PolyForm exceptions. Do not backfill fields by analogy. Language performance and complexity still require defined workload, compiler/runtime, target, and measurement rubric.
