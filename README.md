# PLLDN - Programming Language & Licensing Decision Navigator

A faceted decision navigator for programming languages, software licenses and architecture constraints.

> **Try PLLDN live:** [Open the verified GitHub Pages app →](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)
>
> **Support development:** [Ko-fi](https://ko-fi.com/keilerhirsch) · [GitHub Sponsors](https://github.com/sponsors/KeilerHirsch)

PLLDN is in active pre-release development. Stage 0 established the trust and
data-contract foundation; Stage 1 added the deterministic decision and facet core.
Stage 2 added a small source-backed knowledge pack plus an immutable human-reviewed
snapshot. Stage 3 added the first framework-free browser UI over the same authoritative
facet and decision core. Stage 4 added a small local deterministic free-text accelerator
that can propose reviewed product facets but cannot apply them without confirmation.
Stage 5A adds a deployment-specific verified GitHub Pages runtime path over that same
small reviewed language surface.

Runtime trust remains separate: the core and ordinary browser build still ship no default
snapshot approval pin. The Pages deployment profile separately approves the Reviewed
source manifest and a minimal 16-document runtime projection; the deployment artifact
contains only that runtime projection as its trust input. Stage 4 adds no LLM, provider
API, network inference, embeddings, fuzzy classifier or direct text-to-decision path.
The verified GitHub Pages deployment is live and serves the exact reviewed runtime projection.
The live site remains a pre-release surface; there is no **v0.0.1 Beta release** yet.

## Run the checks

Install Node.js **24.15.0** with npm **11.12.1**, then:

```sh
npm ci --ignore-scripts
npm run verify
npm run evidence
```
To build the current static browser shell locally:

```sh
npm run build:browser
```

Generated ordinary-browser files go to ignored `.build/site/`. The repository does not
embed or ship a default trusted runtime snapshot, so that standalone shell intentionally
shows an unavailable state until approved runtime material is injected. To build the
deployment-only Pages artifact locally, run `npm run build:pages`; it writes ignored
`.build/pages/` with the separately approved runtime projection.

Verification checks types, repository policy, formatting and tests with coverage.
Reports are written to the ignored `reports/` directory. Network access is needed
for dependency installation and vulnerability checks; contract and snapshot checks
do not fetch knowledge or remote schemas.

## Decision principles

- Filters and explicit project facts are authoritative.
- Constraints come before ranking. Unknown is never silently false.
- Knowledge needs scope, sources, review and reproducible evidence.
- A candidate cannot approve itself. Released snapshots remain immutable.
- Human review and runtime snapshot approval are separate trust decisions.
- UI counts and material candidate states reuse the deterministic decision core.
- Free text may propose filters; only confirmed proposals enter the existing facet path.
- Correct abstention is preferred over guessed text interpretation.
- Language and license choices are component- and scenario-specific.
The first planned public product release is **v0.0.1 Beta**. The current
repository is not that release and makes no general recommendation-accuracy or
certification claim.

Start with [architecture](docs/architecture.md), [data contracts](docs/data-contracts.md)
or [contributing](CONTRIBUTING.md).

## Support

PLLDN will be free to use, without a paid feature tier. If the project is useful to you,
voluntary support is welcome through [Ko-fi](https://ko-fi.com/keilerhirsch) or
[GitHub Sponsors](https://github.com/sponsors/KeilerHirsch). GitHub controls Sponsors
availability for the linked account; Ko-fi is the currently verified active support route.

Own code, documentation and project data are licensed under [EUPL-1.2](LICENSE).
