# Stage 3 Faceted UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PLLDN's first deterministic browser UI: framework-free faceted filtering whose facts, counts and recommendations remain controlled by the existing decision engine.

**Architecture:** Keep the engine authoritative. Make schema loading browser-safe, represent UI selections as deterministic `ui.facet.*` canonical constraints, project engine output into a pure view model, and keep DOM code presentation-only. Runtime knowledge remains fail-closed unless an external trusted snapshot digest is supplied.

**Tech Stack:** TypeScript 7.0.2, Node 24.15.0 tests, AJV 8.20.0, `esbuild-wasm@0.28.2`, browser DOM APIs, no UI framework.

**Spec:** `docs/superpowers/specs/2026-09-06-stage-3-faceted-ui-design.md`

## Global Constraints

- No React/Preact/Vue/Svelte or state-management framework.
- `evaluateDecision()` is the only recommendation/eligibility authority.
- `facetCounts()` is the only facet-count authority.
- UI facts use the reserved `ui.facet.*` namespace and never overwrite imported/user facts.
- Same-facet previews remove only that facet's UI-owned constraint.
- Sorting is presentation-only and must not alter trace identity or canonical facts.
- Repository default runtime trusted-snapshot allowlist remains empty.
- Browser bundle must contain no `node:` imports and no `readFileSync` reference.
- `knowledge/reviewed/**` immutable bytes must survive format/build unchanged.

---
### Task 1: Browser-safe schema loading

**Files:**
- Create: `src/validation/schema-set.ts`
- Modify: `src/validation/documents.ts`
- Modify: `tsconfig.json`
- Test: `tests/browser-portability.test.ts`

**Interfaces:**
- Produces: `schemaDocuments` and `schemaBytes` from static JSON imports.
- Preserves: `validateDocument()`, `evaluationTime()`, `parseDocument()` behavior and `schemaDigest()` semantics.

- [ ] **Step 1: Write the failing portability test**

```ts
const source = readFileSync("src/validation/documents.ts", "utf8");
assert(!source.includes("node:fs"));
assert(!source.includes("readFileSync"));
assert.equal(await schemaDigest(), baselineSchemaDigest);
```

- [ ] **Step 2: Run `node --test tests/browser-portability.test.ts` and verify RED** because `documents.ts` currently imports `node:fs`.

- [ ] **Step 3: Add static JSON-schema imports in `schema-set.ts`** using import attributes and enable `resolveJsonModule` in TypeScript. Rebuild `schemaBytes` from those parsed documents so canonical schema hashing remains content-equivalent.

- [ ] **Step 4: Make `documents.ts` initialize AJV only from `schema-set.ts`**, with no filesystem import or network resolver.

- [ ] **Step 5: Run portability test plus full existing validation/snapshot tests and verify GREEN.**

- [ ] **Step 6: Commit:** `refactor: make schema loading browser safe`
### Task 2: Canonical facet state

**Files:**
- Create: `src/ui/types.ts`
- Create: `src/ui/facts.ts`
- Test: `tests/ui-facts.test.ts`

**Interfaces:**
- Produces: `FacetDefinition`, `FacetOption`, `FacetSelection`, `deriveProject()`, `projectWithoutFacet()`, `resetProject()`.
- `deriveProject()` accepts the immutable base project, facet catalogue, selections and component scope; it returns a clone with deterministic `ui.facet.<facet_id>` constraints sorted by facet ID.

- [ ] **Step 1: Write RED tests** proving one deterministic constraint per selected facet, replacement on changed option, clearing only its own UI constraint, exact reset, base-project immutability and rejection of a base project that already uses reserved `ui.facet.*` IDs.

```ts
const derived = deriveProject(base, facets, { runtime: "gc" }, "component.ui");
assert.equal(derived.facts.filter(f => f.fact_id === "ui.facet.runtime").length, 1);
assert.deepEqual(base, originalBase);
```

- [ ] **Step 2: Run `node --test tests/ui-facts.test.ts` and verify RED.**
- [ ] **Step 3: Implement the minimal pure state functions.** Never mutate the supplied project or facet catalogue.
- [ ] **Step 4: Add same-facet preview tests** proving `projectWithoutFacet()` removes only the active UI-owned constraint for that facet while retaining all foreign constraints, including same-dimension user constraints.
- [ ] **Step 5: Run test + typecheck and verify GREEN.**
- [ ] **Step 6: Commit:** `feat: add canonical facet state`

### Task 3: Deterministic view model and controller

**Files:**
- Create: `src/ui/model.ts`
- Create: `src/ui/controller.ts`
- Test: `tests/ui-model.test.ts`
- Test: `tests/ui-controller.test.ts`

**Interfaces:**
- Produces: `UiViewModel`, `SortMode`, `createUiController()`.
- Controller methods: `view()`, `selectFacet()`, `clearFacet()`, `reset()`, `setSort()`.
- [ ] **Step 1: Write RED model tests** for labels from entity records, selected/eligible/unresolved/excluded classes, all typed decision states, and deterministic `recommended` versus `name` sort order.

```ts
const sorted = sortCandidates(model.candidates, "recommended", selectedIds);
assert.deepEqual(sorted.map(x => x.candidate_id), ["language.alpha", "language.beta"]);
```

- [ ] **Step 2: Implement pure projection/sorting in `model.ts`.** Use deterministic normalized label keys plus candidate ID tie-breaks; no score is introduced.

- [ ] **Step 3: Write RED controller tests** using the real synthetic decision bundle. Compare controller facet counts against direct `facetCounts()` output and controller candidate status against direct `evaluateDecision()` output.

- [ ] **Step 4: Implement `createUiController()`** so every material state change derives canonical facts, calls `evaluateDecision()` once, then computes every visible facet through `facetCounts()` using `projectWithoutFacet()` for that facet.

- [ ] **Step 5: Prove sorting changes only presentation order.** Snapshot trace identity, canonical project and counts before/after `setSort()` and require equality.

- [ ] **Step 6: Prove unexpected evaluation failure does not return stale prior output.** The action rejects and leaves no newly published view model.

- [ ] **Step 7: Run controller/model tests + typecheck and verify GREEN.**
- [ ] **Step 8: Commit:** `feat: add deterministic faceted UI controller`

### Task 4: Runtime trust and DOM boundary

**Files:**
- Create: `src/ui/runtime.ts`
- Create: `src/ui/render.ts`
- Create: `src/ui/main.ts`
- Test: `tests/ui-runtime.test.ts`
- Test: `tests/ui-render-contract.test.ts`

**Interfaces:**
- Runtime bootstrap consumes raw snapshot manifest, exact snapshot files, caller-supplied trusted digests, explicit evaluation time, base project, facets and decision scope.
- Produces either a verified controller or a typed fail-closed unavailable state.

- [ ] **Step 1: Write RED trust tests**: empty trusted digest list, wrong digest and tampered snapshot must never produce a controller; a synthetic manifest with its caller-supplied exact digest may proceed.
- [ ] **Step 2: Implement runtime bootstrap by calling existing `verifySnapshot()`** rather than duplicating snapshot checks.
- [ ] **Step 3: Write RED render-contract tests** requiring semantic controls/live status and forbidding `innerHTML`, `insertAdjacentHTML`, `eval` and knowledge-derived HTML interpolation in `render.ts`/`main.ts`.
- [ ] **Step 4: Implement DOM rendering with `createElement`, `textContent`, native buttons/select/details and event delegation only.**
- [ ] **Step 5: Implement `main.ts` startup.** Missing external runtime config renders “Runtime snapshot not configured” and no recommendation content.
- [ ] **Step 6: Run UI runtime/render tests + typecheck and verify GREEN.**
- [ ] **Step 7: Commit:** `feat: add fail-closed browser runtime shell`
### Task 5: Static browser build

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/dependencies.md`
- Create: `tools/build-browser.ts`
- Create: `web/index.html`
- Create: `web/app.css`
- Test: `tests/browser-build.test.ts`

**Interfaces:**
- Produces `npm run build:browser` and `.build/site/{index.html,app.css,app.js}`.
- Build output is generated only; `.build/` remains ignored.

- [ ] **Step 1: Install exact build-only dependency** with scripts disabled: `npm install --save-dev --save-exact --ignore-scripts esbuild-wasm@0.28.2`.
- [ ] **Step 2: Record `esbuild-wasm` role/license in `docs/dependencies.md`** and run repository policy so dependency provenance/allowlist enforcement is exercised immediately.
- [ ] **Step 3: Write RED build test** requiring the three site files, deterministic second-build bytes, and absence of `node:`, `readFileSync`, and synthetic production recommendation data from `app.js`.

```ts
await buildBrowser(out);
const first = await readFile(join(out, "app.js"));
await buildBrowser(out);
assert.deepEqual(await readFile(join(out, "app.js")), first);
assert(!first.toString().includes("readFileSync"));
```

- [ ] **Step 4: Implement `buildBrowser()` using `esbuild-wasm`** with `bundle:true`, `platform:"browser"`, `format:"esm"`, deterministic output names and explicit copy of the static HTML/CSS shell.
- [ ] **Step 5: Add `build:browser` script and implement minimal accessible `web/index.html`/`web/app.css`.** No remote assets, fonts, telemetry or inline executable data.
- [ ] **Step 6: Run build test twice plus `npm run build:browser`; verify `.build/site` is untracked.**
- [ ] **Step 7: Commit:** `build: add deterministic browser bundle`

### Task 6: Assurance, docs and Stage 3 promotion

**Files:**
- Modify: `assurance/evidence-contract.schema.json` only if Stage-3 evidence mapping requires a new allowed scope.
- Modify: `assurance/requirements.json`
- Modify: `docs/architecture.md`
- Modify: `docs/verification.md`
- Create: `docs/decisions/0005-stage-3-faceted-ui.md`
- Test: `tests/assurance.test.ts`

- [ ] **Step 1: Write RED assurance test** requiring scope `stage-3-faceted-ui` and explicit controls mapping browser portability, canonical UI facts, authoritative controller semantics, runtime fail-closed trust and browser-build invariants to real test files.
- [ ] **Step 2: Update the public control plane and docs** without claiming GitHub Pages, broad catalogue coverage, production runtime trust or v0.0.1 release readiness.
- [ ] **Step 3: Run formatter and prove reviewed snapshot manifest digest is byte-identical before/after.**
- [ ] **Step 4: Run full `npm run verify`, `npm audit --audit-level=low`, Gitleaks tree/history, disclosure firewall and `git diff --check`.**
- [ ] **Step 5: Run `npm run evidence`; bind the final source subject and update the private assurance adapter to Stage-3 source-only scope, preserving explicit exclusions.**
- [ ] **Step 6: Require private assurance READY, zero failures/unresolved, then checkpoint Notion before Git promotion.**
- [ ] **Step 7: Commit final docs/assurance changes, rerun post-commit verify/security/private assurance, push `stage3/faceted-ui-core`, open PR with AI-assistance disclosure, wait for required GitHub checks, merge with expected head SHA, and verify main carries the same Git tree/source subject.**
- [ ] **Step 8: Append and verify `Stage 3 — CLOSED` in Notion.**
