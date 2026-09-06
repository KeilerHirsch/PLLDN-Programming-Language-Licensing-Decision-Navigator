# ADR 0006 — Stage 4 deterministic free-text accelerator

**Status:** Accepted 2026-09-06

## Context

Stage 3 provides authoritative facets and a browser controller over the existing
deterministic decision engine, but it intentionally shipped no checked-in product facet
catalogue. Concrete facets existed only in synthetic tests, which cannot become production
truth merely because Stage 4 needs text targets.

The product wants a low-friction way to paste ordinary English or German constraints, but
raw text must not become a second project-fact writer or recommendation engine. A wrong
mapping is more damaging than abstention, and runtime trust must remain separate from text
analysis.

## Decision

Materialize four checked-in product facets derived only from already Reviewed Stage 2
boolean dimensions: runtime garbage collection, memory safety without GC, static type
checker and emits JavaScript. Validate those dimensions at runtime and fail closed on
missing or non-boolean records.

Add a repository-controlled Stage 4 rule set whose patterns are literal normalized tokens
and explicit reviewed aliases. Rule data contains no regex, executable expression, prompt,
provider configuration or user-supplied pattern surface.

Normalize input locally with a 16 KiB UTF-8 limit, Unicode NFKC, locale-independent
lowercase handling and Unicode letter/number tokenization while preserving original source
spans. Match exact contiguous token sequences only. Same-target matches deduplicate;
opposing same-facet matches become `CONFLICTING`; explicit uncertainty rules become
`AMBIGUOUS`; unsupported text yields no proposal.

Keep raw text and every analysis result outside canonical project facts. Only an explicit
user confirmation of a `PROPOSED` item may delegate to the existing
`UiController.selectFacet()` path. `AMBIGUOUS` and `CONFLICTING` items are never
confirmable through the accelerator.

Require manual/text equivalence: confirming text proposals for a set of facet options must
produce byte-equivalent canonical project state and the same material decision state,
candidate statuses, unresolved dimensions and trace/evidence references as selecting those
facets manually.

Keep analysis fully in-process and local. Stage 4 adds no LLM, provider SDK, network
inference, embeddings, statistical classifier, fuzzy semantic matching, telemetry or
persistent user-text storage. It also adds no default runtime snapshot approval pin.

## Consequences

Stage 4 intentionally understands only a small reviewed phrase surface. Correct abstention
is expected behavior, not a coverage defect. Every rule expansion is knowledge-like: it
needs an explicit target, regression case and review for false-positive risk.

The decision engine remains unaware of text origin, so filters stay authoritative and there
is no second recommendation implementation to drift. Clearing or reanalyzing text cannot
silently remove already-confirmed canonical facet selections.

The UI gains a useful accelerator without becoming a general natural-language architecture
advisor. GitHub Pages deployment, v0.0.1 Beta, broad reviewed catalogue coverage and any
general recommendation-accuracy claim remain separately gated work.
