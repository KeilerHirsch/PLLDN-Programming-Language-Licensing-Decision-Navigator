# ADR 0003 — Stage 2 candidate knowledge and human promotion

Status: Accepted for the Stage 2 candidate slice.

## Decision

Real-world knowledge enters PLLDN as a candidate pack whose assertions are
`Partial`. Candidate records may include source fingerprints, entities,
dimensions and assertions, but may not embed a review record or declare an
assertion `Reviewed`.

A separate human review record binds the exact candidate manifest SHA-256 and
must explicitly cover every assertion with at least one regression reference.
Promotion injects those references, changes approved assertions to `Reviewed`,
adds the review record and creates a distinct reviewed manifest.

The reviewed manifest is still not self-trusting. Runtime snapshot acceptance
continues to require a trusted manifest digest supplied outside candidate data.

## Initial candidate scope

The first pack contains Rust, Go, Python and TypeScript plus EUPL-1.2, MIT,
Apache-2.0, MPL-2.0 and exact GPL/AGPL 3.0 only/or-later identities. Claims are
intentionally narrow and source-backed. No global language ranking or license
compatibility relation is introduced in this slice.

## Consequences

The repository can curate real data before approval without leaking it into the
trusted decision surface. Human review becomes explicit and replayable, while
factual correctness remains a review responsibility rather than a hash property.
