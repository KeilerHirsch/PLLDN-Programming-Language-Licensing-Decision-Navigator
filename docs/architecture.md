# Architecture

PLLDN separates untrusted authoring input, reviewed knowledge, canonical project
facts and deterministic decisions. Stage 0 established versioned schemas, strict
parsing, reference validation and the digest-bound snapshot trust boundary.
Stage 1 added the deterministic decision core. Stage 2 added a small source-backed
candidate pack and a human-reviewed immutable snapshot derived from one exact
candidate manifest. Stage 3 added the first framework-free browser UI over those
same contracts and decision semantics. Stage 4 adds a bounded local deterministic
text accelerator whose output is presentation-only until explicitly confirmed. Stage 5A
adds a deployment-specific verified GitHub Pages runtime path without changing the core
runtime-trust contract.

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
filtering implementation. Stage 1 consumes project records with lifecycle `current`
or `target` for active decisions.
## Browser UI boundary

Stage 3 keeps the browser surface intentionally thin. Repository JSON Schemas remain
statically imported through `src/validation/schema-set.ts`. Pinned AJV tooling generates
a checked-in standalone validator set from those same schemas, and both Node and browser
runtime validation consume those precompiled functions. Browser-reachable validation
therefore preserves the schema digest without `node:fs` or AJV runtime code generation.

Facet selections are converted into deterministic `ui.facet.*` constraints inside
canonical project facts. Clearing or changing a facet touches only its own UI-owned
constraint; imported or user-authored facts and constraints remain intact. Same-facet
option previews remove only that facet's current UI-owned selection before calling
`facetCounts()`, which preserves real cross-facet and foreign conflicts.

`src/ui/controller.ts` orchestrates `evaluateDecision()` and `facetCounts()`; it does
not compute independent eligibility, exclusions or recommendations. Sorting and labels
are presentation-only projections. `src/ui/render.ts` uses DOM content APIs rather than
HTML interpolation for knowledge-derived text.

The static browser build is produced with pinned `esbuild-wasm` into ignored
`.build/site/`. The bundle contains no default project, synthetic recommendation corpus
or trusted snapshot pin. `bootstrapUiRuntime()` requires caller-supplied runtime material
and sends it through the existing `verifySnapshot()` boundary before a controller exists.
Missing, wrong or tampered trust input therefore renders an unavailable state instead of
recommendations.

## Deterministic free-text accelerator

Stage 4 keeps filters authoritative. `src/text/normalize.ts` performs bounded 16 KiB
UTF-8 input validation, NFKC normalization, locale-independent lowercase handling and
Unicode letter/number tokenization while preserving original UTF-16 source spans.
`text-rules/stage4-core.json` contains only schema-validated literal token patterns and
reviewed aliases; it exposes no regex, executable expression, provider prompt or user-code
surface.

Production text rules target only the checked-in product facets derived from already
Reviewed Stage 2 boolean dimensions. `src/text/analyze.ts` performs exact contiguous
matching, deterministic deduplication and explicit `PROPOSED`, `AMBIGUOUS` or
`CONFLICTING` projection. Unsupported text is allowed to produce no proposal. There is
no LLM, embedding, fuzzy semantic similarity, statistical classifier, network inference
or direct text-to-decision path.

Raw text and analysis results remain outside canonical project facts. Only a user-confirmed
`PROPOSED` item delegates to the existing `UiController.selectFacet()` path. The primary
Stage 4 invariant is that confirming text proposals for a set of facet options produces
byte-equivalent canonical project state and the same material decision trace as selecting
those facets manually. Clearing or reanalyzing text changes analysis state only.

## Verified GitHub Pages runtime boundary

Stage 5A keeps the ordinary browser build and core runtime trust unchanged. A separate
deployment profile binds two explicit approvals: the Reviewed source-manifest digest and
a deployment-only runtime-projection digest. Deriving a projection from Reviewed bytes
does not grant runtime trust by itself.

Embedding the complete Reviewed Stage 2 pack was rejected because four volatile current-
version claims would make the whole browser runtime unavailable after their freshness
window expired even though Stage 4 does not consume them. The approved Pages projection
therefore contains exactly 16 already-Reviewed documents: four language entities, four
boolean capability dimensions, four capability claims and four primary sources. It contains
no current-version claims and no licensing records.

`build:pages` layers deployment material over the unchanged browser build and emits a
static `runtime.js` before `app.js`. Evaluation time is taken at page load. Generated-byte
tests reject dynamic-code, network and credential surfaces; schema validation uses the
reproducible standalone validator set rather than AJV's runtime compiler.

The Pages workflow accepts only a successful same-repository `Verify` push on `main`, or
a manual dispatch while already on `main`. It checks out the exact verified SHA, rejects
a stale SHA if `main` has advanced, repeats audit and pinned Gitleaks checks, and uploads
the static Pages artifact from a `contents: read` build job. Only the final deployment job
receives `pages: write` and `id-token: write`, and that job executes no repository code.
The workflow exists before public promotion; PLLDN does not claim the Pages site is live
until Task 7 observes a successful post-merge deployment.

## Candidate, review and immutable snapshot
Stage 2 candidate assertions remain `Partial`. Source records carry the official
reference, retrieval time and exact content SHA-256 fingerprint. Candidate construction
rejects embedded review records and any assertion that declares itself `Reviewed`.

The first Stage 2 candidate was human-approved only after its exact manifest digest was
fixed. Promotion then produced 16 `Reviewed` assertions plus the human review record in
`reviewed.stage2-core.2026-09-05`. The checked-in snapshot must reproduce byte-for-byte
from that approved candidate and review record. `knowledge/reviewed/**` is excluded from
formatting so tooling cannot silently rewrite immutable bytes.

Runtime acceptance is a separate trust boundary. `verifySnapshot` still requires a
caller-supplied trusted digest, and the repository does not ship a default runtime
approval pin for this snapshot.

Broader reviewed catalogue coverage, a licensing Pages surface, public deployment
promotion and release-grade end-to-end corpus remain separately gated work. Stage 5A is
not the v0.0.1 product release and makes no claim of broad natural-language understanding,
general recommendation accuracy or certification.
