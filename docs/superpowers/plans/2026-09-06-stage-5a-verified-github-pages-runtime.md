# Stage 5A Verified GitHub Pages Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the existing Stage 3/4 language surface as a static GitHub Pages runtime bound to an explicitly approved, minimal Reviewed projection without changing ordinary caller-supplied runtime trust.

**Architecture:** A deployment-only profile approves both the exact Reviewed source manifest and an exact 16-document runtime projection. Node-only build tooling derives that projection from already-Reviewed bytes, verifies both digests, embeds inert runtime data before `app.js`, and leaves `src/ui/runtime.ts`, `src/ui/main.ts` and ordinary `npm run build:browser` trust semantics unchanged.

**Tech Stack:** TypeScript, Node 24.15.0, npm 11.12.1, AJV already in-tree, existing `esbuild-wasm@0.28.2`, GitHub Actions and GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-06-stage-5-github-native-runtime-community-design.md` at commit `e3b4997064952271691bcf2e1ff827c627369a42`.

## Global Constraints
- Source manifest SHA-256 is exactly `a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`.
- Runtime projection SHA-256 is exactly `a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec`.
- Runtime projection contains exactly the 16 paths frozen in the Stage 5 spec; no volatile current-version claim is included.
- Ordinary `bootstrapUiRuntime()` still requires caller-supplied trusted digests; no core/default runtime pin is added.
- Pages remains static: no runtime `fetch()`, provider API, telemetry, backend, secret or repository credential.
- `evaluatedAt` is created at page load with `new Date().toISOString()`, never frozen at deployment time.
- No Beta/versioned release/general accuracy claim is introduced.
- Third-party Actions are pinned to immutable commit SHAs; deployment permissions are least privilege.

---
### Task 1: Deployment profile contract

**Files:**
- Create: `deployments/github-pages/runtime-profile.schema.json`
- Create: `deployments/github-pages/runtime-profile.json`
- Create: `tools/pages-profile.ts`
- Test: `tests/pages-profile.test.ts`

**Interfaces:**
- Produce `PagesRuntimeProfile` with exact fields from the frozen spec.
- Produce `parsePagesRuntimeProfile(raw: string): PagesRuntimeProfile`.
- Validate `base_project` through existing `validateDocument("project-facts", ...)`.

- [ ] **Step 1: Write the failing profile test.** Assert exact source/runtime digests, sorted unique 16-path allowlist, `candidate_type === "language"`, matching component/base-project IDs, candidate/traversal/absolute-path rejection, additional-property rejection and malformed-project rejection.

```ts
const profile = parsePagesRuntimeProfile(await readFile(profilePath, "utf8"));
assert.equal(profile.approved_source_manifest_sha256, SOURCE_SHA);
assert.equal(profile.approved_runtime_manifest_sha256, RUNTIME_SHA);
assert.equal(profile.runtime_document_paths.length, 16);
assert.deepEqual([...profile.runtime_document_paths].sort(), profile.runtime_document_paths);
assert.throws(() => parsePagesRuntimeProfile(tamper({ runtime_document_paths: ["../x"] })), /runtime path/i);
```

- [ ] **Step 2:** Run `node --test tests/pages-profile.test.ts`; expect FAIL because the parser/schema/profile do not exist.
- [ ] **Step 3: Implement the profile parser and frozen profile.** Use repository `parseStrictJson()` plus AJV against the deployment-local schema; reject any path not matching `^(claims|dimensions|entities|sources)/[a-z0-9._-]+\.json$` and require lexical sorting/uniqueness.

```ts
export interface PagesRuntimeProfile {
  schema_version: "0.1";
  deployment_id: "github-pages";
  source_manifest_path: string;
  approved_source_manifest_sha256: string;
  runtime_knowledge_snapshot: string;
  approved_runtime_manifest_sha256: string;
  runtime_document_paths: readonly string[];
  candidate_type: "language";
  component_id: string;
  base_project: Record<string, unknown>;
}
```

- [ ] **Step 4:** Run `node --test tests/pages-profile.test.ts`, `npm run typecheck` and `npm run check:repository`; expect PASS.
- [ ] **Step 5:** Commit only Task 1 files as `feat: add Pages runtime approval profile`.

### Task 2: Pure Reviewed runtime projection

**Files:**
- Create: `tools/pages-runtime.ts`
- Test: `tests/pages-runtime.test.ts`

**Interfaces:**
- Produce `projectPagesRuntime(profile, sourceManifestRaw, sourceFiles): Promise<ProjectedPagesRuntime>`.
- `ProjectedPagesRuntime` exposes `manifestRaw`, `manifestSha256`, `files`, `baseProject`, `candidateType`, `componentId`.
- No filesystem, host clock, DOM or GitHub API access inside the projection function.
- [ ] **Step 1: Write RED projection tests.** Cover exact source-manifest digest binding, missing/extra allowlist entry, listed-file digest mismatch, candidate/traversal rejection, canonical runtime-manifest bytes, exact approved runtime digest and post-expiry validity at `2026-09-07T00:00:00Z`.

```ts
const projected = await projectPagesRuntime(profile, sourceManifestRaw, sourceFiles);
assert.equal(projected.manifestSha256, RUNTIME_SHA);
assert.equal(Object.keys(projected.files).length, 16);
assert.equal(projected.manifestRaw.includes("current-stable-version"), false);
await verifySnapshot(projected.manifestRaw, projected.files, [RUNTIME_SHA], "2026-09-07T00:00:00Z");
```

- [ ] **Step 2:** Run `node --test tests/pages-runtime.test.ts`; expect FAIL because projection code does not exist.
- [ ] **Step 3: Implement source binding and projection.** Parse/validate the source snapshot manifest, hash exact raw bytes, index its document entries, verify every allowlisted file against the source entry, and construct a new canonical manifest preserving `rules_snapshot` and `schema_sha256` while replacing only `knowledge_snapshot` and `documents`.

```ts
const runtimeManifest = {
  schema_version: "0.1",
  knowledge_snapshot: profile.runtime_knowledge_snapshot,
  rules_snapshot: source.rules_snapshot,
  schema_sha256: source.schema_sha256,
  documents: profile.runtime_document_paths.map((path) => sourceByPath.get(path)),
};
const manifestRaw = encodeCanonical(runtimeManifest);
const manifestSha256 = await sha256(manifestRaw);
if (manifestSha256 !== profile.approved_runtime_manifest_sha256)
  throw new Error("Runtime projection approval mismatch");
```

- [ ] **Step 4:** Call existing `verifySnapshot()` inside the test on the projected bytes at the post-expiry instant; require PASS without modifying `verifySnapshot()`.
- [ ] **Step 5:** Run projection tests + snapshot/reference tests + typecheck; expect PASS.
- [ ] **Step 6:** Commit as `feat: derive approved Pages runtime projection`.
### Task 3: Deterministic Pages artifact builder

**Files:**
- Create: `tools/build-pages.ts`
- Modify: `package.json`
- Test: `tests/pages-build.test.ts`

**Interfaces:**
- Produce `buildPages(outDir: string): Promise<void>`.
- Add `npm run build:pages` => `node tools/build-pages.ts`.
- Output exactly `index.html`, `app.css`, `runtime.js`, `app.js`.

- [ ] **Step 1: Write RED artifact tests.** Build twice into fresh temp directories and require byte-identical outputs; assert `runtime.js` precedes `app.js`, ordinary `web/index.html` remains unchanged, and ordinary `buildBrowser()` still emits only its original three files.

```ts
await buildPages(firstDir);
await buildPages(secondDir);
assert.deepEqual(await treeBytes(firstDir), await treeBytes(secondDir));
const html = await readFile(join(firstDir, "index.html"), "utf8");
assert(html.indexOf("runtime.js") < html.indexOf("app.js"));
assert.deepEqual((await readdir(firstDir)).sort(), ["app.css", "app.js", "index.html", "runtime.js"]);
```

- [ ] **Step 2:** Run `node --test tests/pages-build.test.ts`; expect FAIL.
- [ ] **Step 3: Implement build orchestration.** Call `buildBrowser()` into a temporary directory, load/parse the checked-in profile, load the exact Reviewed source manifest/files, call `projectPagesRuntime()`, then copy browser bytes and create deployment-only `runtime.js`.
```ts
const payload = {
  snapshotManifest: projected.manifestRaw,
  snapshotFiles: projected.files,
  trustedSnapshotDigests: [projected.manifestSha256],
  candidateType: projected.candidateType,
  componentId: projected.componentId,
  baseProject: projected.baseProject,
};
const runtimeJs = `window.PLLDN_RUNTIME=${JSON.stringify(payload)};window.PLLDN_RUNTIME.evaluatedAt=new Date().toISOString();\n`;
```

- [ ] **Step 4: Make runtime serialization inert.** Before embedding, JSON-stringify only plain JSON values; reject `</script`, U+2028/U+2029 ambiguity and non-JSON values rather than generating executable content. Do not use `eval`, `Function`, template-supplied code or HTML interpolation.
- [ ] **Step 5:** Inject exactly `<script src="./runtime.js"></script>` immediately before the existing module `app.js` tag in the generated copy only; never edit `web/index.html` in place.
- [ ] **Step 6:** Run `node --test tests/pages-build.test.ts tests/browser-build.test.ts tests/ui-runtime.test.ts`; expect PASS.
- [ ] **Step 7:** Run `npm run build:browser`, hash/list `.build/site`, then `npm run build:pages`; prove the ordinary build still has no `runtime.js` and no embedded approval digest.
- [ ] **Step 8:** Commit as `feat: build verified static Pages artifact`.

### Task 4: Deployment artifact security contract

**Files:**
- Create: `tests/pages-security.test.ts`
- Modify: `tools/repository.ts`

**Interfaces:**
- Repository policy now requires the Stage 5A profile/schema/builder once this task lands.
- Security test inspects generated Pages bytes, not only TypeScript source.
- [ ] **Step 1: Write RED generated-byte security tests.** Reject private Windows paths, credential patterns, provider SDK markers, `eval(`, `new Function`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and unexpected external URLs in `runtime.js`/`app.js`.

```ts
for (const forbidden of ["ghp_", "github_pat_", "C:\\\\Users\\", "eval(", "new Function", "fetch(", "XMLHttpRequest", "WebSocket", "EventSource"]) {
  assert.equal(siteText.includes(forbidden), false, forbidden);
}
assert.match(runtime, /new Date\(\)\.toISOString\(\)/);
assert.equal(runtime.includes(SOURCE_SHA), false);
assert.equal(runtime.includes(RUNTIME_SHA), true);
```

- [ ] **Step 2:** Run `node --test tests/pages-security.test.ts`; expect FAIL until the artifact/security contract is implemented.
- [ ] **Step 3:** Add required Stage 5A files to `tools/repository.ts` and keep generic secret/private-path policy intact.
- [ ] **Step 4:** Ensure the deployment artifact contains the approved runtime projection digest but does not expose the complete source-manifest approval as the runtime trust pin.
- [ ] **Step 5:** Run Pages security, repository policy and existing Stage 4 no-network contract tests; expect PASS.
- [ ] **Step 6:** Commit as `test: enforce Pages deployment boundary`.

### Task 5: Exact-SHA GitHub Pages workflow

**Files:**
- Create: `.github/workflows/pages.yml`
- Create: `tests/pages-workflow.test.ts`

**Interfaces:**
- Automatic trigger: `workflow_run` for successful `Verify` on `main`.
- Manual trigger: `workflow_dispatch`, but deployment job rejects any ref other than protected `main`.
- Build job has `contents: read`; deploy job alone has `pages: write` and `id-token: write`.
- [ ] **Step 1: Write RED workflow-policy tests.** Parse YAML as text and require exact action pins, `workflow_run` binding to `Verify`, success/main guards, exact checkout SHA expression, audit + Gitleaks + `npm run build:pages`, artifact upload and least-privilege permissions.

```ts
const yaml = await readFile(".github/workflows/pages.yml", "utf8");
assert.match(yaml, /workflow_run:/);
assert.match(yaml, /github\.event\.workflow_run\.head_sha/);
assert.match(yaml, /conclusion == 'success'/);
assert.match(yaml, /head_branch == 'main'/);
assert.match(yaml, /npm audit --audit-level=low/);
assert.match(yaml, /npm run build:pages/);
```

- [ ] **Step 2:** Run `node --test tests/pages-workflow.test.ts`; expect FAIL.
- [ ] **Step 3: Implement the workflow with immutable pins.** Use existing pins for checkout/setup-node/upload-artifact where applicable and these Pages pins resolved during planning:
  - `actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d` (`v6.0.0`)
  - `actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9` (`v5.0.0`)
  - `actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128` (`v5.0.0`) — refreshed 2026-09-06 after official tag verification; the previously planned v5.0.1 pin is not an official release.
- [ ] **Step 4:** For automatic runs, checkout `${{ github.event.workflow_run.head_sha }}` with `persist-credentials: false`. Add one read-only stale-main guard that fetches `refs/heads/main` and requires it still equals the verified `head_sha` before artifact upload; a superseded main commit must never redeploy over a newer Pages state. Add `concurrency: { group: pages, cancel-in-progress: true }`.
- [ ] **Step 5:** Reuse the pinned Gitleaks `v8.30.1` archive URL and SHA-256 from `security.yml`; do not curl an unverified binary.
- [ ] **Step 6:** Manual dispatch sets the target SHA from `github.sha` only when `github.ref == 'refs/heads/main'`; otherwise the build/deploy jobs are skipped/fail closed.
- [ ] **Step 7:** Run workflow-policy tests and repository policy; expect PASS.
- [ ] **Step 8:** Commit as `ci: deploy verified Pages runtime`.
### Task 6: Stage 5A assurance and public documentation

**Files:**
- Modify: `assurance/requirements.json`
- Modify: `assurance/evidence-contract.schema.json`
- Modify: `tools/evidence.ts`
- Modify: `tests/assurance.test.ts`
- Modify: `README.md`, `docs/architecture.md`, `docs/verification.md`, `docs/threat-model.md`, `SECURITY.md`
- Create: `docs/decisions/0007-verified-github-pages-runtime.md`

**Interfaces:**
- Advance assurance scope to `stage-5a-verified-github-pages-runtime`.
- Add controls after C23 for dual-digest Pages approval, minimal Reviewed projection, ordinary-build trust isolation, generated-artifact security and exact-SHA deployment gating.

- [ ] **Step 1: Write RED assurance mapping tests.** Require the new scope and exact test mappings to `pages-profile`, `pages-runtime`, `pages-build`, `pages-security`, and `pages-workflow` tests.
- [ ] **Step 2:** Run `node --test tests/assurance.test.ts`; expect FAIL.
- [ ] **Step 3:** Update assurance requirements/evidence scope and docs. State explicitly that Pages is pre-release, language-surface-only, uses a 16-document approved projection, contains no current-version claims, and is not v0.0.1 Beta.
- [ ] **Step 4:** ADR 0007 records why complete Reviewed-pack embedding was rejected and why deployment approval is separate from source review.
- [ ] **Step 5:** Threat model adds whole-pack expiry DoS, trust-profile tampering, wrong-SHA deployment, generated-script injection, secret leakage and workflow-permission escalation.
- [ ] **Step 6:** Run formatter canary: hash `knowledge/reviewed/stage2-core.manifest.json` before and after `npm run format`; require exact unchanged SHA `a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`.
- [ ] **Step 7:** Run `npm run verify`, `npm run evidence`, `npm run build:pages`, `npm audit --audit-level=low`; expect PASS.
- [ ] **Step 8:** Commit as `docs: complete Stage 5A assurance`.
### Task 7: 5A promotion, deployment observation and checkpoint

**Files:** no new product behavior; promotion evidence only.

- [ ] **Step 1:** Inspect staged/public tree, `git diff --check`, tracked-file sizes and disclosure firewall; reject local paths, reports, private assurance artifacts and nested worktrees.
- [ ] **Step 2:** Run exact-head `npm run verify`, `npm run evidence`, `npm audit --audit-level=low`, pinned Gitleaks on working tree and full history, and `npm run build:pages` twice with byte comparison.
- [ ] **Step 3:** Upgrade private GRANIT source-only adapter for Stage 5A controls; require synthetic adapter tests PASS and exact-source assessment `READY` with zero failures/unresolved/input errors. Do not treat GRANIT as evidence that Pages is live.
- [ ] **Step 4:** Append/read-back Notion pre-promotion checkpoint with exact commit, source subject, source/runtime digests, generated artifact evidence, assurance result and explicit no-Beta claim.
- [ ] **Step 5:** Push the Stage 5 branch and open/update the Stage 5 PR. Require existing Security + Verify Ubuntu/Windows + Cross-platform replay plus the new Pages policy/build checks on the exact PR head.
- [ ] **Step 6:** Do not claim Pages live from a PR run. Merge only after all required checks and review threads are clean; then observe the `workflow_run` Pages execution on the exact successful main Verify SHA.
- [ ] **Step 7:** Confirm the Pages deployment job succeeded and the published artifact SHA corresponds to the generated main artifact. Smoke-check that the public page boots through `verifySnapshot()`, renders Stage 4 text assistance, and does not auto-confirm text.
- [ ] **Step 8:** Rerun true-main verify/evidence/audit/Gitleaks/private assurance after merge. Append/read-back `Stage 5A — CLOSED` only after successful main Pages deployment; keep Stage 5 overall OPEN until 5B closes.

## 5A Self-review checklist

- Every Stage 5A spec requirement maps to Tasks 1–7.
- No task modifies `src/ui/runtime.ts` or adds a core/default approval pin.
- The source/runtime digest distinction remains explicit in profile, tests, artifact and docs.
- The four volatile current-version claims never enter the Pages projection.
- `build:browser` and `build:pages` remain distinct outputs.
- No 5C authentication/repository-read behavior or Stage 6 release claim is present.
- No placeholder implementation step remains.