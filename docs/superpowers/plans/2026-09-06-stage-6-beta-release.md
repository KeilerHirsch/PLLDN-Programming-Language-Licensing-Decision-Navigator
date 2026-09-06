# Stage 6 — v0.0.1 Beta 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish PLLDN `v0.0.1-beta.1` as the first immutable, evidence-bearing GitHub prerelease bound to an exact protected-main commit and the already verified Pages runtime.

**Architecture:** Stage 6 adds a deterministic release-control plane around the existing Stage 5 product. A read-only build domain produces and verifies six release assets; a separate write-capable publication domain consumes only those verified bytes and executes no repository code. Repository-admin immutable-release enablement remains an explicit maintainer-side pre-dispatch gate because ordinary `GITHUB_TOKEN` permissions do not provide repository Administration access.

**Tech Stack:** Node.js 24.15.0, npm 11.12.1, TypeScript 7, Node test runner, GitHub Actions, GitHub CLI 2.92+, CycloneDX from `npm sbom`, existing canonical JSON/SHA-256 utilities, private GRANIT.

**Spec:** `docs/superpowers/specs/2026-09-06-stage-6-beta-release-design.md`

## Global Constraints

- Release identity is exactly tag `v0.0.1-beta.1`, title `PLLDN v0.0.1 Beta 1`, package version `0.0.1-beta.1`, GitHub prerelease, no npm publication.
- `package.json` remains `private: true`.
- Release target is an exact 40-hex protected-`main` SHA and must equal current `origin/main` before artifact creation.
- Stage 5C, broader coverage, license-recommendation UX, hosted inference and account/repository import remain out of scope.
- Public live coverage is exactly four languages and four boolean capability dimensions; eight SPDX license identities are Reviewed-but-not-live.
- Existing Reviewed source manifest SHA-256 remains `a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`.
- Existing approved Pages runtime projection SHA-256 remains `a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec`.
- Project-generated release evidence contains no host wall-clock, GitHub run ID or runner identity.
- Published artifacts are immutable; any defect after publication requires a superseding release identity.
- Exact public asset set: `plldn-v0.0.1-beta.1-pages.tar.gz`, `release-evidence.json`, `reviewed-coverage.json`, `known-limitations.md`, `sbom.cdx.json`, `SHA256SUMS`.
- Every production task is RED→GREEN→REFACTOR with an atomic commit before the next task.
- No tag, release or repository-admin setting is mutated before Tasks 9–10 promotion gates.

## File map

- `release/v0.0.1-beta.1/policy.json` — checked-in release identity, coverage, limitations and exact asset contract.
- `release/v0.0.1-beta.1/release-notes.md` — reviewed GitHub Release prose source.
- `schemas/release-policy.schema.json` — strict release-policy contract.
- `tools/release-policy.ts` — parse/cross-check release policy against package and trust inputs.
- `tools/release-coverage.ts` — canonical `reviewed-coverage.json` and deterministic limitations renderer.
- `tools/release-archive.ts` — platform-independent POSIX tar + normalized gzip generation.
- `tools/release-sbom.ts` — canonicalize `npm sbom` output against the explicit release epoch.
- `tools/build-release.ts` — orchestrate the six assets plus internal `publication-manifest.json`.
- `assurance/release-evidence.schema.json` — public release-evidence contract.
- `assurance/publication-manifest.schema.json` — internal build→publish handoff contract.
- `.github/workflows/release.yml` — manual exact-SHA build/publish workflow.
- `CHANGELOG.md`, `README.md` — public Beta identity and bounded coverage.
- `docs/decisions/0009-immutable-beta-release.md` — Stage-6 release architecture decision.
- `assurance/requirements.json`, `assurance/evidence-contract.schema.json`, `tools/evidence.ts` — C33–C38 and Stage-6 evidence scope.

---
### Task 1: Release policy and identity binding

**Files:**
- Create: `release/v0.0.1-beta.1/policy.json`
- Create: `schemas/release-policy.schema.json`
- Create: `release/v0.0.1-beta.1/release-notes.md`
- Create: `tools/release-policy.ts`
- Modify: `package.json`
- Test: `tests/release-policy.test.ts`

**Interfaces:**
- Produces `parseReleasePolicy(raw: string): ReleasePolicy` and `validateReleaseIdentity(policy: ReleasePolicy): void`.
- `ReleasePolicy` freezes tag/title/version, exact six public asset names, trust digests, coverage IDs, unsupported surfaces and release-notes path.

- [ ] **Step 1: Write the failing identity/schema tests.**

```ts
const policy = parseReleasePolicy(readFileSync("release/v0.0.1-beta.1/policy.json", "utf8"));
assert.equal(policy.tag, "v0.0.1-beta.1");
assert.equal(policy.version, "0.0.1-beta.1");
assert.deepEqual(policy.assets, EXPECTED_RELEASE_ASSETS);
assert.doesNotThrow(() => validateReleaseIdentity(policy));
```

Add negative cases for additional properties, duplicate/renamed assets, wrong tag/title/version, wrong trust digests, `private:false`, path traversal and an unsupported release-notes path.

- [ ] **Step 2: Run `node --test tests/release-policy.test.ts` and verify RED** because the policy/parser do not exist.
- [ ] **Step 3: Implement the strict policy schema/parser and update package version.**

```ts
export interface ReleasePolicy {
  schema_version: "0.1";
  version: "0.0.1-beta.1";
  tag: "v0.0.1-beta.1";
  title: "PLLDN v0.0.1 Beta 1";
  prerelease: true;
  assets: readonly string[];
  reviewed_source_manifest_sha256: string;
  runtime_projection_sha256: string;
  live_language_ids: readonly string[];
  live_dimension_ids: readonly string[];
  reviewed_not_live_license_ids: readonly string[];
  unsupported_surfaces: readonly string[];
  release_notes_path: string;
}
```

Use existing strict JSON/AJV patterns; reject unknown keys and unsafe paths. Update both `package.json` and lockfile root metadata to `0.0.1-beta.1`, preserving `private:true`. Write the final reviewed Beta-1 release-note source here so later asset generation never depends on synthesized prose.

- [ ] **Step 4: Run targeted tests, typecheck and repository policy; verify GREEN.**
- [ ] **Step 5: Commit:** `feat: freeze beta release identity`

### Task 2: Reviewed coverage and known-limitations generators

**Files:**
- Create: `tools/release-coverage.ts`
- Test: `tests/release-coverage.test.ts`

**Interfaces:**
- Produces `buildReviewedCoverage(policy: ReleasePolicy, targetSha: string): Promise<string>` returning canonical JSON.
- Produces `renderKnownLimitations(policy: ReleasePolicy): string` returning LF-only Markdown with a terminal newline.
- [ ] **Step 1: Write RED tests against the real Reviewed manifest and Pages profile.**

```ts
const coverage = JSON.parse(await buildReviewedCoverage(policy, "a".repeat(40)));
assert.deepEqual(coverage.live.languages, [
  "entity.language.go", "entity.language.python", "entity.language.rust", "entity.language.typescript",
]);
assert.equal(coverage.live.dimensions.length, 4);
assert.equal(coverage.reviewed_not_live.licenses.length, 8);
assert.match(renderKnownLimitations(policy), /does not.*complete.*license/iu);
```

Add mutation fixtures proving generation fails if any frozen language/dimension/license ID disappears, moves into the runtime projection unexpectedly, or either frozen trust digest changes.

- [ ] **Step 2: Run `node --test tests/release-coverage.test.ts` and verify RED.**
- [ ] **Step 3: Implement generation from checked-in trust data.**

The generator must read and hash `knowledge/reviewed/stage2-core.manifest.json`, parse `deployments/github-pages/runtime-profile.json`, confirm every policy ID is present in the expected Reviewed/runtime set, and serialize through existing `encodeCanonical()`.

The limitations renderer must derive its bullets from `policy.unsupported_surfaces`; do not maintain a second hand-written list in code.

- [ ] **Step 4: Run coverage tests twice and compare output bytes; run typecheck/repository policy.**
- [ ] **Step 5: Commit:** `feat: generate beta coverage boundaries`

### Task 3: Deterministic Pages release archive

**Files:**
- Create: `tools/release-archive.ts`
- Test: `tests/release-archive.test.ts`
**Interfaces:**
- Produces `buildDeterministicTarGz(root: string, epochSeconds: number): Promise<Buffer>`.
- Consumes only regular files/directories beneath `root`; rejects symlinks, absolute/traversal names and unsupported filesystem objects.

- [ ] **Step 1: Write RED tests with a nested fixture and two different host mtimes.**

```ts
const a = await buildDeterministicTarGz(fixtureA, 1_788_739_200);
const b = await buildDeterministicTarGz(fixtureB, 1_788_739_200);
assert.deepEqual(a, b);
assert.equal(a[4], 0); // normalized gzip MTIME bytes begin here
assert.equal(a[9], 255); // normalized gzip OS byte
```

Also parse the produced ustar headers in the test and assert lexicographic names, file mode `0644`, directory mode `0755`, uid/gid `0`, fixed timestamp, no host path separators, and correct file payloads. Add symlink/traversal rejection tests.

- [ ] **Step 2: Run `node --test tests/release-archive.test.ts` and verify RED.**
- [ ] **Step 3: Implement a small POSIX ustar writer using Node `Buffer` plus `zlib.gzipSync`.**

Use sorted relative POSIX paths, explicit ustar checksums, two terminal zero blocks, gzip level 9/mtime 0, then normalize the gzip OS byte to `255`. Do not add a tar dependency.

- [ ] **Step 4: Run the archive tests on Windows and require byte-identical repeat output.**
- [ ] **Step 5: Commit:** `feat: build deterministic pages release archive`

### Task 4: Canonical CycloneDX SBOM

**Files:**
- Create: `tools/release-sbom.ts`
- Test: `tests/release-sbom.test.ts`
**Interfaces:**
- Produces `canonicalizeCycloneDx(raw: string, releaseEpochIso: string): string`.
- Canonicalization preserves dependency meaning while removing/replacing volatile identity.

- [ ] **Step 1: Write RED tests with two semantically identical SBOM fixtures that differ only in timestamp, serial number and unordered arrays.**

```ts
const one = canonicalizeCycloneDx(rawA, "2026-09-06T21:00:00.000Z");
const two = canonicalizeCycloneDx(rawB, "2026-09-06T21:00:00.000Z");
assert.equal(one, two);
const sbom = JSON.parse(one);
assert.equal(sbom.metadata.timestamp, "2026-09-06T21:00:00.000Z");
assert.equal("serialNumber" in sbom, false);
```

Require stable sorting for components by `bom-ref`, dependencies by `ref`, metadata properties by name/value, and other explicitly recognized unordered arrays. Fail closed on unsupported top-level CycloneDX shape instead of recursively sorting every array.

- [ ] **Step 2: Run `node --test tests/release-sbom.test.ts` and verify RED.**
- [ ] **Step 3: Implement strict normalization plus `encodeCanonical()`.**
- [ ] **Step 4: After `npm ci`, run `npm sbom --sbom-format cyclonedx` twice, canonicalize both with the same epoch, and assert equal SHA-256.**
- [ ] **Step 5: Commit:** `feat: canonicalize beta sbom`

### Task 5: Release asset builder, evidence and checksum contract

**Files:**
- Create: `assurance/release-evidence.schema.json`
- Create: `assurance/publication-manifest.schema.json`
- Create: `tools/build-release.ts`
- Test: `tests/release-assets.test.ts`
- Modify: `package.json` scripts
**Interfaces:**
- Adds `npm run build:release -- --target-sha <40hex> --epoch <ISO8601>`.
- Produces `.build/release/public/` containing exactly the six public assets and `.build/release/internal/publication-manifest.json`.
- `publication-manifest.json` contains identity, target SHA, all six expected names/digests and the reviewed release-notes text/hash; it is transport metadata, not a public release asset.

- [ ] **Step 1: Write RED asset-contract tests.**

```ts
await buildRelease({ targetSha, releaseEpoch, outDir });
assert.deepEqual((await readdir(join(outDir, "public"))).sort(), EXPECTED_RELEASE_ASSETS);
assert.equal(JSON.parse(await read("release-evidence.json")).target_commit_sha, targetSha);
assert.match(await read("SHA256SUMS"), /^[0-9a-f]{64}  /mu);
```

Add negative cases for HEAD/target mismatch, missing `reports/evidence.json`, evidence subject mismatch, unexpected Pages filename, changed trust digest, extra public asset, and circular/self checksum attempts.

- [ ] **Step 2: Run `node --test tests/release-assets.test.ts` and verify RED.**
- [ ] **Step 3: Implement the orchestrator.**

Order is fixed: validate target/policy → consume verified repo evidence → build Pages twice and compare → archive twice and compare → generate/canonicalize SBOM → coverage → limitations → release evidence → `SHA256SUMS` last → validate exact asset set → internal publication manifest.

`release-evidence.json` records commit SHA/timestamp, source-tree digest, repository evidence digest, check summary, Node/npm, both trust digests, four Pages-file hashes, archive/coverage/limitations/SBOM hashes, immutable-release requirement=`required`, workflow path and policy-schema hash. It must not contain workflow run IDs or the checksum file digest.

- [ ] **Step 4: Run `npm run build:release` twice from identical inputs and recursively byte-compare public outputs and publication manifest.**
- [ ] **Step 5: Run targeted tests, typecheck and repository policy.**
- [ ] **Step 6: Commit:** `feat: build evidence-bound beta assets`
### Task 6: Reviewed release notes, README and changelog

**Files:**
- Verify: `release/v0.0.1-beta.1/release-notes.md`
- Create: `CHANGELOG.md`
- Modify: `README.md`
- Test: `tests/release-docs.test.ts`

**Interfaces:**
- Release notes are consumed as data by `build-release.ts` and embedded in `publication-manifest.json`; the publish job never synthesizes prose.

- [ ] **Step 1: Write RED documentation-contract tests.**

```ts
assert.match(readme, /v0\.0\.1 Beta 1/u);
assert.match(readme, /GitHub Pages/u);
assert.match(readme, /Ko-fi/u);
assert.match(readme, /GitHub Sponsors/u);
assert.doesNotMatch(readme, /complete licensing decision surface/iu);
assert.match(changelog, /0\.0\.1-beta\.1/u);
```

Require the release notes and README to mention narrow 4-language/4-capability live scope, Reviewed-but-not-live license identities, abstention/limitations, immutable evidence, and voluntary funding without entitlement. Forbid certification, legal-advice, general-accuracy and complete-license-UX claims.

- [ ] **Step 2: Run `node --test tests/release-docs.test.ts` and verify RED.**
- [ ] **Step 3: Write the changelog and convert README from “no Beta yet” to the Beta-1 identity; review the Task-1 release notes against the same claim boundary without claiming broader live coverage.**
- [ ] **Step 4: Run docs tests, repository policy and disclosure-firewall search.**
- [ ] **Step 5: Commit:** `docs: prepare v0.0.1 beta 1 release`

### Task 7: Exact-SHA release workflow with authority separation
**Files:**
- Create: `.github/workflows/release.yml`
- Test: `tests/release-workflow.test.ts`

**Pinned actions:**
- `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (`v7.0.1`)
- `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` (`v7.0.0`)
- `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (`v7.0.1`)
- `actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` (`v8.0.1`)

- [ ] **Step 1: Write RED workflow-policy tests.**

Require `workflow_dispatch` only, mandatory `target_sha` and literal confirmation input `v0.0.1-beta.1`, global `contents: read`, build-job `contents: read`, publish-job only `contents: write`, no checkout/setup-node/npm/node in publish, immutable action SHAs, and no `pull_request`/`push` release trigger.

```ts
assert.match(workflow, /workflow_dispatch:/u);
assert.match(workflow, /TARGET_SHA/u);
assert.doesNotMatch(publishJob, /actions\/checkout|setup-node|npm |node /u);
assert.match(publishJob, /contents: write/u);
```

Also require build checkout `persist-credentials:false`, exact ref=`target_sha`, fetch/compare against `origin/main`, full verify/evidence/audit/Gitleaks, double release build, and one workflow-artifact handoff.

- [ ] **Step 2: Run `node --test tests/release-workflow.test.ts` and verify RED.**
- [ ] **Step 3: Implement the build job.**

Resolve release epoch with `git show -s --format=%ct "$TARGET_SHA"`; pass that explicit epoch to `build:release`. Reject any target not equal to fetched `refs/remotes/origin/main`. Upload one internal artifact containing `public/` plus `internal/publication-manifest.json`.

- [ ] **Step 4: Implement the publish job without repository checkout/code execution.**

Use pinned `download-artifact`, `sha256sum`, `jq` and the runner-provided `gh` only. Recompute all six asset digests against `publication-manifest.json`; reject an existing tag/release; materialize release-note text from the manifest; create a draft prerelease targeted to the exact SHA; upload all six assets; re-read the draft via GitHub API and compare tag/title/target plus every asset `digest`; only then clear `draft` while retaining `prerelease:true`.

Do **not** call the repository-admin immutable-release endpoint in Actions: `GITHUB_TOKEN` has no Administration permission. Immutable enable/verify is the maintainer-side gate in Task 10.

- [ ] **Step 5: Add failure cleanup for unpublished drafts only.** If publication fails after draft creation, an `if: failure()` cleanup may delete the release and tag only after re-reading and proving it is still `draft:true`, unpublished and targeted at the expected SHA; use `gh release delete <tag> --cleanup-tag --yes`. Never delete or mutate a published immutable release.
- [ ] **Step 6: Add a workflow test that explicitly forbids adding repository checkout or source execution to the publish job.**
- [ ] **Step 7: Parse the YAML with a real YAML parser in addition to regex/contract tests.**
- [ ] **Step 8: Run workflow tests, repository policy and full `npm run verify`.**
- [ ] **Step 9: Commit:** `ci: add immutable beta release workflow`

If GitHub artifact transport itself fails remotely, stop and diagnose the transport; do not merge build and publish authority or grant write permission to the source-executing job as a workaround.

### Task 8: Stage-6 assurance C33–C38 and private GRANIT extension

**Files:**
- Modify: `assurance/requirements.json`
- Modify: `assurance/evidence-contract.schema.json`
- Modify: `tools/evidence.ts`
- Modify: `tools/repository.ts`
- Modify: `tests/assurance.test.ts`
- Modify: `docs/architecture.md`, `docs/verification.md`, `docs/threat-model.md`, `SECURITY.md`
- Create: `docs/decisions/0009-immutable-beta-release.md`
**Interfaces:**
- Public evidence scope advances to `stage-6-beta-release`.
- C33–C38 map to release policy/identity, coverage/limitations, deterministic assets, authority separation, immutable public integrity and supersession closure.

- [ ] **Step 1: Extend `tests/assurance.test.ts` first and verify RED on old Stage-5 scope/C32 ceiling.**

```ts
assert.equal(requirements.scope, "stage-6-beta-release");
for (const id of ["PLLDN-C33","PLLDN-C34","PLLDN-C35","PLLDN-C36","PLLDN-C37","PLLDN-C38"])
  assert.ok(requirements.requirements.some((r) => r.id === id));
```

Map C33→release-policy/workflow tests, C34→release-coverage/docs, C35→archive/SBOM/assets, C36→workflow, C37→workflow plus post-publish evidence, C38→release evidence/supersession docs.

- [ ] **Step 2: Update requirements/evidence schema/tooling and repository required-file policy; make assurance GREEN.**
- [ ] **Step 3: Write ADR 0009 and update architecture/verification/threat/security docs with exact Beta boundaries and immutable supersession behavior.**
- [ ] **Step 4: Run formatter canary against `knowledge/reviewed/stage2-core.manifest.json`; digest must remain `a363cca90f...763d5`.**
- [ ] **Step 5: Run full `npm run verify`, `npm run evidence`, `npm audit`, Gitleaks tree/history and two complete `build:release` replays.**
- [ ] **Step 6: Extend private GRANIT adapter/tests from final Stage 5/C32 to Stage 6/C38; first synthetic RED, then GREEN.**
- [ ] **Step 7: Run GRANIT pre-promotion against the exact feature source digest; require READY with zero failures/unresolved/input errors.**
- [ ] **Step 8: Notion pre-promotion checkpoint, then commit:** `docs: complete Stage 6 assurance`

### Task 9: Promote the release implementation to protected main

**Files:** no new product files; promotion/evidence only.
- [ ] **Step 1: Fresh exact-HEAD verification.**

Require clean worktree; `npm ci --ignore-scripts`; `npm run verify`; `npm run evidence`; `npm audit --audit-level=low`; pinned Gitleaks tree/history; two release builds from the same target/epoch with recursive byte comparison; public-disclosure firewall; GRANIT READY on the same source digest.

- [ ] **Step 2: Confirm remote-main drift is zero and the feature branch is based on current protected main.**
- [ ] **Step 3: Push the exact verified commit stack and open the Stage-6 implementation PR.**
- [ ] **Step 4: Require GitHub Verify/Security and release-workflow policy checks green on the exact PR head; resolve any remote-only failure with a new RED→GREEN regression and re-bind evidence/GRANIT.**
- [ ] **Step 5: Merge only the reviewed exact head through the normal protected-main path; delete only the remote feature branch at merge time.**
- [ ] **Step 6: Prove feature/main Git-tree identity, fast-forward the primary main worktree, and rerun true-main Verify/Evidence/Audit/Gitleaks/release double-build.**
- [ ] **Step 7: Run private GRANIT against the exact true-main commit and source digest; require READY.**
- [ ] **Step 8: Observe main Verify/Security/Pages success and re-check the four live Pages files against the true-main `build:pages` bytes.**

Do not create the release tag during Task 9. `main` may contain the frozen Beta identity before publication, but Stage 6 remains OPEN until Task 10 completes the immutable public release.

### Task 10: Enable immutable releases, publish, verify and close Stage 6

**Files:** operational evidence/Notion only; no mutation of published release assets after publication.

- [ ] **Step 1: Maintainer-side repository admin gate.**

From the authenticated maintainer CLI, check:

```sh
gh api repos/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/immutable-releases
```
If the result is not enabled, execute the admin-only enable call once:

```sh
gh api --method PUT repos/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/immutable-releases
```

Then re-read and require `enabled:true`. Record the observed state in private promotion evidence/Notion; do not add an admin PAT/secret to Actions merely to perform this check.

- [ ] **Step 2: Confirm `v0.0.1-beta.1` tag and release do not already exist, then dispatch `release.yml` with exact true-main SHA and literal confirmation tag.**
- [ ] **Step 3: Observe build and publish jobs to SUCCESS; inspect job steps/artifact names and require the release target to equal the dispatched SHA.**
- [ ] **Step 4: Verify the public release identity.**

```sh
gh release view v0.0.1-beta.1 --json tagName,name,isDraft,isImmutable,isPrerelease,targetCommitish

gh release verify v0.0.1-beta.1 --format json
```

Require title `PLLDN v0.0.1 Beta 1`, `isDraft=false`, `isImmutable=true`, `isPrerelease=true`, exact target/tag commit and immutable attestation success.

- [ ] **Step 5: Download exactly the six public assets to a fresh directory; run `gh release verify-asset v0.0.1-beta.1 <file>` for every asset and verify `SHA256SUMS`.**
- [ ] **Step 6: Byte-compare all downloaded assets with a fresh true-main `build:release` output using the recorded target commit epoch.**
- [ ] **Step 7: Extract the published Pages archive and compare `index.html`, `app.css`, `app.js`, `runtime.js` byte-for-byte with both the local true-main Pages build and the live GitHub Pages URLs.**
- [ ] **Step 8: Run private GRANIT post-publication assessment against release tag, immutable/attestation state, downloaded asset digests and `release-evidence.json`; require READY/C01–C38 with zero failures/unresolved/input errors.**
- [ ] **Step 9: If any post-publish integrity check fails, do not edit the immutable release. Record the failure and open supersession planning for `v0.0.1-beta.2`.**
- [ ] **Step 10: On success, clean the Stage-6 worktree/local branch, verify primary `main` remains clean, and append Notion `Stage 6 — v0.0.1 Beta 1 — CLOSED` with exact tag, commit, source/evidence digests, asset hashes, release-attestation result, live-Pages byte proof and GRANIT result.**

## Final execution rule

The user has already approved the Stage-6 architecture. After this plan is reviewed and the single build GO is given, execution continues autonomously through Tasks 1–10. Pause only for a genuine architecture/product choice, destructive ambiguity, legal/security contradiction, or a gate that cannot be corrected safely and deterministically.
