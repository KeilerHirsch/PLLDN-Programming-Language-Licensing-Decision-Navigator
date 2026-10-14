<div align="center">

# PLLDN - Programming Language & Licensing Decision Navigator

**Stop choosing stacks by vibes.**

## **Use it now:** [Open the live app on GitHub Pages →](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

**Choose a language. Understand the license. Defend the trade-off.**

Explore language trade-offs and license obligations. Unknown stays unknown.

**Free in your browser. No installation, account, API key, or LLM setup required.**

[![Open the PLLDN live app — Filter. Compare. Decide.](docs/assets/plldn-readme-hero.webp)](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

[**Languages →**](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/?catalog=languages#catalog) · [**Licenses →**](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/?catalog=licenses#catalog)

[**Launch PLLDN →**](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/) · [Browser quick start](#quick-start) · [Local verification](#local-verification)

</div>

## What PLLDN does

- **Browse** 194 languages and 714 licenses with search, filters, sorting and shareable links.
- **Explore** task-first shortlists for Windows tools, web apps, embedded software, and more.
- **Compare** up to four languages side by side.
- **Profiles:** fit, prerequisites, setup, examples, component licenses and sources.
- **Inspect licenses** through permissions, obligations, commercial use, SaaS/hosting, and competition.
- **Follow evidence** through Preview facts and canonical license terms.
- **Decide** in a separate Reviewed lab that explains fits, failures, and unresolved constraints.

## Quick start

1. Open **Languages** or **Licenses**.
2. Search by name or SPDX identifier; narrow the filters.
3. Open profiles, compare, or share **Link to this view**.

[Navigation](docs/catalogue.md) · [Language discovery](docs/language-information.md) · [Reader profiles](docs/language-reader-profiles.md).

## Scope and confidence

**Preview navigator:** 35 languages, 32 licenses, and 30 use-case guides. Qualitative performance, complexity, and ecosystem bands; Open Source, source-available, public-domain-like, and license-transition models.

**Unified catalogue:** includes **159 additional languages and 682 additional licenses** with pinned sources and **UNKNOWN assessments**, without promotion to Reviewed recommendations. [Identity sources](docs/identity-index.md).

**Reviewed decision lab:** **Go, Python, Rust, and TypeScript**, four Reviewed boolean capabilities, and eight Reviewed SPDX license identities. This is **not a complete licensing workflow**. Preview guidance never self-promotes into Reviewed recommendations.

Insufficient Reviewed evidence means abstention. PLLDN provides no legal advice or certification.

## Local verification

For contributors: Node.js **24.15.0** and npm **11.12.1**.

```sh
npm ci --ignore-scripts
npm run verify
npm run evidence
```

[v0.0.1 Beta 1 release](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/releases/tag/v0.0.1-beta.1) · [Changelog](CHANGELOG.md)

## Under the hood

- Deterministic evaluation; no LLM owns recommendations.
- Free text proposes filters; only confirmed facts enter decisions.
- Reviewed knowledge, Candidate Preview, runtime approval, and release evidence stay separate.

**Public docs:** [Data contracts](docs/data-contracts.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Governance](GOVERNANCE.md)

## Support

PLLDN is community-supported. GitHub's native Sponsor button routes to [Ko-fi](https://ko-fi.com/keilerhirsch); [GitHub Sponsors](https://github.com/sponsors/KeilerHirsch) is linked for future availability and is currently inactive.

Voluntary support creates **no feature entitlement**, ranking influence, approval authority, review priority, or release priority.

## License

Own code, documentation, and project data are licensed under [EUPL-1.2](LICENSE).
