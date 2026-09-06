# Stage 4 Deterministic Free-Text Accelerator Design

**Status:** Approved architecture A2; written design contract before implementation.

**Goal:** Add a local, deterministic free-text accelerator that converts a small set of explicit English/German project phrases into reviewable facet proposals without allowing raw text to influence recommendations directly.

**Product rule:** Filters are authoritative. Free text may propose filters. Recommendations consume only canonical project-fact state after explicit user confirmation.

## Scope

Stage 4 delivers:
- bounded local text normalization and tokenization;
- a small reviewed rule set of high-signal phrase/alias patterns;
- deterministic proposals targeting existing Stage 3 facet options;
- explicit `PROPOSED`, `AMBIGUOUS` and `CONFLICTING` proposal states;
- user confirmation before any proposal changes canonical project constraints;
- UI controls for analyze, confirm/apply, reject/clear and manual conflict resolution;
- a gold corpus proving positive, negative, ambiguity and conflict behavior;
- equivalence tests proving confirmed text proposals and equivalent manual facets produce the same canonical facts and material decision result.

Stage 4 does **not** add an LLM, provider adapter, API key, network call, semantic embedding, statistical classifier, backend, telemetry, broad natural-language understanding, GitHub Pages publication or a `v0.0.1` release.

## Architecture
The Stage 4 subsystem is intentionally one-way and split into five boundaries:

1. **Normalization boundary** — converts bounded input into normalized tokens while preserving original source-span offsets. It performs no semantic inference.
2. **Rule-set boundary** — repository-controlled data declares explicit phrase/alias patterns and their existing `facet_id` / `option_id` targets. Rules cannot invent new dimensions or values.
3. **Matcher boundary** — performs exact deterministic token-pattern matching, deduplication, ambiguity flags and conflict detection. It never calls the decision engine.
4. **Confirmation boundary** — only confirmed `PROPOSED` items may call the existing Stage 3 facet-selection path. `AMBIGUOUS` and `CONFLICTING` items are never auto-applied.
5. **Decision/UI boundary** — after confirmation, the unchanged `UiController` derives canonical `ui.facet.*` constraints and the existing `facetCounts()` / `evaluateDecision()` path remains the only recommendation authority.

No second project-fact writer, recommendation engine or hidden scoring model is introduced.

## V1 proposal target contract

A Stage 4 rule does not directly carry an arbitrary `dimension_id`, operator, strength or typed value.

Instead, every actionable rule targets:
- one existing `facet_id`;
- one existing `option_id` from that facet.

The analyzer resolves the target through the supplied Stage 3 facet catalogue and derives the visible dimension/value only for explanation. Unknown facet IDs, unknown option IDs, duplicate target definitions or malformed rule records fail closed before analysis.

This keeps manual and text-assisted input on exactly the same canonical path.
## Rule-set data model

Stage 4 uses a versioned repository data file under `text-rules/` plus one JSON Schema under `schemas/`.

The rule set contains:
- stable rule-set version and ID;
- explicit aliases for abbreviations or equivalent technical phrases;
- actionable phrase rules with stable rule IDs and one facet-option target;
- explicit ambiguity rules for known phrases that must be surfaced but not mapped;
- human-readable reason keys used by the UI and tests.

Rule data contains **no regular expressions**, executable code, prompt text or user-provided patterns. Matching syntax is a small declarative token-pattern format validated before use.

The initial checked-in rule set is deliberately small. It covers only phrases for which the current facet catalogue has an explicit canonical option and for which the phrase has high semantic signal.

English and German variants may coexist in the same rule set. Language detection is not required; each accepted phrase is explicit data.

Common abbreviations such as `GC` may be aliases only when they are unambiguous in the supported rule context. Typo tolerance is limited to explicitly reviewed aliases; there is no Levenshtein or fuzzy semantic matching.

## Text normalization

Input is local and bounded to **16 KiB UTF-8** per analysis action.

Normalization performs only:
- Unicode NFKC normalization;
- locale-independent lowercase normalization;
- deterministic Unicode letter/number tokenization;
- whitespace and punctuation separation;
- preservation of original UTF-16 source start/end offsets for matched spans.
Normalization does **not** stem words, translate text, infer synonyms, repair arbitrary spelling, expand domain vocabulary or guess intent.

The analyzer returns zero proposals for empty input, over-limit input is rejected before matching, and invalid Unicode/string handling fails closed with a concise diagnostic.

## Deterministic matching semantics

Rules match normalized contiguous token sequences. Alias expansion is deterministic and bounded by the checked-in alias table.

A concept mention is not automatically an intent statement. For example, a bare mention of `garbage collector` is not sufficient unless an explicit high-signal rule phrase matches.

Positive and negative intent are encoded as separate reviewed phrase rules rather than inferred by a generic sentiment or NLP layer. Examples may include phrases equivalent to:
- `must use garbage collection`;
- `without a garbage collector`;
- `GC required`;
- `kein Garbage Collector`;
- `ohne GC`.

If multiple matches resolve to the same facet and same option, they are deterministically deduplicated while retaining all supporting source spans/rule IDs.

If matches resolve to different options of the same facet, the resulting proposal state is `CONFLICTING`. Neither option is confirmable through the text accelerator; the user resolves the facet manually.

An explicit ambiguity rule produces `AMBIGUOUS` with the matched span and reason but no facet-option target. Ambiguous items never modify canonical state.

There is no longest-match semantic override that silently discards an opposing interpretation. Conflicting actionable evidence remains visible as conflict.

## Proposal contract
Every analysis result is presentation/input-assistance data only. A proposal exposes:
- deterministic `proposal_id` derived from rule ID, target and source span;
- proposal state: `PROPOSED`, `AMBIGUOUS` or `CONFLICTING`;
- matched original source span(s);
- supporting rule ID(s);
- target `facet_id` / `option_id` for `PROPOSED` items;
- derived human-readable facet/option labels and canonical dimension/value for explanation;
- a stable reason key.

There is no numeric confidence score, hidden rank, probability or model provenance because no probabilistic model exists.

Proposal ordering is deterministic: first source position, then rule ID, then facet/option ID as tie-breakers. Ordering has no semantic priority.

Raw text and proposals are not Canonical Project Facts. They are not accepted by `evaluateDecision()` or `facetCounts()` and are not written into the project document merely because analysis succeeded.

## Confirmation and canonical-state boundary

The Stage 4 UI keeps analysis state separate from the Stage 3 `UiController`.

A user may:
- confirm one `PROPOSED` item;
- confirm all non-conflicting proposed items;
- ignore/reject a proposal;
- clear the analysis result;
- resolve ambiguous/conflicting text manually through the authoritative facet controls.

Confirming a proposal delegates to the existing facet-selection command for that exact `facet_id` and `option_id`. Stage 4 does not create a new `ui.text.*` canonical namespace.
Confirming an already-selected identical option is idempotent. Confirming a different option for the same UI facet uses the existing replacement semantics. Foreign/imported constraints remain untouched and may still cause the ordinary decision engine to return `CONFLICT`.

`Apply confirmed` must be order-independent for proposals targeting distinct facets. If canonical results differ by proposal iteration order, the operation fails its tests and Stage 4 is not complete.

Changing or clearing the source text after confirmation does not silently remove already-confirmed facet selections. The user removes canonical selections through the existing facet/chip/reset controls.

## Filter/text equivalence invariant

The primary Stage 4 correctness invariant is:

> Given the same facet catalogue and base project, manually selecting a set of facet options and confirming text proposals for those exact options must produce byte-equivalent canonical project state and the same material `evaluateDecision()` result.

Equivalence includes:
- canonical project facts/constraints;
- decision state;
- selected candidate IDs;
- candidate material statuses;
- unresolved dimensions;
- material decision trace identity/evidence references.

Presentation-only text metadata, proposal IDs and source spans are excluded because they never enter the decision request.

## Browser UI

Stage 4 extends the framework-free Stage 3 shell with one progressive input section named **Describe constraints**.

The default interaction is deliberately explicit:
1. enter or paste text;
2. press **Analyze text**;
3. review detected items;
4. confirm safe proposals or resolve uncertainty manually;
5. existing facets/results update only after confirmation.
The UI must distinguish:
- **Detected** — confirmable `PROPOSED` item;
- **Needs clarification** — `AMBIGUOUS` item, not applicable;
- **Conflicting statements** — `CONFLICTING` item, not applicable;
- **No supported constraints detected** — valid zero-proposal result, not an error.

Matched source text may be quoted using safe text nodes only. Knowledge/rule-derived labels use the same DOM-safe rendering boundary as Stage 3. No proposal content is interpolated into executable HTML.

The text area is optional and does not compete with the authoritative facets. Stage 4 does not turn the product back into a mandatory wizard or make natural-language input a prerequisite for recommendations.

## Gold corpus and precision policy

Stage 4 ships a small checked-in test corpus of approximately **15–25 high-signal cases** covering only the initial rule-set surface.

The corpus must include:
- positive English phrases;
- negative English phrases;
- equivalent German phrases;
- abbreviations in reviewed context;
- irrelevant concept mentions that must yield zero proposals;
- explicit ambiguous phrases;
- contradictory statements targeting opposing options;
- punctuation/case/Unicode normalization variants;
- oversized-input rejection.

For the defined corpus, a false-confident mapping is a release blocker. Correct abstention (`AMBIGUOUS`, `CONFLICTING`, or no proposal) is preferred over answer rate.

Adding a phrase/rule is therefore a knowledge-like change: it requires its own regression case and reviewable target mapping. Convenience coverage is not a reason to broaden a pattern.

## Security and privacy boundary

All analysis remains in-process and local. Stage 4 adds **zero network/provider dependencies** and no new runtime package dependency is expected.
The Stage 4 source must not call `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, dynamic `eval`/`Function`, or execute commands/URLs derived from text or rule data.

Rule-set data is repository-controlled, schema-validated and statically bundled. User input cannot supply regular expressions, rule definitions, code, paths or URLs.

The existing Stage 3 runtime snapshot trust boundary remains unchanged: text analysis neither bypasses `verifySnapshot()` nor changes the empty default runtime approval allowlist.

No raw input text, proposal list or matched spans are persisted, logged, uploaded or written to repository evidence by Stage 4.

## Intended file boundaries

Expected new/changed responsibilities:
- `schemas/text-rule-set.schema.json` — strict contract for the checked-in deterministic rule set;
- `text-rules/stage4-core.json` — small reviewed English/German alias, actionable and ambiguity patterns;
- `src/text/types.ts` — rule, token, source-span and proposal contracts;
- `src/text/normalize.ts` — bounded deterministic normalization/tokenization with source offsets;
- `src/text/rules.ts` — static rule-set loading, schema/reference validation against the supplied facet catalogue;
- `src/text/analyze.ts` — exact pattern matching, dedupe, ambiguity and conflict projection;
- existing `src/ui/*` — minimal presentation/wiring additions only; confirmation delegates to existing facet selection;
- focused tests under `tests/` plus a checked-in text gold corpus fixture.

No Stage 4 behavior belongs in `src/decision/`. The decision engine must remain unaware that a facet selection originated from free text.

## Required test invariants

Stage 4 is not complete unless automated tests prove at least:
- normalization is deterministic and preserves matched original source spans;
- the 16 KiB UTF-8 input limit fails closed;
- malformed/unknown rule targets fail closed before analysis;
- rule data contains no executable regex/code surface;
- bare concept mentions in negative corpus cases produce no proposal;
- reviewed English/German positive and negative phrases map exactly as expected;
- same-facet same-option matches deduplicate deterministically;
- opposing same-facet matches become `CONFLICTING` and are not auto-applicable;
- explicit ambiguity rules become `AMBIGUOUS` without canonical targets;
- zero supported matches is a valid abstention result;
- confirming a proposal delegates to the existing facet path and creates no `ui.text.*` constraint;
- confirmed text proposals and equivalent manual facet selections produce byte-equivalent canonical project state;
- equivalent manual/text paths produce the same material decision state, candidate statuses and trace references;
- confirmation is idempotent and order-independent for distinct facets;
- clearing/reanalyzing text does not silently remove confirmed canonical selections;
- Stage 4 introduces no network/provider API use and no automatic runtime snapshot approval;
- browser rendering keeps proposal/source text inside safe text-content APIs.

The existing repository gates remain mandatory: typecheck, Biome, repository policy, coverage thresholds, immutable Reviewed-snapshot formatter canary, evidence binding, dependency audit, secret scan and cross-platform replay.

## Acceptance boundary

Stage 4 is complete when the framework-free browser shell can accept bounded local text, deterministically produce reviewable proposals for the small checked-in rule surface, require explicit confirmation, and then reach exactly the same canonical project/decision result as equivalent manual facet selections.

Correct abstention is part of success. Stage 4 is allowed to understand very little; it is not allowed to guess.

The repository still ships no default runtime snapshot approval pin and Stage 4 does not make PLLDN a released general-purpose natural-language architecture adviser.

## Explicit non-goals

- no LLM, model, provider SDK or prompt engineering;
- no network-based inference or remote service;
- no fuzzy semantic similarity, embeddings or statistical classifier;
- no arbitrary spelling correction or broad synonym inference;
- no direct text-to-decision or text-to-candidate scoring;
- no arbitrary text-to-dimension writer outside existing facets;
- no automatic application of proposals without user confirmation;
- no persistent storage, telemetry or upload of user text;
- no backend, account system or GitHub App integration;
- no GitHub Pages deployment yet;
- no broad language/license corpus expansion disguised as parser work;
- no v0.0.1 Beta or general recommendation-accuracy claim.
