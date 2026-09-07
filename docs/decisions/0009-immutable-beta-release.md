# ADR 0009 — Immutable evidence-bound Beta release

## Status

Accepted for Stage 6.

## Decision

PLLDN v0.0.1 Beta 1 is published as tag `v0.0.1-beta.1` from an exact current protected-main SHA. The repository package version is `0.0.1-beta.1` and remains `private:true`; Stage 6 does not publish an npm package.

The public release contains exactly six assets: the deterministic Pages archive, release evidence, Reviewed coverage, known limitations, canonical CycloneDX SBOM, and `SHA256SUMS`. Release notes are reviewed repository data and are transported in the internal publication manifest rather than synthesized by the write-capable job.

Build and publication authority are separated. The build job has `contents: read`, executes the repository verification stack, rejects stale main, builds the release twice, and uploads one verified handoff. The publish job has `contents: write`, receives only that handoff, and executes no repository checkout, Node, npm, or repository source.

Repository Immutable Releases must be enabled through the maintainer administration gate before dispatch. Publication proceeds draft-first: asset bytes and GitHub-reported SHA-256 digests are checked before the draft flag is cleared.

## Consequences

A published Beta is never silently edited, retargeted, or asset-replaced. A defect found after publication is corrected by a superseding prerelease such as `v0.0.1-beta.2`, with new evidence bound to the new source baseline. Cleanup may delete only a still-unpublished draft that is proven to target the expected SHA.

Beta 1 intentionally does not widen product coverage. The live Pages surface remains four languages across four Reviewed boolean capability dimensions. Eight SPDX license identities are Reviewed but are not yet a complete live licensing recommendation surface. Stage 5C repository-read integration remains deferred.

SHA-256, GitHub release attestations, CI, and private assurance gates establish identity and control-plane evidence; they do not convert scoped Reviewed facts into legal advice, certification, or a broad recommendation-accuracy claim.
