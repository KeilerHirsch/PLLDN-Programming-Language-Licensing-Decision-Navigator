# Changelog

All notable PLLDN releases are recorded here. Published prereleases are immutable; fixes use a new release identity rather than silent replacement.

## 0.0.1-beta.1 — PLLDN v0.0.1 Beta 1

First public evidence-bound Beta of the Programming Language & Licensing Decision Navigator.

### Included

- Deterministic decision and facet core with explicit UNKNOWN and abstention states.
- Reviewed runtime coverage for Go, Python, Rust, and TypeScript.
- Four live boolean capability dimensions used by the GitHub Pages decision surface.
- Deterministic free-text assistance that proposes facets but never confirms them automatically.
- Verified static GitHub Pages runtime with deployment-specific trust approval.
- Read-only freshness and community candidate tooling with no approval authority.
- Reviewed Stage 2 knowledge containing eight SPDX license identities outside the current live license decision surface.

### Release evidence

- Exact source and Reviewed trust digests are recorded in `release-evidence.json`.
- `reviewed-coverage.json` records the implemented live boundary.
- `known-limitations.md` records unsupported and deferred surfaces.
- CycloneDX SBOM, deterministic Pages archive, and `SHA256SUMS` accompany the release.
- Publication is gated through an immutable GitHub prerelease; later corrections supersede this Beta with a new version.
