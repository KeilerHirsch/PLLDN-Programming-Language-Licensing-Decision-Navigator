# Stage 5B Community + Candidate Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic read-only freshness discovery, structured dictionary candidate intake and advisory PR change classification without granting automation factual, review, merge or runtime-approval authority.

**Architecture:** Pure deterministic reporters consume checked-in data plus explicit timestamps/path lists and emit canonical JSON. GitHub workflows run on protected-main schedule or read-only PR metadata, publish artifacts/job summaries only, and never comment, label, push, approve, merge or modify knowledge.

**Tech Stack:** TypeScript, Node 24.15.0, npm 11.12.1, existing strict JSON/snapshot helpers, GitHub Issue Forms and GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-stage-5-github-native-runtime-community-design.md` at commit `e3b4997064952271691bcf2e1ff827c627369a42`.

## Global Constraints
- Automation output remains candidate/advisory evidence only and cannot create `Reviewed` assertions or runtime approval.
- Source freshness uses existing checked-in metadata; no web crawl, replacement-source inference or factual value proposal.
- Review horizon is explicit input; there is no hidden default freshness policy.
- Initial workflows have `contents: read` only and no `issues: write`, `pull-requests: write`, `checks: write` or branch-write permission.
- PR assistance does not execute code from the PR head; it classifies changed paths using trusted base-branch tooling.
- Dictionary intake requires positive and negative/near-miss evidence plus material AI-assistance disclosure.
- Existing Verify/Security/promotion gates remain authoritative.
- No 5C repository authentication or Stage 6 Beta/release behavior is added.

---
### Task 1: Deterministic freshness candidate reporter

**Files:**
- Create: `tools/source-candidates.ts`
- Test: `tests/source-candidates.test.ts`

**Interfaces:**
- Produce `buildFreshnessReport(documents: readonly Document[], evaluatedAt: string, reviewWindowHours: number): FreshnessCandidateReport`.
- CLI: `node tools/source-candidates.ts --evaluated-at <RFC3339> --review-window-hours <positive integer> --output <path>`.
- Report order is lexical by `claim_id`; no host clock is used by the pure function.

- [ ] **Step 1: Write RED unit tests.** Cover expired volatile claims, claims inside the review window, claims outside the window, normative/version-bound claims without `valid_until`, exact source IDs, deterministic ordering, invalid timestamps/window rejection and zero-candidate output.

```ts
const report = buildFreshnessReport(documents, "2026-09-06T20:00:00Z", 2);
assert.deepEqual(report.candidates.map((x) => [x.claim_id, x.reason]), [
  ["claim.go-current-version", "REVIEW_DUE"],
  ["claim.python-current-version", "REVIEW_DUE"],
  ["claim.rust-current-version", "REVIEW_DUE"],
  ["claim.typescript-current-version", "REVIEW_DUE"],
]);
```

- [ ] **Step 2:** Run `node --test tests/source-candidates.test.ts`; expect FAIL because the reporter does not exist.
- [ ] **Step 3: Implement explicit freshness classification.** Only claims with a string `valid_until` participate. `valid_until <= evaluatedAt` => `EXPIRED`; otherwise `valid_until <= evaluatedAt + reviewWindowHours` => `REVIEW_DUE`; all others abstain.

```ts
export type FreshnessReason = "EXPIRED" | "REVIEW_DUE";
export interface FreshnessCandidate {
  claim_id: string;
  source_ids: readonly string[];
  world_freshness_class: string;
  verified_at: string;
  valid_until: string;
  reason: FreshnessReason;
}
```

- [ ] **Step 4:** Report includes `schema_version`, `evaluated_at`, `review_window_hours`, affected claims/source IDs and existing freshness metadata; it contains no `value`, replacement URL or proposed assertion.
- [ ] **Step 5:** CLI loads `knowledge/reviewed/stage2-core.manifest.json`, verifies every listed file digest, parses each document with existing `parseDocument()`, and checks claim `source_ids` resolve to loaded source records **without** calling `validateReferences(..., evaluatedAt)` or any validator that rejects expired `valid_until`. Expiry is the reporter's subject, not an input-invalidity condition. Require all three CLI arguments and write canonical JSON with `encodeCanonical()`.
- [ ] **Step 6:** Test the real pack twice with identical explicit arguments and require byte-identical report output.
- [ ] **Step 7:** Run source-candidate tests, typecheck and repository policy; expect PASS.
- [ ] **Step 8:** Commit as `feat: report deterministic freshness candidates`.

### Task 2: Scheduled read-only freshness workflow

**Files:**
- Create: `.github/workflows/community.yml`
- Create: `tests/community-workflow.test.ts`

**Interfaces:**
- Scheduled freshness job runs from protected `main` daily with explicit `--review-window-hours 24`.
- Workflow uploads `reports/source-candidates.json` and appends its content to `$GITHUB_STEP_SUMMARY`; it writes nothing to GitHub repository state.
- [ ] **Step 1: Write RED workflow tests.** Require `permissions: contents: read`, schedule + manual dispatch, pinned checkout/setup-node/upload-artifact, explicit RFC3339 evaluated time supplied by shell, explicit 24-hour horizon, no issue/PR/label API action and no write permission.

```ts
const yaml = await readFile(".github/workflows/community.yml", "utf8");
assert.match(yaml, /permissions:\s*\n\s*contents: read/);
assert.match(yaml, /--review-window-hours 24/);
for (const forbidden of ["issues: write", "pull-requests: write", "contents: write", "gh issue create", "gh pr comment"]) {
  assert.equal(yaml.includes(forbidden), false, forbidden);
}
```

- [ ] **Step 2:** Run `node --test tests/community-workflow.test.ts`; expect FAIL.
- [ ] **Step 3:** Add a `freshness` job on `schedule` and `workflow_dispatch`; checkout protected `main` with `persist-credentials: false`, install pinned Node/npm, `npm ci --ignore-scripts`, then run the reporter with `date -u +%Y-%m-%dT%H:%M:%SZ` passed as explicit CLI data.
- [ ] **Step 4:** Upload only the JSON report with existing immutable `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` and 30-day retention.
- [ ] **Step 5:** Run workflow tests + repository policy; expect PASS.
- [ ] **Step 6:** Commit as `ci: add read-only freshness reporting`.

### Task 3: Structured dictionary candidate intake

**Files:**
- Create: `.github/ISSUE_TEMPLATE/dictionary.yml`
- Test: `tests/dictionary-issue-form.test.ts`

**Interfaces:**
- Issue Form is candidate intake only; it does not map directly into `text-rules/stage4-core.json`.
- Current facet choices are the four Stage 4 product facets plus `ambiguity-only`.
- [ ] **Step 1: Write RED form-contract tests.** Require fields for exact phrase/alias, locale, target facet, intended option/ambiguity-only, positive example, negative/near-miss example, provenance/rationale and material AI-assistance disclosure; all material fields are required.

```ts
const form = await readFile(".github/ISSUE_TEMPLATE/dictionary.yml", "utf8");
for (const id of ["phrase", "locale", "target_facet", "target_option", "positive", "negative", "provenance", "ai_assistance"]) {
  assert.match(form, new RegExp(`id: ${id}\\b`));
}
assert.match(form, /ambiguity-only/);
```

- [ ] **Step 2:** Run `node --test tests/dictionary-issue-form.test.ts`; expect FAIL.
- [ ] **Step 3:** Implement the Issue Form with dropdown facet choices `runtime-garbage-collection`, `memory-safety-without-gc`, `static-type-checker`, `emits-javascript`, `ambiguity-only`; option choices `true`, `false`, `ambiguity-only`.
- [ ] **Step 4:** Add Markdown guidance that submission is untrusted candidate input, does not become a rule/fact, and any PR still needs schema validation, gold-corpus regression coverage, conflict/ambiguity behavior and manual/text equivalence.
- [ ] **Step 5:** Run form tests + repository policy; expect PASS.
- [ ] **Step 6:** Commit as `docs: add dictionary candidate intake`.

### Task 4: Deterministic PR change classifier

**Files:**
- Create: `tools/community-review.ts`
- Test: `tests/community-review.test.ts`

**Interfaces:**
- Produce `classifyCommunityChanges(paths: readonly string[]): CommunityReviewReport`.
- CLI: `node tools/community-review.ts --paths <newline-file> --output <json>`.
- A path may belong to multiple classes; classes and paths are lexically sorted.
- [ ] **Step 1: Write RED classifier tests.** Cover candidate knowledge, Reviewed snapshot, source/provenance, text-rule/dictionary, gold corpus and deployment trust-profile classes; verify overlaps, unrelated docs, duplicate input paths, stable output and companion-evidence reporting.

```ts
const report = classifyCommunityChanges([
  "knowledge/candidate/stage2-core/sources/go-faq.json",
  "text-rules/stage4-core.json",
  "tests/fixtures/stage4-text-gold.json",
]);
assert.deepEqual(report.classes.map((x) => x.class_id), [
  "candidate-knowledge",
  "gold-corpus",
  "source-provenance",
  "text-rule-dictionary",
]);
```

- [ ] **Step 2:** Run `node --test tests/community-review.test.ts`; expect FAIL.
- [ ] **Step 3: Implement exact path rules.** Candidate=`knowledge/candidate/**`; Reviewed=`knowledge/reviewed/**`; provenance=`knowledge/**/sources/*.json`; text-rule=`text-rules/**`, `schemas/text-rule-set.schema.json`, `src/text/rules.ts`; gold=`tests/fixtures/stage4-text-gold.json`, `tests/text-analyze.test.ts`, `tests/text-equivalence.test.ts`; deployment trust=`deployments/github-pages/**`.
- [ ] **Step 4:** For each class emit `changed_paths`, `relevant_gates`, `expected_companion_patterns`, and `companion_changes_present`. This is advisory metadata only; absence of a companion is reported, not silently interpreted as approval/failure.
- [ ] **Step 5:** CLI rejects absolute/traversal/NUL paths, trims CRLF/LF input, deduplicates and canonical-JSON encodes the report.
- [ ] **Step 6:** Run classifier tests + typecheck; expect PASS.
- [ ] **Step 7:** Commit as `feat: classify community review changes`.
### Task 5: Read-only PR assistance workflow

**Files:**
- Modify: `.github/workflows/community.yml`
- Modify: `tests/community-workflow.test.ts`

**Interfaces:**
- `pull_request` job runs trusted base-branch `tools/community-review.ts` against a path list derived from base SHA and head SHA.
- It uploads/prints advisory reports only; it never executes PR-head Node/package scripts.

- [ ] **Step 1: Extend RED workflow tests.** Require base SHA checkout, `persist-credentials: false`, fetch of head object only for `git diff --name-only`, execution of base-branch classifier, and absence of `npm ci`/`npm run` after PR-head material is fetched.

```ts
assert.match(yaml, /github\.event\.pull_request\.base\.sha/);
assert.match(yaml, /github\.event\.pull_request\.head\.sha/);
assert.match(yaml, /git diff --name-only/);
assert.match(yaml, /node tools\/community-review\.ts/);
assert.equal(/pull-requests:\s*write/.test(yaml), false);
```

- [ ] **Step 2:** Run `node --test tests/community-workflow.test.ts`; expect FAIL for missing PR job.
- [ ] **Step 3:** Add `pull_request` trigger and `review` job with `if: github.event_name == 'pull_request'` and `contents: read` only. At the same time guard the existing `freshness` job with `if: github.event_name != 'pull_request'` and keep its checkout explicitly on protected `main`. For the review job, checkout `${{ github.event.pull_request.base.sha }}` first; install dependencies/tooling from that trusted base before fetching the untrusted head object.
- [ ] **Step 4:** Fetch head SHA with Git only, produce newline path list from `git diff --name-only baseSHA headSHA`, then run the already-loaded base-branch classifier. Do not checkout the head tree and do not run PR-supplied package scripts.
- [ ] **Step 5:** Upload canonical report and append a human-readable summary to `$GITHUB_STEP_SUMMARY`; no comments, checks mutations, labels or PR-state writes.
- [ ] **Step 6:** Run workflow tests + repository policy; expect PASS.
- [ ] **Step 7:** Commit as `ci: add read-only community PR assistance`.
### Task 6: Contribution/governance documentation and authority tests

**Files:**
- Modify: `CONTRIBUTING.md`, `GOVERNANCE.md`, `docs/knowledge-review.md`
- Modify: `tools/repository.ts`
- Create: `tests/community-authority.test.ts`

**Interfaces:**
- Public docs describe candidate intake, freshness reports and PR summaries as non-authoritative.
- Repository policy requires dictionary/community workflow/tooling files after Stage 5B lands.

- [ ] **Step 1: Write RED authority tests.** Inspect workflow/tool/docs text and reject automation language/actions that can set `Reviewed`, change runtime approval digests, auto-merge, push branches, create issues, comment, label or grant write permissions.

```ts
for (const forbidden of ["issues: write", "pull-requests: write", "contents: write", "gh issue create", "gh pr merge", "gh pr comment"]) {
  assert.equal(surface.includes(forbidden), false, forbidden);
}
assert.match(governance, /Bots cannot approve/i);
assert.match(contributing, /candidate/i);
```

- [ ] **Step 2:** Run `node --test tests/community-authority.test.ts`; expect FAIL until docs/policy are updated.
- [ ] **Step 3:** Document the exact path: issue/report -> candidate PR -> existing validation/evidence -> human review -> immutable promotion -> separate runtime approval. State that job summaries and artifacts are not approval.
- [ ] **Step 4:** Document dictionary PR requirements: strict rule schema, positive + negative gold cases, ambiguity/conflict checks and manual/text equivalence.
- [ ] **Step 5:** Add Stage 5B required files to repository policy without weakening existing secret/license/integrity checks.
- [ ] **Step 6:** Run authority tests, repository policy and Stage 4 text tests; expect PASS.
- [ ] **Step 7:** Commit as `docs: govern community candidate automation`.
### Task 7: Stage 5B assurance and Stage 5 closure

**Files:**
- Modify: `assurance/requirements.json`, `assurance/evidence-contract.schema.json`, `tools/evidence.ts`, `tests/assurance.test.ts`
- Modify: `README.md`, `docs/architecture.md`, `docs/verification.md`, `docs/threat-model.md`, `SECURITY.md`
- Create: `docs/decisions/0008-community-candidate-automation.md`

**Interfaces:**
- Advance final Stage 5 assurance scope to `stage-5-github-native-runtime-community`.
- Preserve 5A controls C24–C28 and add C29–C32 for deterministic freshness, dictionary intake, read-only PR classification and automation authority separation.

- [ ] **Step 1: Write RED assurance tests.** Require C29 -> `tests/source-candidates.test.ts`; C30 -> `tests/dictionary-issue-form.test.ts`; C31 -> `tests/community-review.test.ts` + `tests/community-workflow.test.ts`; C32 -> `tests/community-authority.test.ts`.
- [ ] **Step 2:** Update assurance/evidence scope, ADR 0008 and public docs without claiming automated factual discovery, automated review, 5C repository access, Beta release or general recommendation accuracy.
- [ ] **Step 3:** Threat model adds malicious issue content, path-classifier manipulation, untrusted PR-code execution, automation permission creep and bot-output-as-authority confusion.
- [ ] **Step 4:** Run formatter canary on immutable Reviewed manifest; require SHA remains `a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`.
- [ ] **Step 5:** Run `npm run verify`, `npm run evidence`, `npm run build:pages`, `npm audit --audit-level=low`, pinned Gitleaks working tree/history; expect PASS.
- [ ] **Step 6:** Upgrade private GRANIT adapter from Stage 5A to final Stage 5 source-only control set; require selftests PASS and exact subject READY with zero failures/unresolved/input errors.
- [ ] **Step 7:** Append/read-back Notion pre-promotion checkpoint with 5A Pages state, 5B report/form/classifier evidence, exact source subject and explicit 5C/Stage6 exclusions.
- [ ] **Step 8:** Commit final Stage 5 assurance tree as `docs: complete Stage 5 assurance` only after all source/evidence gates are green.
### Task 8: Final Stage 5 promotion and closure

**Files:** no new product behavior; promotion evidence only.

- [ ] **Step 1:** Inspect staged/public tree, `git diff --check`, file sizes and disclosure firewall; reject reports, private paths, worktrees and local tool artifacts.
- [ ] **Step 2:** Rerun exact-head verify/evidence/audit/Gitleaks, deterministic freshness report twice with identical timestamp/window, deterministic PR classifier twice with identical path list, and Pages artifact byte replay.
- [ ] **Step 3:** Push exact Stage 5 PR head. Require Security, Verify Ubuntu/Windows, Cross-platform replay, Pages build/policy and Community workflow/policy checks to succeed on that head; require zero open review threads.
- [ ] **Step 4:** Squash-merge through protected `main`; verify feature/main Git-tree equality before deleting any feature workspace.
- [ ] **Step 5:** On true main rerun verify/evidence/audit/Gitleaks/private GRANIT and confirm the Pages `workflow_run` deploy uses the exact successful main Verify SHA.
- [ ] **Step 6:** Observe at least one read-only Community workflow run from main: freshness artifact/job summary produced; no issue, comment, label, branch or knowledge mutation occurs.
- [ ] **Step 7:** Remove merged feature worktree/branch only after main evidence is complete; avoid nested worktrees inside the repo root because whole-tree tooling scans them.
- [ ] **Step 8:** Append/read-back `Stage 5 — CLOSED` with exact merge SHA, tree identity, Pages deployment state, community workflow evidence, source/runtime digests, final source subject and GRANIT result.
- [ ] **Step 9:** Explicitly record that 5C remains optional/deferred and Stage 6 remains the first `v0.0.1 Beta` release stage.

## 5B Self-review checklist

- Every Stage 5B spec requirement maps to Tasks 1–8.
- Freshness logic has no host-clock or hidden review-window default in its pure function.
- PR workflow executes trusted base tooling, not PR-head code.
- Automation has no write permission and cannot produce Reviewed/runtime approval.
- Dictionary intake cannot bypass Stage 4 schema/gold/equivalence gates.
- Final assurance preserves all 5A controls and adds C29–C32 without renumbering earlier controls.
- No 5C authentication/repository-read implementation or Stage 6 release claim is present.
- No placeholder implementation step remains.