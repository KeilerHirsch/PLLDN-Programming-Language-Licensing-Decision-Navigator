# Verification

Run `npm run verify` from a checkout. It runs typecheck, lint, repository policy
and the Node test runner with an 80% floor for lines, branches and functions in
`src/`. The policy check covers SPDX headers, exact pins, package integrity,
dependency license inventory and selected disclosure patterns. It is not a
general secret scanner.

CI additionally runs Gitleaks over Git history and npm audit for all dependencies.
A failed or unavailable required scanner is not a passing result. Windows and Linux
execute the same tests. A fixture artifact comparison checks cross-platform
deterministic snapshot bytes.

Reports are ignored working outputs. `npm run evidence` rejects missing or changed
source-tree bindings and exports the verification summary and per-file hashes. Test
reports include timing and are not expected to be byte-identical. Snapshot content
is the deterministic comparison subject.

## Current corpus scope

The test corpus covers Stage 0 contracts and snapshot trust, the Stage 1 deterministic
decision/facet core, and the Stage 2 candidate, promotion and reviewed-snapshot path.
Decision tests include hard constraints, all rule-effect classes, conservative UNKNOWN
handling, component scope isolation, conditional applicability, ordered conflicts,
Pareto behavior, ASK/abstention states, supersession drift and project-level license
decisions.
Facet tests verify that option counts use the same decision engine and do not mutate
canonical project facts. Stage 2 tests validate the 51-document candidate pack,
17 source records, exact license identities, volatile-version freshness, deterministic
candidate manifests and hash-bound human promotion. Reviewed-snapshot tests then prove
that the 52-document promoted snapshot reproduces exactly from the approved candidate
and review record, remains byte-stable across formatting, and is rejected without a
caller-supplied trusted manifest digest.

Passing these tests does not make the reviewed snapshot a general-purpose accuracy
claim. Before v0.0.1 Beta, release-specific suites still need broader reviewed knowledge,
high-risk gold/holdout cases, application-level E2E coverage and filter/free-text
equivalence once the optional text path exists.

## Test-first history

New decision and trust behavior is introduced with a failing test before production or
data changes. Stage 1 negative tests caught conditional non-applicability being misread
as negative evidence, constraints being consumed as facts, inactive rule evidence
leakage, conditional conflicts and unsafe supersession references.

Stage 2 tests caught evidence captured in the future relative to the test clock,
insufficient source support for a compound Rust claim, stale-world version semantics,
and formatter mutation of immutable reviewed snapshot bytes. The resulting boundaries
are now part of the regression corpus rather than undocumented assumptions.

AI review or automation can contribute evidence, but neither substitutes for source-backed
knowledge review, human accountability or separately protected runtime approval.
