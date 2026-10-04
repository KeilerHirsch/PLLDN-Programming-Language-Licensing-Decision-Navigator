# PLLDN - Programming Language & Licensing Decision Navigator

**Stop choosing stacks by vibes.**

## **Use it now:** [Open the live app on GitHub Pages →](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

**Free in your browser. No installation, account, API key, or LLM setup required.**

Start with what you are building, explore language and license trade-offs, and compare options side by side. Unknown stays unknown.

[![Open the PLLDN live app — Filter. Compare. Decide.](docs/assets/plldn-readme-hero.webp)](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

[**Launch PLLDN →**](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/) · [Browser quick start](#quick-start) · [Local verification](#local-verification)

## What PLLDN does

- **Explore** task-first language shortlists.
- **Read** language and license profiles, then inspect their Preview facts.
- **Compare** up to four languages side by side.
- **Decide** in a separate Reviewed decision lab.
- **Explain** why a Reviewed candidate fits, fails, or remains unresolved.

## Quick start

1. Choose a task under **What are you building?**
2. Filter the **Language catalogue** and add up to four languages to compare.
3. Switch to **Licenses** to explore commercial use, SaaS/hosting, competition, and OSI status.

Open **Performance & complexity** for metric bands and contextual badges with text and symbols.

## Scope and confidence

**Preview navigator:** 35 language profiles, 32 license profiles, and 15 use-case guides. Qualitative performance, complexity, and ecosystem bands; Open Source, source-available, public-domain-like, and license-transition models.

**Reviewed decision lab:** a separate, narrower recommendation path for **Go, Python, Rust, and TypeScript** across **four Reviewed boolean capabilities**. Eight Reviewed SPDX license identities are present, but this is **not a complete licensing workflow**. Preview guidance never self-promotes into Reviewed recommendations.

When Reviewed evidence is insufficient, abstention is the correct result. PLLDN does not provide legal advice or certification.

## Local verification

To work on the repository, use Node.js **24.15.0** and npm **11.12.1**:

```sh
npm ci --ignore-scripts
npm run verify
npm run evidence
```

[v0.0.1 Beta 1 release](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/releases/tag/v0.0.1-beta.1) · [Changelog](CHANGELOG.md)

## Under the hood

- Deterministic constraint evaluation; no LLM owns the recommendation path.
- Free text may propose existing filters; only confirmed facts enter the decision path.
- Reviewed knowledge, Candidate Preview, runtime approval, and release evidence stay separate.
- Preview catalogue failure cannot expand or disable the trusted decision candidate space.

**Public docs:** [Data contracts](docs/data-contracts.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Governance](GOVERNANCE.md)

## Support

PLLDN is free and community-supported. GitHub's native Sponsor button currently routes to [Ko-fi](https://ko-fi.com/keilerhirsch); [GitHub Sponsors](https://github.com/sponsors/KeilerHirsch) remains linked for future availability but is not currently an active native funding destination.

Voluntary support creates **no feature entitlement**, ranking influence, approval authority, review priority, or release priority.

## License

Own code, documentation, and project data are licensed under [EUPL-1.2](LICENSE).
