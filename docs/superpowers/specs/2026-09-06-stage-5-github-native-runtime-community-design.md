# Stage 5 — GitHub-Native Runtime & Community Design

**Status:** Approved architecture, pre-implementation freeze  
**Date:** 2026-09-06  
**Baseline:** protected `main` at `1ac60be81b3a7abc92f09a35621c7ce4ea720631`  
**Stage:** 5 — GitHub-native community/runtime features

## Purpose

Stage 5 turns the already-trusted local/static Stage 4 core into a public GitHub-native runtime and a governed community contribution surface without weakening the existing trust boundaries.

The central rule remains unchanged:

> Filters are authoritative. Free text may propose filters. Recommendations consume only canonical project-fact state after explicit confirmation.

Stage 5 adds deployment and contribution infrastructure around that core. It does not add a second recommendation engine, hosted inference, automatic factual approval, or a release claim.

## Scope decomposition

Stage 5 is deliberately split into three sub-stages:

1. **5A — Verified GitHub Pages Runtime** — required for Stage 5 closure.
2. **5B — Community + Candidate Pipeline** — required for Stage 5 closure.
3. **5C — GitHub App / repository-read PoC** — optional and separately gated.

Stage 5 is considered complete when 5A and 5B are merged and re-verified on protected `main`. 5C is not required for closure.
## Non-goals

Stage 5 must not:

- publish `v0.0.1 Beta` or any other product release;
- claim general recommendation accuracy, broad natural-language understanding, certification, or legal correctness;
- introduce an LLM, embedding service, statistical classifier, provider API, or network inference path;
- make GitHub Actions, bots, issue labels, PR status, or `Reviewed` metadata sufficient to approve runtime knowledge;
- auto-merge or auto-approve candidate knowledge or dictionary changes;
- embed a GitHub App client secret, private key, webhook secret, Personal Access Token, or long-lived credential in Pages JavaScript;
- request repository write access merely for convenience;
- change `bootstrapUiRuntime()` into a self-trusting runtime.

Stage 6 remains the first `v0.0.1 Beta` release stage.

## Trust model carried forward

Stage 0–4 trust boundaries remain authoritative. Candidate evidence review, human approval, immutable Reviewed snapshot generation, and runtime approval are separate events.

The current Reviewed manifest is `knowledge/reviewed/stage2-core.manifest.json`, whose exact SHA-256 at the Stage 5 baseline is:

`a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5`

This digest is not automatically trusted merely because it is present on `main`. Stage 5A introduces an explicit Pages-deployment approval record that names this exact manifest digest.
## Stage 5A — Verified GitHub Pages Runtime

### Deployment trust record

Create `deployments/github-pages/runtime-profile.json` as the sole Stage 5A deployment-specific trust root.

It records:

- `schema_version: "0.1"`;
- `deployment_id: "github-pages"`;
- the Reviewed manifest path;
- the exact approved manifest SHA-256;
- `candidate_type: "language"`;
- one explicit public component ID;
- one minimal empty canonical base project.

The public component exists only to satisfy the existing component-scoped decision contract. It starts with no project facts or boundaries.

The profile is consumed only by the Pages build path. It is not imported by `src/ui/runtime.ts`, `src/ui/main.ts`, the decision engine, or ordinary `npm run build:browser` output.

Therefore the core invariant remains true: ordinary browser/runtime callers must still provide their own trusted snapshot digest.
### Pages build contract

Add `tools/build-pages.ts` as a deployment-only build orchestrator.

Its responsibilities are:

1. run the existing deterministic browser build into a temporary site directory;
2. read the deployment profile;
3. read the named Reviewed manifest and all manifest-listed Reviewed files;
4. compute the manifest SHA-256 and fail closed unless it exactly equals the deployment profile's approved digest;
5. reject candidate-path manifests or files outside the named Reviewed snapshot;
6. serialize the manifest/files/base project into a generated `runtime.js` using data literals only;
7. inject `runtime.js` before `app.js` in the deployment artifact;
8. leave `web/index.html` and ordinary `npm run build:browser` semantics unchanged.

The generated script sets `window.PLLDN_RUNTIME` and uses the browser's current UTC clock at page load for `evaluatedAt`. The build must not freeze freshness evaluation to deployment time.

No static snapshot file is loaded later with `fetch()`. The runtime material is embedded into the deployed artifact so Pages remains a static host and the existing no-network inference boundary is preserved.
### Public runtime scope

The first Pages runtime exposes the existing Stage 3/4 language-decision surface only.

The Reviewed snapshot may contain license entities, but Stage 5A does not claim that the browser UI is already a complete outgoing-license decision product. Current product facets target the Reviewed boolean language capability dimensions introduced before Stage 4.

The default Pages base project is intentionally empty except for one public component. A visitor creates material state only through existing manual facet selections or explicit confirmation of Stage 4 text proposals.

Pages must visibly remain a pre-release development surface. No Beta badge, versioned release label, or general accuracy statement is permitted.

### Failure behavior

The Pages build fails before artifact upload when:

- the deployment profile is malformed;
- the named manifest is missing;
- the manifest digest differs from the approved deployment digest;
- a listed snapshot file is missing or digest-mismatched;
- the profile points at candidate rather than Reviewed knowledge;
- generated runtime material cannot be represented as inert JSON/data literals.

At browser runtime, existing `verifySnapshot()` behavior remains authoritative. Tampered or stale runtime material renders unavailable rather than recommendations.
### Pages workflow

Add a dedicated pinned GitHub Actions workflow for Pages deployment.

The workflow is triggered only after the existing `Verify` workflow completes successfully for `main`, plus an explicit manual dispatch for maintainers. Manual dispatch is restricted to the protected `main` branch and must not deploy an arbitrary feature-branch ref.

For an automatic deployment it must:

- bind checkout to the exact successful Verify `head_sha`, not an unpinned moving branch;
- install the repository-pinned Node/npm toolchain;
- rerun `npm audit --audit-level=low` and pinned Gitleaks before deployment;
- run the Pages build and deployment-contract tests;
- upload the exact generated Pages artifact;
- deploy through GitHub's official Pages actions pinned to immutable commit SHAs;
- grant `pages: write` and `id-token: write` only to the deployment job that needs them.

The Pages workflow does not use repository secrets for application behavior. GitHub's deployment OIDC token is infrastructure authorization, not a PLLDN runtime credential.

A failed Verify, audit, secret scan, trust-profile check, or Pages build prevents deployment.
## Stage 5B — Community + Candidate Pipeline

### Authority boundary

Community and bot input remains untrusted authoring input until it passes the existing candidate/review/promotion path.

Bots and Actions may:

- identify source records whose freshness requires attention;
- classify changed paths and affected record IDs;
- validate candidate records, text-rule changes and corpus changes;
- produce machine-readable reports and GitHub job summaries;
- point contributors to missing provenance, tests or ambiguity cases.

Bots and Actions must not:

- set factual approval authority;
- create `Reviewed` assertions directly;
- add a runtime approval digest automatically;
- merge their own proposal;
- silently rewrite released Reviewed snapshots.

A bot-generated candidate remains `Partial` until the normal human-governed promotion path says otherwise.
### Source candidate discovery

Add a deterministic source-freshness reporter that consumes only checked-in Reviewed records plus an explicit evaluation timestamp.

Its initial Stage 5B job is intentionally narrow: identify source/claim material that is expired, within a configured review window, or otherwise freshness-sensitive according to existing metadata. It does not crawl the web and does not decide that a replacement source is correct.

The reporter emits a stable JSON report containing at least:

- evaluated timestamp;
- affected source and claim IDs;
- current freshness metadata;
- candidate reason (`EXPIRED`, `REVIEW_DUE`, or equivalent explicit state);
- no proposed factual value unless supplied through a separate candidate contribution.

A scheduled read-only GitHub Action runs this reporter and uploads the report artifact. The initial Stage 5B workflow does not automatically open issues, push branches, or edit knowledge.
### Dictionary candidate intake

Add a dedicated GitHub Issue Form for dictionary/text-rule proposals.

The form requires:

- exact proposed phrase or alias;
- language/locale context;
- target product facet and intended option, or an explicit ambiguity-only proposal;
- at least one positive example;
- at least one negative/near-miss or ambiguity example;
- provenance/rationale;
- disclosure of material AI assistance.

Issue submission creates no canonical project fact, rule, or Reviewed record. It is only candidate input for a future PR.

Any PR that changes `text-rules/stage4-core.json` must continue to satisfy strict schema validation, gold-corpus regression coverage, conflict/ambiguity behavior, and manual/text equivalence. Community convenience never lowers those gates.
### Pull-request assistance

Add a read-only community review workflow that classifies material changes and emits a deterministic GitHub job summary.

The summary must distinguish at least:

- candidate knowledge changes;
- Reviewed snapshot changes;
- source/provenance changes;
- text-rule/dictionary changes;
- gold-corpus changes;
- deployment trust-profile changes.

For each class it reports the relevant existing verification gates and whether the submitted PR changed the evidence-bearing files expected for that class.

This workflow is advisory evidence, not approval. It runs with read-only repository permissions and does not post comments, apply labels, write branches, or modify PR state in the initial Stage 5B implementation.
## Stage 5C — Optional GitHub App / Repository-Read PoC

Stage 5C is explicitly deferred until 5A and 5B are green on protected `main`.

If started, it requires a separate design/ADR and implementation plan before code changes.

The admissible PoC boundary is:

- anonymous/local analysis remains available;
- GitHub identity and repository installation remain separate user actions;
- repository access is opt-in and limited to selected repositories;
- default repository permissions are `Metadata: read` and `Contents: read` only when repository inspection is requested;
- no write permission is requested merely to save a PLLDN profile;
- no Personal Access Token is requested from the user;
- no GitHub App secret/private key is embedded in Pages;
- a visible privacy receipt states which repository is read, what data leaves the browser, where processing occurs, and what is retained;
- token/session storage and revocation behavior must be explicitly specified before the PoC can become production architecture.

Device flow and a tiny secret-bearing auth edge remain competing PoC approaches. Stage 5 does not pre-select either one.
## Security and privacy invariants

Stage 5 must preserve these invariants:

- public Pages artifacts contain no secrets or private machine paths;
- browser application code performs no network inference and runs no data-supplied code;
- deployment trust is explicit and reviewable rather than inferred from repository location;
- candidate automation is read-only by default;
- user project text is not uploaded merely because Pages hosts the UI;
- no telemetry is introduced in Stage 5;
- no community issue/PR content is treated as authoritative knowledge merely because it is public;
- GitHub Actions permissions follow least privilege per job;
- all third-party Actions are pinned to immutable commit SHAs;
- Gitleaks, dependency audit, repository policy, typecheck, tests and evidence generation remain release/promotion gates.

## Evidence model

Stage 5 extends the assurance scope to deployment and community automation without conflating policy, evidence, enforcement and audit.

Required evidence classes are:

1. source-bound local verification;
2. Pages deployment-profile binding to an exact Reviewed manifest digest;
3. generated-site reproducibility for identical source/profile inputs;
4. no-secret/no-network/no-dynamic-code deployment checks;
5. community automation authority-boundary checks;
6. GitHub CI evidence for Linux/Windows replay plus Pages build/deploy gating;
7. post-merge main verification and private source-only assurance.
## Planned file responsibilities

Stage 5A is expected to add or modify:

- `deployments/github-pages/runtime-profile.json` — deployment-specific runtime approval and public base-project context;
- `tools/build-pages.ts` — fail-closed Pages artifact builder;
- `.github/workflows/pages.yml` — exact-SHA verified Pages deployment;
- deployment-focused tests covering trust mismatch, generated runtime safety and workflow policy;
- README/architecture/verification/security documentation describing the Pages trust boundary.

Stage 5B is expected to add or modify:

- `tools/source-candidates.ts` — deterministic freshness-candidate reporter;
- `tools/community-review.ts` — deterministic PR change classifier/report generator;
- `.github/ISSUE_TEMPLATE/dictionary.yml` — structured dictionary proposal intake;
- `.github/workflows/community.yml` — read-only candidate/freshness automation;
- tests for freshness classification, report determinism and bot authority boundaries;
- contribution/governance documentation where the new flow requires explicit instructions.

Exact implementation filenames may be narrowed by the implementation plan, but responsibilities must not be merged into the decision engine or text matcher.
## Acceptance criteria

Stage 5A is complete only when:

- the deployment profile is bound to the exact Reviewed manifest digest and fails closed on mismatch;
- identical source/profile inputs produce byte-identical Pages artifacts;
- the generated Pages artifact boots through the existing `verifySnapshot()` boundary and exposes Stage 4 text assistance without auto-confirmation;
- ordinary `npm run build:browser` remains untrusted/fail-closed by default;
- the Pages artifact contains no secrets, private paths, provider SDKs, `eval`, `new Function`, or network inference surface;
- automatic Pages deployment checks out the exact successful Verify SHA and reruns audit/secret gates before deploy;
- Pages is live only from protected `main` and makes no Beta or accuracy claim.

Stage 5B is complete only when:

- source freshness reporting is deterministic for an explicit timestamp and changes no knowledge;
- dictionary proposals have a structured issue intake with positive and negative examples;
- PR assistance classifies relevant change classes without write permissions;
- bot output cannot satisfy human review or runtime approval gates;
- full repository verification, evidence, audit and secret scans remain green.

Stage 5 closes only after 5A + 5B pass local, remote PR and post-merge main verification.
## Rejected approaches

The following approaches are rejected for Stage 5:

- **Trust whatever Reviewed snapshot is on `main`.** This collapses snapshot existence and runtime approval into one event.
- **Fetch runtime JSON from Pages after startup.** This adds unnecessary runtime network loading when the small Reviewed pack can be embedded into the static artifact.
- **Bake deployment time into `evaluatedAt`.** That would let an old deployment keep evaluating freshness at an old timestamp; page-load time is required.
- **Make Pages the GitHub App backend.** Static Pages cannot safely hold normal web-flow secrets or webhook verification secrets.
- **Use GitHub Actions as the synchronous application API.** Actions remain asynchronous build/maintenance workers.
- **Let bots commit Reviewed data.** Bot output stays candidate/advisory evidence only.
- **Auto-open issues or PRs from the first freshness reporter.** Stage 5B starts read-only to prove signal quality before granting write permissions.
- **Implement repository authentication inside 5A/5B.** 5C has a separate admission gate because auth, tokens, repository permissions and privacy lifecycle are an independent subsystem.

## Stage boundary after completion

After Stage 5 closes, PLLDN has a verified public static runtime plus a governed GitHub-native candidate/community pipeline.

It is still not `v0.0.1 Beta`.

Stage 6 remains responsible for release evidence, pre-release/Beta identity, reviewed coverage manifest, known limitations, unsupported areas, and the final release-grade validation corpus.