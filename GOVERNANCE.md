# Governance

KeilerHirsch maintains the repository. Public discussions use GitHub issues and PRs.
Evidence resolves factual disputes; vote counts do not establish truth.

## Authority

The maintainer controls scope and releases. Contributors and bots may propose changes.
Bots cannot approve or merge their own proposals. A review status in candidate data
is not permission to load it as trusted knowledge.

Risk tiers:
- Low: editorial or alias corrections. Check ambiguity regressions.
- Medium: entity metadata. Verify identity and scope.
- High: capability claims. Require scoped primary evidence and reproducible tests.
- Very high: hard exclusions and security, safety or license obligations.
  Require appropriate domain evidence and independent human review.

Record contested claim IDs, competing evidence, resolution, rationale, scope,
reviewer and a reopening condition. New evidence may supersede a prior resolution.
Released snapshots are never silently edited.

## Initial ownership

There is initially one maintainer. CODEOWNERS routes review; it does not prove
independence. The owner cannot count self-review as independent human review.
The initial repository foundation may be bootstrapped by its owner. The current
Reviewed runtime snapshot covers only the explicitly approved decision-lab scope;
it does not confer Reviewed status on the broader Preview catalogue.

The active main ruleset requires pull requests and named status checks, but zero
approving reviews. Passing automation does not establish independent human review.
Administration changes and emergency exceptions must be recorded; do not claim
protection against a repository administrator who can change the rules.

## Published history

As observed on 2026-10-10, immutable Beta 1 tag `v0.0.1-beta.1` points to
`151fd12`, which is not an ancestor of current main (`d1b04c0`). Some earlier
documentation is absent from current main but remains public through historical
GitHub references. The cause, authorization route and exact intent of the
divergence have not been established. Removing a file from main does not retract
previously published history.

## Funding

Use is free. Voluntary GitHub Sponsors and Ko-fi donations confer no feature
entitlement, ranking influence or approval authority.

## Automation authority

Bots cannot approve, merge or promote their own proposals. Community workflows are
read-only advisory tooling: they may emit freshness candidates, classify changed paths
and publish job summaries or artifacts, but they cannot create Reviewed assertions,
change runtime approval digests, write branches, label issues or PRs, or mutate review
state.

A bot-produced report is evidence about what automation observed, not authority over the
underlying claim. Human review, immutable promotion and runtime approval remain separate
steps with their existing controls.
