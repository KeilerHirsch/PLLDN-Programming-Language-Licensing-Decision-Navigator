# Verification

Run `npm run verify` from a checkout. It runs typecheck, lint, repository policy
and the Node test runner with an 80% floor for lines, branches and functions in
`src/`. The policy check covers SPDX headers, exact pins, package integrity,
dependency license inventory and selected disclosure patterns. It is not a
general secret scanner.

CI additionally runs Gitleaks over Git history and npm audit for all dependencies.
A failed or unavailable required scanner is not a passing result. Windows and
Linux execute the same tests. A fixture artifact comparison checks
cross-platform deterministic snapshot bytes.

Reports are ignored working outputs. `npm run evidence` rejects missing or
changed source-tree bindings and exports the verification summary and per-file
hashes. Test reports include timing and are not expected to be byte-identical.
Snapshot content is the deterministic comparison subject.

## Current corpus scope

The test corpus now covers Stage 0 contracts, references, snapshot trust and the
Stage 1 deterministic decision/facet core. Decision tests include hard
constraints, all rule-effect classes, conservative UNKNOWN handling, component
scope isolation, conditional applicability, ordered conflicts, Pareto behavior,
ASK/abstention states, supersession drift and project-level license decisions.

Facet tests verify that option counts use the same decision engine and do not
mutate canonical project facts. Synthetic fixtures remain deliberately small;
they are tests of semantics, not claims about real programming languages or
licenses.

Before v0.0.1 Beta, release-specific suites still need the frozen reviewed
candidate knowledge base, high-risk gold/holdout cases, application-level E2E
coverage and filter/free-text equivalence once the optional text path exists.
Stage 1 passing alone does not satisfy the product release gate.

## Test-first history

New decision behavior is introduced with a failing test before production code.
Stage 1 negative tests caught several semantics bugs before promotion, including
conditional non-applicability being misread as negative evidence, constraints
being consumed as facts, inactive rule evidence leakage, conditional conflicts,
and unsafe supersession references.

The implementation was then split into focused assessment, constraint, rule,
ranking, knowledge and orchestration modules while the full corpus remained the
regression boundary. AI review or automation is useful evidence, but is not a
substitute for source-backed knowledge review or human accountability.
