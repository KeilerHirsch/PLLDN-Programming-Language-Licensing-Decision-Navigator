<div align="center">

# PLLDN - Programming Language & Licensing Decision Navigator

**Stop choosing stacks by vibes.**

## **Use it now:** [Open the live app on GitHub Pages →](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

**Choose a language. Understand the license. Defend the trade-off.**

PLLDN helps you choose a language and understand licensing before the first commit. Start with your project, explore trade-offs in performance, complexity and deployment, and inspect license rights and obligations. Unknown stays unknown.

**Free in your browser. No installation, account, API key, or LLM setup required.**

[![Open the PLLDN live app — Filter. Compare. Decide.](docs/assets/plldn-readme-hero.webp)](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

[**Launch PLLDN →**](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/) · [Browser quick start](#quick-start) · [Local verification](#local-verification)

</div>

## What PLLDN does

- **Explore** task-first shortlists for Windows tools, web apps, embedded software, and more.
- **Compare** up to four languages side by side.
- **Inspect licenses** through permissions, obligations, commercial use, SaaS/hosting, and competition.
- **Follow evidence** through Preview facts and canonical license terms.
- **Decide** in a separate Reviewed lab that explains fits, failures, and unresolved constraints.

## Quick start

1. Choose a task under **What are you building?**
2. Filter the **Language catalogue** and add languages to compare.
3. Switch to **Licenses** and open **Rights, restrictions & compliance**.

Building a hosted service? Start with **Web backend**, compare languages, then inspect SaaS permissions and source-disclosure obligations under **Licenses**.

## Scope and confidence

**Preview navigator:** 35 languages, 32 licenses, and 15 use-case guides. Qualitative performance, complexity, and ecosystem bands; Open Source, source-available, public-domain-like, and license-transition models.

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

PLLDN is free and community-supported. GitHub's native Sponsor button currently routes to [Ko-fi](https://ko-fi.com/keilerhirsch); [GitHub Sponsors](https://github.com/sponsors/KeilerHirsch) remains linked for future availability but is not currently an active native funding destination.

Voluntary support creates **no feature entitlement**, ranking influence, approval authority, review priority, or release priority.

## License

Own code, documentation, and project data are licensed under [EUPL-1.2](LICENSE).
