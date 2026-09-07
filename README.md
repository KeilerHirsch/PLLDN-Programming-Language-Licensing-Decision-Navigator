# PLLDN - Programming Language & Licensing Decision Navigator

A deterministic decision navigator for programming languages, software licenses, and architecture constraints.

**For:** developers and maintainers who need traceable, constraint-first comparisons and explicit abstention when Reviewed evidence is insufficient.

**Status:** **v0.0.1 Beta 1** prerelease · community-supported · no response-time guarantee.

**Use it now:** [Open the verified GitHub Pages app →](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

**Verify:** [Release](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/releases/tag/v0.0.1-beta.1) · [Verification](docs/verification.md) · [Changelog](CHANGELOG.md)

**Before using:** The live Beta covers Go, Python, Rust, and TypeScript across four Reviewed boolean capability dimensions. Eight SPDX license identities are Reviewed but are not yet exposed as a complete live licensing recommendation workflow. PLLDN does not provide legal advice or certification.

**Next:** [Architecture](docs/architecture.md) · [Data contracts](docs/data-contracts.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [License](LICENSE) · [Support](#support)

**Support development:** [Ko-fi](https://ko-fi.com/keilerhirsch) · [GitHub Sponsors](https://github.com/sponsors/KeilerHirsch)

## Scope and trust model

PLLDN Beta 1 packages the deterministic decision/facet core, Reviewed knowledge, framework-free browser UI, explicit-confirmation free-text assistance, the verified GitHub Pages runtime, and read-only community maintenance controls. Filters and explicit project facts remain authoritative; free text can only propose existing facets and cannot confirm them automatically.

Runtime trust remains separate. The core and ordinary browser build ship no default snapshot approval pin. The Pages deployment profile separately approves the Reviewed source manifest and a minimal 16-document runtime projection. That projection contains only the four live language entities, four boolean capability dimensions, four supporting claims, and four primary sources; it contains no current-version claims or licensing records.

Beta 1 makes no claim of complete license compatibility analysis, universal natural-language understanding, general recommendation accuracy, or certification. Correct abstention is expected when Reviewed evidence is insufficient.

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
The first public product release identity is **v0.0.1 Beta 1**. Exact coverage and known
limitations ship as release assets; published corrections use a superseding Beta rather than
mutating an immutable release.

Start with [architecture](docs/architecture.md), [data contracts](docs/data-contracts.md)
or [contributing](CONTRIBUTING.md).

## Support

PLLDN will be free to use, without a paid feature tier. If the project is useful to you,
voluntary support is welcome through [Ko-fi](https://ko-fi.com/keilerhirsch) or
[GitHub Sponsors](https://github.com/sponsors/KeilerHirsch). On GitHub, the native Sponsor
button exposes Ko-fi as the currently verified active support route. GitHub controls Sponsors
availability for the linked account.
Voluntary funding creates no feature entitlement, ranking influence, approval authority, or
review privilege.

Own code, documentation and project data are licensed under [EUPL-1.2](LICENSE).
