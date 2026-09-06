# Stage 4 Deterministic Free-Text Accelerator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local deterministic text accelerator whose confirmed proposals use the same checked-in product facets and canonical decision path as manual filter selections.

**Architecture:** Stage 4 first materializes four product facets from already-Reviewed boolean dimensions. A schema-validated static rule set matches bounded normalized text into presentation-only proposals; only explicit confirmation delegates to `UiController.selectFacet()`. Raw text and proposal metadata never enter `evaluateDecision()`.

**Tech Stack:** TypeScript, Node test runner, AJV, existing framework-free DOM UI, existing `esbuild-wasm@0.28.2` build.

**Spec:** `docs/superpowers/specs/2026-09-06-stage-4-free-text-accelerator-design.md` at commit `f2f4f09146b46d4d3682aa1b8f698bcac6daec55`.

## Global Constraints
- No LLM, network/provider API, backend, telemetry, fuzzy semantic matching, embeddings or statistical classifier.
- Input limit is 16 KiB UTF-8 per analysis action.
- Production rules target only the checked-in product facet catalogue.
- Product facets use only already-Reviewed Stage 2 boolean dimensions; facet existence never fills missing candidate evidence.
- Proposal states are `PROPOSED`, `AMBIGUOUS`, `CONFLICTING`; no numeric confidence.
- Confirmation is explicit and delegates to existing facet selection; no `ui.text.*` canonical namespace.
- Manual/text equivalence must produce byte-equivalent canonical project state and the same material decision result.
- Existing runtime snapshot trust remains fail-closed and no default trust pin is introduced.

---

### Task 1: Checked-in product facet catalogue

**Files:**
- Create: `src/ui/product-facets.ts`
- Modify: `src/ui/runtime.ts`
- Test: `tests/product-facets.test.ts`

**Interfaces:**
- Produce `PRODUCT_FACETS: readonly FacetDefinition[]`.
- Produce `validatedProductFacets(knowledge: readonly Document[]): readonly FacetDefinition[]`.
- `bootstrapUiRuntime()` uses caller-supplied facets when present; otherwise it uses `validatedProductFacets(knowledge)`.

- [ ] Write RED tests proving the four facet IDs map exactly to the four approved Reviewed boolean dimensions, use `MUST` + `EQ`, expose explicit `true` and `false` options, and reject missing/non-boolean dimension records.
- [ ] Run `node --test tests/product-facets.test.ts`; expect failure because the product catalogue does not exist.
- [ ] Implement the static catalogue plus runtime-knowledge validation. Validation checks only dimension identity/type; it does not inspect or invent candidate capability claims.
- [ ] Run product-facet tests and `npm run typecheck`; expect PASS.
- [ ] Run existing runtime/UI tests to prove synthetic injected facets still work.
- [ ] Commit as `feat: add reviewed-dimension product facets`.

### Task 2: Deterministic rule-set contract and loader

**Files:**
- Create: `schemas/text-rule-set.schema.json`
- Create: `text-rules/stage4-core.json`
- Create: `src/text/types.ts`
- Create: `src/text/rules.ts`
- Test: `tests/text-rules.test.ts`

**Interfaces:**
- Produce `loadStage4Rules(facets: readonly FacetDefinition[]): TextRuleSet`.
- Rule targets contain only `facet_id` + `option_id`; ambiguity rules contain no canonical target.
- Rule patterns are arrays of literal normalized tokens or explicit alias references; no regex strings or executable expressions.

- [ ] Write RED tests for strict schema shape, unique IDs, unknown facet/option rejection, ambiguity rules without targets, and absence of regex/code/network fields.
- [ ] Run `node --test tests/text-rules.test.ts`; expect failure.
- [ ] Add the strict JSON Schema, static Stage 4 rule data and loader/reference validation against `PRODUCT_FACETS`.
- [ ] Initial rules cover only high-signal English/German phrases for runtime GC, memory safety without GC, static checker and emits-JavaScript facets plus explicit ambiguity cases.
- [ ] Run rule tests, repository policy and typecheck; expect PASS.
- [ ] Commit as `feat: add deterministic text rule contract`.

### Task 3: Bounded normalization with source spans

**Files:**
- Create: `src/text/normalize.ts`
- Test: `tests/text-normalize.test.ts`

**Interfaces:**
- Produce `normalizeText(input: string): NormalizedText`.
- `NormalizedText` contains original text plus normalized tokens with exact original UTF-16 `start`/`end` offsets.
- Reject UTF-8 byte length above 16 KiB before matching.

- [ ] Write RED tests for NFKC normalization, case folding, punctuation/whitespace tokenization, Unicode text, exact source-span recovery, empty input and 16 KiB boundary/rejection.
- [ ] Run `node --test tests/text-normalize.test.ts`; expect failure.
- [ ] Implement deterministic tokenization without stemming, translation, spelling correction or fuzzy matching.
- [ ] Run normalize tests and typecheck; expect PASS.
- [ ] Commit as `feat: add bounded text normalization`.

### Task 4: Proposal analyzer and gold corpus

**Files:**
- Create: `src/text/analyze.ts`
- Create: `tests/fixtures/stage4-text-gold.json`
- Test: `tests/text-analyze.test.ts`

**Interfaces:**
- Produce `analyzeText(input: string, rules: TextRuleSet, facets: readonly FacetDefinition[]): TextAnalysis`.
- Proposals expose deterministic IDs, state, source spans, rule IDs, reason key and resolved facet/option metadata only when actionable.
- [ ] Write RED corpus tests for positive/negative English and German phrases, reviewed abbreviations, irrelevant concept mentions yielding zero proposals, explicit ambiguity, opposing same-facet conflict, same-option dedupe, punctuation/case/NFKC variants and deterministic ordering.
- [ ] Run `node --test tests/text-analyze.test.ts`; expect failure.
- [ ] Implement exact contiguous token-pattern matching and bounded alias expansion from rule data.
- [ ] Deduplicate same facet+option evidence while retaining all supporting spans/rules; collapse opposing options of one facet into one non-applicable `CONFLICTING` item.
- [ ] Ensure `AMBIGUOUS` has no target and zero supported matches is valid.
- [ ] Run analyzer tests and typecheck; expect PASS.
- [ ] Commit as `feat: add deterministic text proposals`.

### Task 5: Confirmation and manual/text equivalence

**Files:**
- Create: `src/ui/text-assistance.ts`
- Test: `tests/text-equivalence.test.ts`

**Interfaces:**
- Produce `confirmProposal(controller: UiController, proposal: TextProposal): Promise<UiViewModel>`.
- Produce `confirmProposals(controller: UiController, proposals: readonly TextProposal[]): Promise<UiViewModel>`.
- Only `PROPOSED` items are confirmable; confirmation calls `controller.selectFacet(facet_id, option_id)`.

- [ ] Write RED tests proving confirmation creates only `ui.facet.*`, is idempotent, rejects ambiguous/conflicting items, preserves foreign constraints, and is order-independent for distinct facets.
- [ ] Write the central equivalence test: equivalent manual facet selections and confirmed text proposals must produce canonical project JSON with identical canonical serialization plus the same decision state, selected IDs, candidate statuses, unresolved dimensions and material trace references.
- [ ] Run `node --test tests/text-equivalence.test.ts`; expect failure.
- [ ] Implement only the thin confirmation adapter; do not add a new fact writer.
- [ ] Run equivalence tests and existing controller/facts tests; expect PASS.
- [ ] Commit as `feat: bind text confirmation to facet path`.

### Task 6: Browser UI integration

**Files:**
- Modify: `src/ui/render.ts`
- Modify: `src/ui/main.ts`
- Modify: `src/ui/runtime.ts`
- Modify: `web/app.css`
- Test: `tests/ui-text-contract.test.ts`
- Test: `tests/browser-build.test.ts`

**Interfaces:**
- Render an optional **Describe constraints** section with textarea, Analyze button, proposal review list, per-item confirm and Confirm all controls.
- Analysis state remains outside `UiController`; controller material state changes only after confirmation.

- [ ] Write RED DOM/source-contract tests proving semantic controls, safe `textContent` use, distinct Detected/Needs clarification/Conflicting/zero-match states, and no HTML injection surface.
- [ ] Write RED browser-build/source tests proving Stage 4 source contains no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `eval(` or `new Function`, and no provider SDK/network dependency.
- [ ] Implement minimal UI state/wiring around `analyzeText()` + confirmation adapter without changing decision logic.
- [ ] Clearing/reanalyzing text clears only analysis state; previously confirmed canonical facets remain until existing chip/reset controls remove them.
- [ ] Run UI contract, runtime and browser-build tests; expect PASS.
- [ ] Commit as `feat: add local text assistance UI`.

### Task 7: Stage 4 assurance, docs and threat model

**Files:**
- Modify: `assurance/requirements.json`, `assurance/evidence-contract.schema.json`, `tools/evidence.ts`, `tests/assurance.test.ts`
- Modify: `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/verification.md`, `docs/threat-model.md`, `SECURITY.md`
- Create: `docs/decisions/0006-stage-4-free-text-accelerator.md`

**Interfaces:**
- Advance public assurance scope to `stage-4-free-text-accelerator`.
- Add controls C19+ for product-facet provenance, deterministic/abstaining proposals, confirmation-path equivalence, local/no-network boundary and safe UI behavior.

- [ ] Write RED assurance tests for the new scope and exact Stage 4 control mappings.
- [ ] Update assurance control-plane files and docs without claiming Pages deployment, default runtime trust, Beta release or general natural-language accuracy.
- [ ] Add ADR 0006 recording local deterministic proposal-only architecture and the product-facet prerequisite.
- [ ] Update threat model for false mapping, conflicting text, malicious input, rule drift and accidental network/persistence introduction.
- [ ] Run formatter canary proving `knowledge/reviewed/stage2-core.manifest.json` SHA-256 is unchanged before/after `npm run format`.
- [ ] Run `npm run verify`; expect all tests PASS with coverage thresholds.
- [ ] Commit as `docs: complete Stage 4 assurance` only after the behavior/docs tree is internally consistent.

### Task 8: Promotion and closure

**Files:** no new product behavior; promotion evidence only.

- [ ] Stage all public changes and inspect staged file list, stats, large files and disclosure firewall. Reject any private reports/worktree/tool artifacts.
- [ ] Run staged `git diff --check`, full verify, `npm audit`, Gitleaks source/history, public disclosure scan and `npm run evidence`; bind exact source subject.
- [ ] Upgrade the private source-only assurance adapter to Stage 4, run its synthetic selftests, then assess the exact public source subject. Require READY with zero failures/unresolved/input errors.
- [ ] Append and verify a Notion pre-promotion checkpoint containing exact commit/evidence/assurance state.
- [ ] Commit final Stage 4 tree, rerun post-commit verify/audit/Gitleaks/evidence/private assurance on the exact commit, then push `stage4/free-text-accelerator`.
- [ ] Open a PR to `main` with AI-assistance disclosure, product-facet prerequisite, gold-corpus/equivalence evidence and explicit no-Beta/no-Pages/no-runtime-pin claims.
- [ ] Require GitHub `Supply chain and secrets`, Ubuntu, Windows and `Cross-platform replay` success on the exact PR head before merge.
- [ ] Squash-merge through protected `main`, verify feature/main Git-tree equality, then rerun main verify/evidence/audit/Gitleaks and main-push Actions.
- [ ] Remove merged worktree/branch, append `Stage 4 — CLOSED` to Notion and verify readback.
