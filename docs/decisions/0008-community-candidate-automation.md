# ADR 0008: Read-only community candidate automation

Status: Accepted for Stage 5B.

## Context

Stage 5A made a narrowly approved Reviewed projection available through verified GitHub
Pages. Stage 5B needs community-maintenance help without creating a second factual,
review, promotion or repository-write authority plane.

The useful automation surfaces are intentionally different:

- volatile Reviewed claims need deterministic reminders when expiry is due or passed;
- dictionary/alias proposals need structured candidate intake;
- pull requests benefit from deterministic classification of touched review surfaces.

None of those needs automated factual discovery, autonomous rule generation, repository
mutation or bot approval.

## Decision

Freshness maintenance consumes checked-in Reviewed bytes, explicit evaluation time and an
explicit review horizon. It reports only `EXPIRED` or `REVIEW_DUE` candidates from existing
`valid_until` metadata. It does not fetch sources or infer replacement values.
Dictionary issues are untrusted proposals. Exact phrase/locale/target/provenance and
positive/negative examples are collected, but no issue field is executable and no
submission edits the Stage 4 rule set.

PR assistance runs trusted base-branch tooling. The PR head is fetched only so Git can
produce a changed-path list. The classifier consumes those paths, may emit overlapping
review classes and companion-evidence hints, and never emits an approval decision.

The Community workflow remains globally `contents: read`. It may publish job summaries
and artifacts, but cannot create issues/comments, label, push, merge, promote knowledge or
change runtime approvals. Human review remains the authority boundary.

## Consequences

This design deliberately gives up autonomous source discovery and automated contribution
mutation. A maintainer still has to research replacement facts and review any proposed rule
change. In return, untrusted issue/PR content does not acquire execution or write authority.

GitHub App/repository-read integration is not part of this ADR and remains behind the
optional Stage 5C architecture gate. Stage 6 remains the first `v0.0.1 Beta` release stage.
