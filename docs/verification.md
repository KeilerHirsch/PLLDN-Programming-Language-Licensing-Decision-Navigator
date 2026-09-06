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
and explicit browser-build tests cover deterministic comparison subjects.

## Current corpus scope

The corpus now covers Stage 0 contracts and snapshot trust, the Stage 1 deterministic
decision/facet core, Stage 2 candidate/promotion/reviewed snapshot, Stage 3 browser
portability/canonical UI facts/runtime trust, and Stage 4 product-facet provenance,
bounded text normalization/rules/analyzer, manual-text equivalence and safe local UI
integration.
Decision tests include hard constraints, all rule-effect classes, conservative UNKNOWN
handling, component scope isolation, conditional applicability, ordered conflicts,
Pareto behavior, ASK/abstention states, supersession drift and project-level license
decisions. Facet tests verify that option counts use the same decision engine and do not
mutate canonical project facts.

Stage 2 tests validate the 51-document candidate pack, 17 source records, exact license
identities, volatile-version freshness, deterministic candidate manifests and hash-bound
human promotion. Reviewed-snapshot tests prove that the 52-document promoted snapshot
reproduces exactly from the approved candidate and review record, remains byte-stable
across formatting, and is rejected without a caller-supplied trusted manifest digest.

Stage 3 tests additionally prove that schema portability preserves the exact schema
digest, UI selections become deterministic `ui.facet.*` constraints, foreign project
constraints survive UI changes, controller counts/results match `facetCounts()` and
`evaluateDecision()`, sort changes presentation only, and runtime bootstrap reuses
`verifySnapshot()` with fail-closed behavior for absent, wrong or tampered approval.
The browser build is run twice and required to produce byte-identical static outputs
without `node:` imports, `readFileSync` or synthetic recommendation fixtures.

Stage 4 tests additionally prove exact product-facet provenance, strict rule-set references,
16 KiB UTF-8 input bounds, NFKC/source-span preservation, deterministic English/German
gold-corpus behavior, correct zero-match/ambiguity/conflict abstention, same-target dedupe,
no Stage-4 network or dynamic-code surface, and explicit confirmation only through the
existing facet path. The central equivalence test requires canonical project serialization
and material decision state/trace to match equivalent manual facet selection.

Passing these tests does not make the reviewed snapshot a general-purpose accuracy
claim. Before v0.0.1 Beta, release-specific suites still need broader reviewed knowledge,
high-risk holdout cases and application-level E2E coverage beyond the deliberately small
Stage 4 deterministic phrase surface.

## Test-first history

New decision and trust behavior is introduced with a failing test before production or
data changes. Stage 1 negative tests caught conditional non-applicability being misread
as negative evidence, constraints being consumed as facts, inactive rule evidence
leakage, conditional conflicts and unsafe supersession references.

Stage 2 tests caught evidence captured in the future relative to the test clock,
insufficient source support for a compound Rust claim, stale-world version semantics,
and formatter mutation of immutable reviewed snapshot bytes.

Stage 3 RED tests began with the Node filesystem dependency in validation, missing
canonical UI constraint handling, missing controller/model modules, absent runtime trust
and DOM boundaries, and a nonexistent browser build. The resulting production code is
therefore constrained by regression tests rather than retrospective UI snapshots.

Stage 4 RED tests began with missing product facets/rule loader/normalizer/analyzer and
confirmation/UI modules. The gold corpus then caught overlapping short GC phrases that
would have produced a false confident secondary mapping inside a memory-safety statement;
the declarative rules were narrowed instead of adding hidden longest-match precedence.

AI review or automation can contribute evidence, but neither substitutes for source-backed
knowledge review, human accountability or separately protected runtime approval.
