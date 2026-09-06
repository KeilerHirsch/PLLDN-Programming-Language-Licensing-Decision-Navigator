# Stage 3 Faceted UI Design

**Status:** Approved architecture A; written design contract before implementation.

**Goal:** Add the first browser UI subsystem for PLLDN: a deterministic, Geizhals-style faceted interface whose filters, counts and candidate presentation consume the existing decision core instead of reimplementing decision logic.

**Product rule:** Filters are authoritative. Free text is not part of Stage 3. Recommendations consume only canonical project-fact state.

## Scope

Stage 3 delivers:
- a browser-safe validation/decision path;
- a framework-free Vanilla TypeScript UI shell;
- facet definitions, active filter chips, option counts and reset;
- deterministic candidate presentation and presentation-only sorting;
- visible `RECOMMEND`, `ALTERNATIVES`, `NEEDS_ONE_FACT`, `INSUFFICIENT_INFORMATION`, `CONFLICT` and `UNSUPPORTED` states;
- a static browser build under `.build/site/`;
- tests proving the UI cannot become a second decision engine.

Stage 3 does **not** deliver free-text parsing, broad production knowledge coverage, a default runtime snapshot approval pin, GitHub Pages publication, GitHub App integration, or a `v0.0.1` release.

## Architecture

The browser subsystem is intentionally small and split into four boundaries:

1. **Browser portability boundary** — repository schemas become statically importable instead of being loaded through `node:fs`; the existing validator and decision semantics remain unchanged.
2. **UI state/model boundary** — pure functions own facet metadata, UI-owned canonical constraints, chips, reset and candidate view models.
3. **Controller boundary** — calls the existing `facetCounts()` and `evaluateDecision()` functions; it never computes independent eligibility, exclusions or recommendations.
4. **DOM boundary** — renders the controller model and translates user actions into controller commands. It contains no decision rules.

No React, Preact, Vue, Svelte or state-management framework is introduced.

## Browser build

The build-only dependency is `esbuild-wasm@0.28.2`, pinned in `package-lock.json`.

Rationale:
- MIT licensed;
- current package metadata has no package dependencies, optional dependencies or lifecycle scripts;
- compatible with the repository rule that installation uses `npm ci --ignore-scripts`;
- bundles TypeScript, JSON schema imports and existing npm runtime dependencies without adding a frontend framework.

The build entry is `src/ui/main.ts`. Output is deterministic static content under `.build/site/`; generated output is never committed.

## Canonical facet state

A facet definition is presentation metadata, not technical truth. It names:
- stable `facet_id`;
- visible label and group;
- authoritative `dimension_id`;
- explicit operator and constraint strength;
- typed options understood by the existing decision engine.

Selecting a facet creates or replaces exactly one UI-owned canonical project constraint with a deterministic ID in the `ui.facet.*` namespace. Clearing a facet removes only that UI-owned constraint.

The controller must never delete, rewrite or weaken user-authored or imported project facts/constraints, even when they target the same dimension. If a UI selection conflicts with an existing project constraint, the ordinary decision core produces `CONFLICT`.

`reset()` restores the exact canonical base project supplied when the controller was created. The original project object is never mutated.

## Geizhals count semantics

Facet option counts are produced only through `facetCounts()`.

When computing all options for one facet, the controller removes only the current UI-owned constraint for that same `facet_id` from a cloned project before asking `facetCounts()` to preview each option. Other active facets and all non-UI project constraints remain active.

This prevents the selected value from making every alternative in the same facet appear contradictory while preserving real cross-facet and user-authored conflicts.

Each option exposes the existing engine counts:
- `eligible`;
- `excluded`;
- `unresolved`;
- resulting decision state.

## Decision and presentation flow

The controller receives:
- immutable base project facts;
- verified/injected knowledge documents;
- snapshot/rules metadata already required by `DecisionRequest`;
- a facet catalogue;
- candidate type and optional component scope.

For every material UI state change:
1. derive the canonical project document from base project plus UI-owned facet constraints;
2. call `evaluateDecision()` once for the current result;
3. call `facetCounts()` for visible facet options using the same canonical project state;
4. project the returned candidate assessments and trace into a UI view model;
5. render that view model.

The UI never infers a recommendation from count totals, sort order, labels or visual position.

Sorting is presentation-only. Stage 3 supports:
- **Recommended first** — selected result candidates first, then other eligible candidates, unresolved candidates, excluded candidates; stable label/ID tie-breaks only;
- **Name A–Z** — locale-stable label ordering with candidate ID as deterministic tie-break.

Changing sort order must not change canonical facts, facet counts, candidate status, decision state or trace identity.

## Candidate display

Candidate labels are taken from entity records. Candidate IDs remain visible in deep detail/debug output but are not the primary human label.

The result list visibly distinguishes:
- selected recommendation/alternatives;
- eligible but non-selected candidates;
- unresolved candidates;
- excluded candidates.

No numeric score, confidence percentage or synthetic ranking value is introduced.

## Browser portability boundary

`src/validation/documents.ts` must no longer require `node:fs` at module load time.

Repository JSON Schemas are imported statically through a dedicated schema-set module. Node tests and the browser bundle consume the same parsed schema documents. Schema IDs, AJV strictness, duplicate-key rejection, reference validation and canonical schema digest semantics must remain unchanged.

A browser-build test must prove the emitted JavaScript contains no `node:` imports and no `readFileSync` reference.

This refactor is portability-only. Any change to accepted/rejected document semantics requires its own RED test and is not bundled into the portability change.

## Runtime trust boundary

Stage 3 must not silently convert the Stage 2 Reviewed snapshot into default runtime trust.

The UI/controller works with injected runtime material in tests and development. Production/runtime mounting requires a separately supplied trusted snapshot digest before reviewed knowledge can be accepted. The repository default trust allowlist remains empty.

If no trusted runtime snapshot is supplied, the browser shell fails closed and renders a clear unavailable/not-configured state instead of recommendations.

Synthetic fixtures may be used by automated UI/controller tests, but they must not be shipped as real product recommendations or presented as reviewed knowledge.

## DOM and interaction boundary

`src/ui/render.ts` owns DOM creation only. It must use DOM text/content APIs for knowledge-derived labels rather than interpolating untrusted strings into executable HTML.

`src/ui/main.ts` performs startup wiring and event delegation. Business decisions, facet counts and sorting semantics remain outside this file.

Primary visible structure:
- product heading and short purpose line;
- active filter chips with individual clear actions and one reset action;
- faceted filter groups with counts;
- result state summary;
- candidate list;
- one compact sort control;
- progressive detail disclosure for trace/evidence information.

## Error and uncertainty handling

The UI must preserve typed engine states instead of collapsing them into an empty-result view.

- `NEEDS_ONE_FACT` shows the single unresolved decision-relevant dimension.
- `INSUFFICIENT_INFORMATION` shows that more than one material fact is unresolved.
- `CONFLICT` shows that project constraints conflict; it is not presented as "0 matches".
- `UNSUPPORTED` shows that the reviewed/runtime knowledge does not support the requested decision surface.
- candidate-level `UNRESOLVED` remains visibly distinct from `EXCLUDED`.

Unexpected runtime/build errors stop the affected action and expose a concise diagnostic state. The controller does not silently reuse stale counts or stale recommendations after a failed evaluation.

## Accessibility and KISS UX

Stage 3 uses semantic native controls wherever practical: buttons, checkboxes/radios as appropriate, `select`, headings and disclosure elements.

Keyboard operation must cover all filters, chips, reset, sorting and detail disclosure. Focus indicators are not removed. Status changes use a non-intrusive live region so state changes are available without forcing focus jumps.

The default surface stays compact: active choices, filters, result state and candidates first; evidence/trace detail is progressively disclosed.

No animations, custom component system, icon library, design-system dependency or theme framework is required for Stage 3.

## Intended file boundaries

Expected new/changed responsibilities:
- `src/validation/schema-set.ts` — static repository schema imports for Node/browser parity;
- `src/validation/documents.ts` — AJV setup from the shared schema set, no filesystem dependency;
- `src/ui/types.ts` — facet and UI view-model contracts;
- `src/ui/facts.ts` — deterministic UI-owned canonical constraint manipulation;
- `src/ui/model.ts` — pure candidate/chip/state projection and presentation sorting;
- `src/ui/controller.ts` — orchestration over `evaluateDecision()` and `facetCounts()`;
- `src/ui/render.ts` — DOM rendering only;
- `src/ui/main.ts` — browser startup/event wiring only;
- `tools/build-browser.ts` — deterministic `esbuild-wasm` static build;
- `web/index.html` and `web/app.css` — minimal static shell and styling;
- focused Stage 3 tests under `tests/` for portability, facts, controller/model and build invariants.

## Required test invariants

Stage 3 is not complete unless automated tests prove at least:
- browser build contains no `node:` import and no `readFileSync` reference;
- Node validation behavior remains compatible with the Stage 2 corpus after schema portability refactor;
- setting a facet creates exactly one deterministic UI-owned constraint;
- changing that facet replaces only its own UI constraint;
- clearing a facet removes only its own UI constraint;
- reset reproduces the exact canonical base project;
- same-facet count previews ignore only that facet's active UI constraint;
- foreign/user-authored constraints on the same dimension remain active and can produce `CONFLICT`;
- facet counts come from `facetCounts()` semantics, not local count logic;
- candidate material status comes from `evaluateDecision()` output;
- sort changes presentation order only and leaves decision trace identity/material result unchanged;
- `UNKNOWN`, `UNRESOLVED`, `CONFLICT` and `UNSUPPORTED` remain distinct in the view model;
- missing runtime trust produces a fail-closed UI state;
- formatter/build steps do not mutate `knowledge/reviewed/**` bytes.

The normal repository gates remain mandatory: typecheck, Biome, repository policy, coverage thresholds, evidence binding, dependency audit, secret scan and cross-platform replay where applicable.

## Acceptance boundary

Stage 3 is complete when a deterministic browser bundle can render and interact with an injected/test runtime through the authoritative decision engine, with faceted filtering, chips, counts, reset, candidate states and presentation-only sorting, while the repository still ships no default runtime snapshot approval.

A visually polished production catalogue is not required for Stage 3. Correct state flow and decision integrity are the release criterion for this slice.

## Explicit non-goals

- no natural-language/free-text parser;
- no LLM dependency;
- no independent browser recommendation algorithm;
- no generic architecture score;
- no popularity/community-vote ranking;
- no license-compatibility inference beyond reviewed knowledge;
- no automatic approval of Stage 2 Reviewed data for runtime use;
- no GitHub Pages deployment yet;
- no account, cloud database or telemetry;
- no framework migration disguised as UI work.
