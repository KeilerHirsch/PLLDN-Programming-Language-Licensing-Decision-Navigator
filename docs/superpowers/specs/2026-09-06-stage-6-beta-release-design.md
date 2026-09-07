# Stage 6 — v0.0.1 Beta Release Design

**Status:** Approved architecture, pre-implementation freeze
**Date:** 2026-09-06
**Baseline:** protected `main` at `edf105d1b4281c1ff13acbd5596124c17353c8af`  
**Stage:** 6 — first public Beta release

## Purpose

Stage 6 converts the verified Stage 5 source, Pages deployment and community control plane into PLLDN's first immutable public release without expanding the decision engine or weakening existing trust boundaries.

The release is evidence-bearing product publication, not a new recommendation subsystem.

The release identity is frozen to:

- Git tag: `v0.0.1-beta.1`
- GitHub release title: `PLLDN v0.0.1 Beta 1`
- package version: `0.0.1-beta.1`
- GitHub release state: prerelease
- npm publication: none
- `private: true`: retained

A later Beta correction uses a new version such as `v0.0.1-beta.2`; an already published Beta is never silently rewritten.

## Non-goals

Stage 6 must not:

- add GitHub App, OAuth, PAT, private-repository read or Stage 5C functionality;
- add a new recommendation engine, LLM, embedding path, statistical classifier or hosted inference service;
- claim broad recommendation accuracy, certification, legal correctness or completeness of the licensing surface;
- publish an npm package or remove `private: true`;
- make the Git tag itself sufficient evidence that a release is trustworthy;
- allow the publication job to execute repository source code;
- mutate an already published release, tag or release asset to fix a defect;
- convert automated candidate/freshness reports into factual or review authority.

Stage 0–5 trust boundaries remain authoritative. Filters and canonical project facts remain the only decision input; free text remains proposal-only until confirmation.

## Public Beta coverage

The Beta must publish a machine-readable reviewed coverage manifest and human-readable known limitations.

The live decision surface contains exactly four Reviewed languages:

- Go
- Python
- Rust
- TypeScript

The live decision surface contains exactly four boolean capability dimensions:

- Runtime garbage collection
- Safe-code memory safety without garbage collection
- Static type checker
- Emits JavaScript

The Reviewed Stage 2 source pack also contains eight SPDX license identities:

- MIT
- Apache-2.0
- EUPL-1.2
- MPL-2.0
- GPL-3.0-only
- GPL-3.0-or-later
- AGPL-3.0-only
- AGPL-3.0-or-later

Those license identities are Reviewed knowledge but are not part of the current Pages decision projection. Beta 1 must therefore state that the product direction includes licensing, while the live Beta decision UI does not yet provide a complete outgoing-license recommendation surface.

The Beta must also state that it does not currently provide:

- general architecture or PRD parsing;
- universal natural-language interpretation;
- repository import or private-repository inspection;
- complete license compatibility analysis;
- legal advice;
- certification or a general accuracy guarantee.

Correct abstention and narrow explicit coverage are release features, not defects to hide.

## Release identity and source binding

A release candidate is valid only when all version surfaces agree on `0.0.1-beta.1` and the target commit is an exact protected-`main` SHA.

The release workflow must reject a moving branch reference as the publication subject. Manual dispatch supplies or resolves an exact commit SHA, then verifies that the SHA is the current protected `main` head before any release artifact is built.

The final tag `v0.0.1-beta.1` is created only as part of publication after all build/evidence gates pass. A pre-existing conflicting tag or release is a hard failure.

## Immutable release requirement

Repository Immutable Releases must be enabled before the first public Beta is published.

The publication sequence is:

1. verify immutable-release repository configuration is enabled;
2. create a GitHub draft release for the exact release target;
3. upload the complete verified asset set;
4. verify the draft contains exactly the expected assets and digests;
5. publish it as a prerelease only after those checks succeed;
6. verify the resulting immutable release and individual assets through GitHub's release-integrity interface.

The workflow must never publish first and "fill in" assets afterward.

If immutable-release protection cannot be enabled or verified, Stage 6 stops before publication.

## Release asset set

The public release contains exactly these project-generated assets in addition to GitHub's own source archives:

- `plldn-v0.0.1-beta.1-pages.tar.gz`
- `release-evidence.json`
- `reviewed-coverage.json`
- `known-limitations.md`
- `sbom.cdx.json`
- `SHA256SUMS`

`SHA256SUMS` is generated last and covers the other five project-generated release assets, including `release-evidence.json`. It uses lowercase SHA-256 hex plus stable lexicographic filename order. `release-evidence.json` therefore does not contain the checksum file's own digest; this avoids a circular hash dependency.

The release workflow must fail closed on any extra, missing, duplicate or renamed project-generated asset.

## Deterministic Pages release archive

The Pages release archive must not depend on platform-specific `tar` behavior.

A small Node-based deterministic archiver must consume the already verified `build:pages` output and produce a gzip-compressed POSIX tar stream with:

- lexicographically sorted relative paths;
- no absolute or traversal paths;
- fixed uid/gid values;
- fixed owner/group names;
- normalized file modes;
- deterministic directory entries;
- deterministic file sizes and checksums;
- normalized tar timestamps derived from a single explicit release epoch;
- gzip `mtime = 0`;
- no host-specific path separators, extended attributes or filesystem metadata.

The release epoch is an explicit input derived from the release target commit timestamp and is recorded in `release-evidence.json`. The archiver does not read the host wall clock.

Two builds from identical source and release inputs must produce byte-identical tarballs.

## Reviewed coverage manifest

`reviewed-coverage.json` is a canonical JSON document generated from checked-in trust data and explicit release policy, not hand-maintained marketing prose.

It records at least:

- release version and exact source commit;
- Reviewed source-manifest SHA-256 `a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`;
- approved Pages runtime-projection SHA-256 `a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec`;
- live language entity IDs;
- live capability dimension IDs;
- Reviewed-but-not-live license entity IDs;
- explicit unsupported product surfaces.

Generation fails if current checked-in trust records no longer match the frozen coverage claims.

## Known limitations artifact

`known-limitations.md` is a release artifact generated from a checked-in release policy source so the published limitations are reviewable before release.

It must state plainly that Beta 1:

- has narrow four-language/four-capability live coverage;
- does not expose the Reviewed license identities as a complete live license decision workflow;
- does not parse arbitrary repositories, roadmaps or PRDs into authoritative project facts;
- does not provide general legal advice or license compatibility adjudication;
- does not claim comprehensive programming-language coverage;
- does not claim universal natural-language understanding or recommendation accuracy;
- does not implement Stage 5C repository-read integration;
- may abstain when available Reviewed facts are insufficient.

The release notes may summarize these limits but may not weaken or contradict them.

## Release evidence

`release-evidence.json` is canonical JSON and binds the release to exact evidence rather than to prose or mutable GitHub state.

It records at least:

- schema/version and release identity;
- release target commit SHA and commit timestamp;
- source-tree SHA-256;
- repository evidence SHA-256;
- verification result and coverage summary;
- Node/npm versions;
- Reviewed source-manifest SHA-256;
- Pages runtime-projection SHA-256;
- all four Pages file SHA-256 values;
- Pages tarball SHA-256;
- reviewed-coverage SHA-256;
- known-limitations SHA-256;
- SBOM SHA-256;
- immutable-release requirement state;
- release workflow path and release-policy schema identity.

The evidence asset contains no host wall-clock timestamp, GitHub run ID or runner identity. External workflow/run provenance is supplied by GitHub's release attestation and the closure record, not mixed into the reproducible project-generated evidence bytes.

## Release workflow architecture

Add a dedicated `.github/workflows/release.yml` with manual dispatch only for Beta 1.

The workflow is split into two authority domains.

### Build and verify job

The build job has `contents: read` only. It checks out the exact protected-main release target with credentials disabled and performs:

1. release-version and exact-main-SHA validation;
2. pinned Node/npm installation;
3. `npm ci --ignore-scripts`;
4. full `npm run verify`;
5. `npm run evidence`;
6. `npm audit --audit-level=low`;
7. pinned Gitleaks over the release source/history as required by policy;
8. deterministic `npm run build:pages` twice with byte comparison;
9. deterministic release archive generation twice with byte comparison;
10. CycloneDX SBOM generation followed by deterministic canonicalization: metadata timestamp is fixed to the explicit release epoch and random/runner-specific identity is removed or deterministically derived;
11. reviewed coverage and known-limitations generation;
12. release-evidence and checksum generation;
13. complete release-asset contract validation.

Only after all checks pass does this job upload one internal workflow artifact containing the six release assets and a small publication manifest.

### Publish job

The publish job receives only the verified workflow artifact. It does not check out the repository and does not run Node, npm or repository scripts.

It receives only the minimum GitHub permission required to create the tag/release and upload assets. It verifies the publication manifest and asset digests before using GitHub's release interface.

The job creates a draft, uploads the complete asset set, re-reads the draft release state, and publishes as a prerelease only when the expected target SHA, tag, title and asset digests all match.

## Release notes and public documentation

Add a checked-in release note source for Beta 1 and a `CHANGELOG.md` entry before publication. GitHub release prose is rendered from that reviewed source; the workflow does not synthesize marketing text.

README changes for the released commit must:

- replace the pre-release/no-Beta wording with `v0.0.1 Beta 1` status;
- keep the live GitHub Pages link prominent;
- link to the GitHub release, reviewed coverage and known limitations;
- keep Ko-fi and GitHub Sponsors visible;
- state that voluntary funding confers no feature entitlement, ranking influence or review authority;
- avoid implying that the current live UI already contains the complete licensing decision surface.

The live UI itself does not gain a new runtime version widget in Stage 6. Release identity is carried by source, README, GitHub Release and release evidence. A UI version surface requires a later product decision if needed.

## Post-publish verification

Publication is not Stage 6 closure.

After the prerelease becomes public, the closure gate must:

1. verify the immutable release/tag through GitHub's release-integrity interface;
2. download every project-generated release asset from the public release;
3. verify each asset's GitHub release attestation/integrity where supported;
4. verify `SHA256SUMS` against downloaded assets;
5. compare downloaded assets byte-for-byte with the locally/CI verified release outputs;
6. extract the published Pages tarball and compare its four files byte-for-byte with the currently live GitHub Pages deployment;
7. confirm the tag resolves to the exact released protected-main commit;
8. confirm the GitHub release is marked prerelease and immutable;
9. rerun private GRANIT against the published release identity/evidence.

A release that publishes successfully but fails any post-publish check is not silently repaired. The release is retained as evidence and a superseding Beta is prepared.

## Assurance controls

Stage 6 extends the public assurance plane with C33–C38.

- **C33 — Release identity binding.** Package version, Git tag, release title/state and exact protected-main target must agree. No moving-ref or pre-existing conflicting tag is accepted.
- **C34 — Coverage and limitations binding.** Machine-readable Reviewed coverage and human-readable limitations must be generated from checked-in release policy and match the current trust data exactly.
- **C35 — Reproducible release artifacts.** Pages archive, SBOM, coverage, limitations, evidence and checksums must be deterministic where applicable, hash-bound and complete.
- **C36 — Build/publication authority separation.** Source execution occurs only in a read-only build job; the write-capable publication job consumes verified artifacts and executes no repository code.
- **C37 — Immutable public release integrity.** Immutable Releases must be enabled; the published prerelease, tag and assets must pass post-publish integrity verification.
- **C38 — Supersession and release-evidence closure.** Published artifacts are never silently overwritten. Defects require a new release identity, and GRANIT must bind the final public release back to exact source/evidence.

The private GRANIT adapter is extended to assess these controls before publication and again after publication against the public release identity.

## Failure behavior

Stage 6 fails closed before publication if any of the following occurs:

- version surfaces disagree;
- release target is not the current protected-main SHA;
- immutable releases are disabled or cannot be verified;
- the tag/release identity already exists unexpectedly;
- Verify, Evidence, audit, Gitleaks or release-specific tests fail;
- Reviewed coverage differs from current checked-in trust data;
- release limitations are missing or contradict the coverage manifest;
- either Pages or archive double-build is not byte-identical;
- the canonicalized SBOM or checksums differ across identical release inputs;
- release asset set is incomplete or contains unexpected files;
- publication job would need to execute repository code;
- private GRANIT is not READY for the exact release candidate.

After publication, integrity failure triggers supersession planning, never mutation of the published release.

## Stage 6 closure criteria

Stage 6 is CLOSED only when all of the following are true:

- release implementation is merged to protected `main` through the normal reviewed PR path;
- true-main Verify/Security/Pages and release-specific local gates are green;
- package version is `0.0.1-beta.1` and remains `private: true`;
- Immutable Releases are enabled and observed enabled;
- `v0.0.1-beta.1` resolves to the exact intended protected-main commit;
- GitHub Release `PLLDN v0.0.1 Beta 1` is public, prerelease and immutable;
- all six project-generated release assets exist and pass checksum/integrity verification;
- released Pages bytes match the live Pages deployment;
- README, CHANGELOG, coverage and limitations make no broader claim than the implemented surface;
- Ko-fi/GitHub Sponsors remain voluntary with no feature or governance entitlement;
- private GRANIT is READY against the final published release;
- release worktree/feature branch cleanup is complete;
- Notion contains `Stage 6 — v0.0.1 Beta 1 — CLOSED` with exact release/tag/commit/evidence identities.

## Explicitly deferred after Beta 1

The following remain outside this release:

- Stage 5C GitHub App/repository-read integration;
- broader language or license coverage;
- complete license recommendation UX;
- automatic factual web discovery;
- account/cloud project storage;
- general architecture inference;
- a stable `v0.0.1` non-prerelease claim.

Any of those requires its own later FuE/design gate rather than being smuggled into the Beta release path.
