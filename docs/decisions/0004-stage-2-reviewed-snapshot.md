# ADR 0004 - Stage 2 human-reviewed snapshot

Status: Accepted.

## Context

The first Stage 2 candidate pack remained `Partial` until its 16 assertions were
individually checked against captured source bytes and the complete candidate manifest
was presented for explicit human approval.

The approved candidate manifest SHA-256 is:

`4e5248d930fc592fe95a7dd03bd7bfd26e2c4ba619c291ebd71820b63864544f`

Any candidate-content change produces a different manifest and invalidates that approval.

## Decision

The approved candidate is promoted through the deterministic promotion function into
`reviewed.stage2-core.2026-09-05`. The snapshot retains the human review record and
contains 16 assertions marked `Reviewed` with regression references.
The reviewed manifest SHA-256 at this decision point is:

`a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`

Immutable reviewed files under `knowledge/reviewed/**` are excluded from repository
formatting. A regression test rebuilds the snapshot from candidate plus review and
requires byte-for-byte equality with the checked-in materialization.

Human knowledge review does not grant runtime trust. `verifySnapshot` still requires a
trusted manifest digest supplied by its caller, and the repository's default trusted
snapshot list remains empty. This avoids candidate-controlled or repository-local
self-approval of runtime knowledge.

## Consequences

The repository now contains a small human-reviewed knowledge snapshot, but it is not a
v0.0.1 Beta release and does not claim broad ecosystem coverage or general recommendation
accuracy. Corrections or refreshed volatile facts require a new candidate, review and
snapshot instead of silently rewriting this snapshot.
