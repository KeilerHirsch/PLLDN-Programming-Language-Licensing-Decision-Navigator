# PLLDN Preview provenance audit — 2026-10-11

**Scope:** The immutable-in-practice historical candidate pack at
`knowledge/candidate/catalog-2026-10-03`. This is a **source/provenance
triage**, not the promised claim-by-claim technical or legal content review.

## Reproduce the finding

From repository root with the pinned Node/npm environment:

```sh
npm ci --ignore-scripts
npm run audit:preview-provenance
npm run audit:preview-provenance -- --claims
npm run verify
```

The command lists every claim ID, entity ID, dimension, Preview status,
source ID, and test reference. The default output is a compact JSON summary;
`--claims` includes the full, deterministically ordered 345-record backlog.

## Initial audit result

| Observation | Count | What it means |
| --- | ---: | --- |
| Historical structured candidate Preview claims | 345 | 315 language, 30 license |
| Claims citing only the repository's own classification seed matrices | 345 | **No independent primary source is attached at claim level** |
| Distinct seed source documents | 3 | Blocks 1, 2, 3, all classified `community` |
| Seed documents with SHA-256 verified against local checked-in bytes | 3 | Provenance integrity, **not** factual truth |
| Internal seed links using mutable GitHub `blob/main` paths | 3 | URL target is not itself pinned; only checked-in SHA is pinned |
| Claims with recorded reproducible test references | 0 | Cannot infer validation from an empty test list |
| Independently verified claims in this automatic audit | 0 | The machine report **does not** perform primary-source fact-checking |

The checked-in matrices themselves explicitly state they are coarse and not
Reviewed evidence. The 35 qualitative language decision profiles and 32
editorial license profiles are a **separate** Preview surface, not included
in the 345 claim count. Their language performance/complexity bands and
license-right summaries need their own per-assertion validation. A link to
SPDX terms does not by itself substantiate every derived permission,
obligation, SaaS, or business-risk classification.

## Narrow manual primary-source cross-checks (not a Reviewed promotion)

The following texts can ground *specific* future assertions, **not** the
entire respective profile. No historical source record or evidence digest
has been silently replaced.

- **Apache-2.0, explicit patent clause:** Section 3 of the Apache Software
  Foundation's own [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
  expressly grants a patent license and includes a litigation termination
  rule. This corroborates the **narrow** presence of an express patent grant,
  not the license's compatibility with other licenses.
- **MIT, copyright/notice requirement:** The
  [OSI MIT license text](https://opensource.org/license/mit) includes
  an obligation to reproduce the copyright and permission notices.
  The current Editorial Preview label `notice: yes` is directionally
  consistent, but the exact downstream scope still needs case-specific
  interpretation. This does **not** establish an express patent grant.
- **GPLv3, explicit patent licensing:** The
  [FSF GPLv3 rationale](https://gplv3.fsf.org/gpl-rationale-2006-01-16.html)
  explains why GPLv3 added express patent licensing in its Section 11.
  Check actual applicable license text and the precise -only/-or-later
  scope before a Reviewed decision.

## Ordered next steps

1. **P0 — Evidence lineage:** For each of the 345 candidate claim IDs,
   attach a claim-specific normative/vendor text with an immutable revision
   or hash, exact version/target and page/section. Replace coarse seed-only
   provenance in a **new versioned pack**, without rewriting the historical
   matrices or declaring their statements Reviewed.
2. **P0 — License substance:** Audit every permission, patent, notice,
   commercial use, SaaS/network and disclosure field against canonical
   license texts. Track unresolved ambiguities and qualify context-dependent
   rights; avoid a compatibility verdict without separate evidence.
3. **P1 — Language substance:** Audit compiler/runtime/toolchain qualifiers
   and execution variants per language/version/platform. Qualitative speed,
   complexity and ecosystem bands require a documented evaluation rubric,
   reproducible workload or explicit editorial-only framing.
4. **P1 — Evidence presentation:** Make seed-vs-primary distinction clearly
   visible where evidence counts and comparison drilldowns appear. Never
   display “1 source” as a claim of external verification.
5. **Release gate:** First complete remediation and full CI/security/replay;
   then define a **new** release identity rather than reusing the hard-pinned
   `v0.0.1-beta.1` workflow, policy, asset list or tag. Independently
   validate checksum, SBOM, tar reproducibility and actual GitHub assets.

**Non-goals:** New permissions, ranked suitability judgments, Reviewed
promotion, mutating the old Beta tag or claiming a completed legal audit.
