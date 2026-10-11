<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Repository hygiene and Dependabot triage — 2026-10-11

This is a bounded repository-maintenance record, **not** a new release and **not** evidence that all software/legal claims have been reviewed.

## Branch cleanup, verified against GitHub

Before cleanup, GitHub contained **43** remote branches. GitHub merged-PR metadata and exact head SHA identified **36** already-merged PR branches; all 36 were deleted. A single extra branch `feat/unassessed-profile-permalinks-20261011` was **0 commits ahead, 6 behind** the current `main` and also removed. No deletion errors occurred, and **6 branches remained**: `main` and five Dependabot PR branches. Closed and merged pull-request history remains intact.

Repository setting `delete_branch_on_merge=true` was enabled for future successful merges. This is branch housekeeping only; not a force-push or a rewrite of history, tags or release artifacts.

## Independently reviewed dependency PRs

- **#41 download-artifact 8.0.2 / #42 setup-node 7.1.0 / #43 upload-artifact 7.0.2:** Existing GitHub Actions workflow PRs touch the explicitly frozen `.github/workflows/release.yml` for Beta 1; the pinned-release regression checks therefore fail. Do **not** merge these bot PRs or loosen the release assertions. Instead, this narrowly scoped PR applies their published full-commit SHA pins only to the currently active `verify.yml`, `security.yml`, `community.yml` and `pages.yml` workflows. It updates matching Community/Pages tests, retains immutable SHA pinning and leaves **all bytes in `release.yml` unchanged**.
- **#44 @types/node 26.6.4:** The project pins Node **24.15.0** and `@types/node` **24.x**. A version-26 type package is a major-runtime mismatch despite passing some existing tests. Guard with a Dependabot `semver-major` ignore until a separately reviewed Node 26 runtime migration is approved; the existing bot PR should be closed with explicit rationale.
- **#45 @biomejs/biome 2.5.15:** This is a separate patch-level development dependency update, previously green; leave independent pending exact-main CI, rather than combining with changes to frozen Beta 1 release workflow.

## Deliberate trade-off and follow-ups

The frozen Beta 1 workflow uses transport actions whose SHAs are asserted exactly. Dependabot's GitHub Actions ecosystem does not support restricting these dependency updates by workflow file, so the three transport action names are ignored in Dependabot's `github-actions` group. **This means future fixes for those three actions require manual review on active workflows**; the policy is not an assertion that pinned actions are secure forever. A later new-release architecture should restore automated updates to its own non-frozen transport actions, with independently versioned release policy and tests.

Any update to immutable action pins must verify provenance, full SHA, changed workflows, Ubuntu/Windows/Chromium/replay/security/community, and post-merge Pages. The old Beta tag `v0.0.1-beta.1`, frozen tag-bound release workflow, six release assets, and Reviewed/candidate snapshot boundaries are not altered.
