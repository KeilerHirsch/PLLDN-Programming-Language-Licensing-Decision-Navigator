# ADR 0007 — Verified GitHub Pages runtime

**Status:** Accepted 2026-09-06

## Context

Stage 4 has a deterministic browser UI and local text accelerator, but the ordinary
browser build deliberately ships no trusted snapshot pin. Publishing that build unchanged
would fail closed, while making the complete Reviewed Stage 2 snapshot implicitly trusted
would collapse the separate runtime-approval boundary.

The complete Reviewed snapshot is also the wrong runtime unit. It contains four volatile
current-version claims whose freshness window can expire independently of the four Stage 4
language facets. Because `verifySnapshot()` validates every embedded document, one unrelated
expired version claim could make the whole public UI unavailable.

The generated browser bundle exposed a second deployment-specific risk during RED testing:
AJV's runtime schema compiler introduced a real `new Function` call even though PLLDN source
code itself contained no dynamic-code surface.

## Decision

Keep `build:browser` and `bootstrapUiRuntime()` unchanged: callers still provide runtime
trust explicitly, and the repository still ships no general default approval pin.

Add a separate GitHub Pages deployment profile that binds two independent approvals: the
Reviewed source-manifest digest and the deployment runtime-projection digest. Derivation from
Reviewed bytes is not itself approval.
The approved projection contains exactly 16 already-Reviewed documents: four language
entities, four boolean capability dimensions, four capability claims and four primary
sources. It excludes current-version claims and licensing records. `build:pages` derives
that closure, verifies both approvals and injects it into a deployment-only `runtime.js`.
Evaluation time is assigned at page load rather than frozen at build time.

Replace browser-reachable AJV runtime compilation with a deterministic checked-in standalone
validator set generated from the same pinned schemas and AJV version. Generated Pages bytes
must reject `new Function`, `eval`, network APIs, credential markers and private local paths.

Deploy only after a successful same-repository `Verify` push on `main`, or an explicit manual
dispatch already on `main`. Checkout the exact verified SHA and reject the build if remote
`main` has advanced. The build/scan job has only `contents: read`; only the final deployment
job receives `pages: write` and `id-token: write`, and that job executes no repository code.

## Consequences

Pages trust is deployment-specific rather than a hidden change to the library trust model.
The public Stage 5A surface is intentionally limited to the four reviewed language facets;
it is not a licensing surface or broad catalogue.

An expired unrelated version claim can no longer deny service to the Stage 4 facet UI, but
expanding the projection requires a new explicit approval decision and regression coverage.
The standalone validator artifact is generated code and must reproduce byte-for-byte from
pinned schemas/tooling; formatter and dependency changes must not silently rewrite it.

The workflow being present is not evidence that the site is live. Public availability is
claimed only after post-merge deployment observation and smoke checks. Stage 5A remains
pre-release and is not the v0.0.1 Beta release or a recommendation-accuracy certification.
