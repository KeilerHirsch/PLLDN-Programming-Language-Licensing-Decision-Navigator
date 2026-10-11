# Candidate identity profiles v0.2

This is a **new parallel structural catalogue**, not a migration or
replacement of historical Candidate v0.1 snapshots, manifests or replays.

Run `node tools/build-unassessed-candidates.ts --check` to verify the
generated file against pinned Linguist/SPDX data and current editorial
overlap. Run `--write` only when intentionally regenerating.

Only *index-only* identities are emitted: currently 159 languages and 682
active SPDX license IDs. IDs are stable: case-folded UTF-8 hex for Linguist
language names; case-folded SPDX license identifiers for licenses.
Source commits and blob SHA pins are retained. The SPDX-supplied OSI flag
is upstream identity metadata, not an independent legal conclusion.

All qualitative fields are `UNKNOWN`; no claims, rights, compatibility
judgments, performance ratings, or Reviewed promotions are generated.
Curated evidence and explicit review must remain in a separate pipeline.
The historical 345 editorial Candidate claims remain unchanged.
