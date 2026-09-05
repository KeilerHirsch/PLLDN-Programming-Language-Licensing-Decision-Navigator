# Verification

Run npm run verify from a checkout. It runs typecheck, lint, repository policy and
the Node test runner with an 80% floor for lines, branches and functions in src/.
The policy check covers SPDX headers, exact pins, package integrity, dependency
license inventory and selected disclosure patterns. It is not a general secret scanner.

CI additionally runs Gitleaks over Git history and npm audit for all dependencies.
A failed or unavailable required scanner is not a passing result.
Windows and Linux execute the same tests. A fixture artifact comparison checks
cross-platform deterministic snapshot bytes.

Reports are ignored working outputs. npm run evidence rejects missing or changed
source-tree bindings and exports the verification summary and per-file hashes.
Test reports include timing and are not expected to be byte-identical.
Snapshot content is the deterministic comparison subject.

## Corpus scope

Current tests cover contracts, references, snapshots and the candidate trust boundary.
The extraction, decision and application E2E suites are not implemented.
Before v0.0.1, those suites must establish the frozen release's high-risk cases,
deterministic decisions, full traces, ambiguity handling and filter/text equivalence.
Stage 0 passing does not satisfy the product release gate.

## Test-first history

The initial tests ran against explicit unimplemented stubs before implementation.
An independent AI code review then reproduced three graph-boundary omissions.
Regression cases were added before fixing project conditions, endpoint scopes and
the separation of knowledge from analysis traces. AI review is not human approval.
