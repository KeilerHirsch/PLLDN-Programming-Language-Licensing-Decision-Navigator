<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Identity index: breadth without invented claims

PLLDN maintains **two deliberately separate catalogue levels**.

1. **Detailed editorial Preview profiles:** 35 programming languages and 32 licenses, with qualitative editorial guidance; these are not Reviewed recommendations.
2. **Additional identity-only entries:** Names and official/source-linked identifiers in `src/product/identity-index.ts`. They carry **no** speed/complexity bands, rights, obligations, license compatibility, or suitability claims. They are not automatically added to the Candidate claim graph or Reviewed runtime.

The list is intended for **discovery, not legal or engineering decisions**. Its source's word "programming" is GitHub Linguist's classification, not a quality or fitness judgment. The subset is curated for navigability; it is not a complete enumeration of all languages.

## Pinned snapshots

- **GitHub Linguist:** `5fbdfcb8133be2bed88bf3ce62b2335f50474525`, [languages.yml](https://github.com/github-linguist/linguist/blob/5fbdfcb8133be2bed88bf3ce62b2335f50474525/lib/linguist/languages.yml), only entries marked `type: programming` in that snapshot.
- **SPDX License List:** `31ba1a50e5397e00a304dbadc76531740e89ee48`, [licenses.json](https://github.com/spdx/license-list-data/blob/31ba1a50e5397e00a304dbadc76531740e89ee48/json/licenses.json), version **3.29.0**. The identity index now contains **all 708 nondeprecated SPDX license IDs** in this snapshot, including entries without the upstream `isOsiApproved` flag. This flag is displayed verbatim; lack of it is not an independent legal conclusion. SPDX/OSI identification is not a PLLDN legal analysis.

### Offline, repeatable import

`catalog/identity-selection.json` fixes the curated language names, SPDX version, source commit hashes, and exact upstream Git blob hashes. `catalog/identity-data.json` is the compact checked-in output. `tools/import-identity-sources.ts` regenerates this output deterministically, **without network access**.

Download the two source files from the immutable commit-specific URLs above (not the mutable `main` branch), then run:

```sh
npm run catalog:import -- --check --linguist /path/to/languages.yml --spdx /path/to/licenses.json
npm run catalog:import -- --write --linguist /path/to/languages.yml --spdx /path/to/licenses.json
```

The importer checks each file's Git blob hash, verifies selection and SPDX version, rejects missing/duplicate identities or invalid SPDX references, and omits deprecated SPDX IDs. `--check` must reproduce the checked-in JSON bytes exactly; `--write` updates only the generated JSON data. The import never changes the Reviewed knowledge, Candidate claims, or hand-authored qualitative scores. Source URLs remain pinned until a deliberate, separately reviewed update.

In this version: **167 curated Linguist identities, 708 active SPDX identities; 159 and 682 remain index-only** after existing detailed profiles are subtracted. That means **194 distinct language identities and 714 distinct license identities** shown across both layers, *not* 194 and 714 completed profiles.

The exported `INDEX_ONLY_*` arrays exclude any identities already represented by detailed profiles. When a profile is created, it automatically disappears from the corresponding index-only view; the original pinned source record remains available.

## Data integrity rules

- Imported identity records are never promoted into `knowledge/reviewed` or given default `TRUE` claims.
- No generated `performance`, `rights`, `obligations`, or `compliance_complexity` values.
- The UI uses compact, clearly labeled index-only entries, distinct from detailed profile cards.
- Text search spans the profiled catalogue and index-only entries. Structured capability/license filters apply **only to detailed profiles**, because index-only items lack assessed values.
- The index-only panel reveals **60 entries per page** with an explicit “Show more” button. Text search runs across the full underlying list before pagination; its result counter distinguishes total matches from visible entries.
- The license index can filter by the **OSI-approved flag in the pinned SPDX snapshot**. This is not a legal classification by PLLDN, and cannot be applied to hand-authored profile ratings.
- `tests/identity-index.test.ts` checks uniqueness, provenance and non-overlap with rated profiles; the Chromium smoke suite verifies discovery and links.

## Later stages

A subsequent batch can import more identities from updated pinned snapshots or selectively promote individual entries into **editorial** profiles. Only after breadth, schema and workflows have stabilized should a full primary-source and case-law/legal-interpretation audit start. Existing Reviewed boundaries must remain intact throughout.

Do not imply that an identity is safe, fast, licensed compatibly, or appropriate for a use case merely because a source catalogue lists it.
