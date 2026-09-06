# ADR 0005 — Stage 3 faceted browser UI

**Status:** Accepted 2026-09-06

## Context

Stage 1 already provides deterministic decision and facet-count semantics. Stage 2
provides reviewed knowledge and a separate runtime snapshot-approval boundary. Stage 3
needs a browser surface without duplicating those semantics or silently converting the
reviewed snapshot into default runtime trust.

The repository previously loaded JSON Schemas through `node:fs`, so the decision path
was not browser-bundle-safe even though the domain logic itself was portable.

## Decision

Use framework-free Vanilla TypeScript for the Stage 3 browser surface. Do not introduce
React, Preact, Vue, Svelte or a separate UI state framework.

Move repository schema loading behind a static `schema-set.ts` module. Node and browser
validation consume the same schema documents and preserve the same schema digest.

Represent UI facet selections as deterministic canonical constraints in the reserved
`ui.facet.*` namespace. The original base project remains immutable.
The UI controller must call `evaluateDecision()` for material candidate state and
`facetCounts()` for option counts. It may project labels, chips and presentation order,
but it may not infer eligibility or recommendation state from counts or sorting.

For same-facet previews, remove only that facet's current UI-owned constraint before
calling `facetCounts()`. Preserve every foreign/imported constraint, including constraints
on the same dimension, so real conflicts remain visible.

Browser runtime startup must pass supplied snapshot bytes through `verifySnapshot()`.
No repository default trusted digest is added. Missing, wrong or tampered runtime trust
produces an unavailable state instead of a recommendation.

Use pinned `esbuild-wasm@0.28.2` as the build-only browser bundler. It is installed with
lifecycle scripts disabled and produces ignored static output under `.build/site/`.
Generated browser artifacts are not committed or deployed in Stage 3.

The DOM layer uses native elements and text/content APIs for knowledge-derived values.
Unexpected evaluation failures replace material results with a concise diagnostic state
instead of retaining stale counts or recommendations.
## Consequences

Stage 3 adds a real browser UI while keeping the decision and trust systems singular.
The browser bundle is larger than a bespoke hand-written filter page because it includes
the real validator and decision dependencies; this is accepted in preference to a weaker
second implementation.

The static shell is useful for development and later deployment work, but it is not a
self-contained production recommender because runtime trust is intentionally external.

Stage 3 does not add free-text input, GitHub Pages deployment, broad reviewed knowledge,
telemetry, accounts, a backend or a v0.0.1 release claim. Those remain separately gated
future work.
