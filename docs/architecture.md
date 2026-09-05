# Architecture

PLLDN separates untrusted authoring input, reviewed knowledge, canonical project
facts and deterministic decisions. Stage 0 established versioned schemas, strict
parsing, reference validation and the digest-bound snapshot trust boundary.
Stage 1 added the deterministic decision core. Stage 2 now has both a small
source-backed candidate pack and a human-reviewed immutable snapshot derived from
one exact candidate manifest.

The trust path remains layered: strict JSON parsing, schema validation, typed
references and scopes, candidate evidence review, human approval, immutable
snapshot generation, then separate runtime snapshot approval. The caller supplies
trusted manifest digests from a separately protected source. A candidate manifest,
source URL, human-review record or `Reviewed` label cannot approve runtime use by itself.

Snapshot verification returns knowledge documents only. Project facts and decision
traces remain separate inputs and outputs; neither can be smuggled into a knowledge
snapshot. No record URL is fetched and no data-supplied code runs.

## Decision core

Project facts describe what is known. Constraints describe what is required or
preferred. Rule conditions consume factual state only; a user preference cannot
masquerade as a fact and activate a rule.
Evaluation is component-scoped and deterministic:

1. validate project facts and reviewed knowledge references;
2. apply hard constraints and hard rule effects;
3. quarantine unresolved hard evidence instead of guessing;
4. compare surviving candidates by explicit preferences using Pareto dominance;
5. emit a typed decision state and evidence-bearing trace.

Decision states are `RECOMMEND`, `ALTERNATIVES`, `NEEDS_ONE_FACT`,
`INSUFFICIENT_INFORMATION`, `CONFLICT` and `UNSUPPORTED`. One unresolved question
can be surfaced explicitly; multiple unresolved dimensions cause abstention rather
than invented precision.

Rule effects are `EXCLUDE`, `REQUIRE`, `PREFER`, `PENALIZE`, `WARN`, `ASK` and
`NO_EFFECT`. Constraint strength and operators are explicit. There is no global
language ranking and no scalar "best language" score.

Conditional assertions that are not applicable do not become negative evidence.
Superseded assertions leave the active decision surface, while active rules may
not silently keep references to superseded claims or relations.

Facet previews clone canonical project facts, add one synthetic constraint and
run the same decision engine. Counts therefore cannot drift into a second, weaker
filtering implementation.
Stage 1 consumes project records with lifecycle `current` or `target` for active
decisions. Other lifecycle states remain representable by the contract but are not
decision-active in this slice.

## Candidate, review and immutable snapshot

Stage 2 candidate assertions remain `Partial`. Source records carry the official
reference, retrieval time and exact content SHA-256 fingerprint. Candidate
construction rejects embedded review records and any assertion that declares
itself `Reviewed`.

The first Stage 2 candidate was human-approved only after its exact manifest digest
was fixed. Promotion then produced 16 `Reviewed` assertions plus the human review
record in `reviewed.stage2-core.2026-09-05`. The checked-in snapshot must reproduce
byte-for-byte from that approved candidate and review record. `knowledge/reviewed/**`
is excluded from formatting so tooling cannot silently rewrite immutable bytes.

Runtime acceptance is a separate trust boundary. `verifySnapshot` still requires a
caller-supplied trusted digest, and the repository does not ship a default runtime
approval pin for this snapshot.

A browser UI, free-text accelerator, broader reviewed catalogue,
configuration/interaction optimization and release-grade end-to-end corpus are
later stages. The Stage 2 reviewed snapshot is not the v0.0.1 product release and
makes no general recommendation-accuracy or certification claim.
