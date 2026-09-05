# ADR 0002: Deterministic Stage 1 decision core

Status: Accepted for Stage 1 implementation.

## Context

PLLDN needs a decision path that can later serve both manual facets and optional
text-assisted input without letting either path invent facts. Stage 0 already
provides strict project, knowledge, rule, trace and snapshot contracts.

## Decision

Canonical project facts are authoritative. Plain facts and user constraints are
separate record kinds: facts describe known state; constraints express required
or preferred outcomes. Rule conditions may inspect facts, never constraints.

Constraint satisfaction happens before ranking. `MUST` and `FORBIDDEN` are hard;
`PREFER` and `AVOID` participate in project-scoped Pareto comparison; `NEUTRAL`
has no decision effect. There is no scalar universal candidate score.

Supported comparison operators are `EQ`, `NEQ`, `IN`, `GTE` and `LTE`, with
operator/value compatibility validated against the dimension contract.

Rules use explicit effects: `EXCLUDE`, `REQUIRE`, `PREFER`, `PENALIZE`, `WARN`,
`ASK` and `NO_EFFECT`. Rule ordering does not create hidden precedence.

UNKNOWN is not FALSE. Missing hard evidence quarantines a candidate or causes an
abstaining decision state. One explicitly askable missing dimension becomes
`NEEDS_ONE_FACT`; broader uncertainty becomes `INSUFFICIENT_INFORMATION`.

Conditional claims and facts apply only when their conditions are established.
A false prerequisite makes the assertion inapplicable; it does not manufacture
negative evidence. Component facts are isolated from sibling components.

Supersession is fail-closed on the active decision surface. Claim supersession
preserves entity and dimension, and an active rule may not reference a
superseded claim or relation without being updated itself.

Facet previews do not implement separate filtering semantics. They clone the
project, add a temporary constraint and run the same decision core to obtain
eligible, excluded and unresolved counts.

## Consequences

The engine may return alternatives or abstain more often than a heuristic
recommender. That is intentional. Traceability and low false-confidence risk are
preferred over answer rate.

This ADR does not approve a real-world knowledge catalogue, UI, free-text parser
or v0.0.1 release. Those remain separate reviewed stages.
