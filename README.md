# PLLDN - Programming Language & Licensing Decision Navigator

**Stop choosing stacks by vibes.**

PLLDN turns real project constraints into technology choices you can actually defend. Unknown stays unknown; the tool does not invent certainty just to produce an answer.

**Use it now:** [Open PLLDN on GitHub Pages ?](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

![PLLDN ? Stop choosing by vibes. Filter. Compare. Decide.](docs/assets/plldn-readme-hero.webp)

**v0.0.1 Beta 1** ? community-supported ? no account, API key, LLM, or provider setup required.

## What PLLDN does

- **Filter** by what the project actually needs.
- **Compare** candidates backed by Reviewed evidence.
- **Explain** why a candidate fits, fails, or stays unresolved.
- **Assist** with plain text without letting free text bypass confirmed filters.

**Filter. Compare. Decide.** No popularity contest. No AI oracle.

## Quick start

Use the browser app above, or verify locally with Node.js **24.15.0** and npm **11.12.1**:

```sh
npm ci --ignore-scripts
npm run verify
npm run evidence
```

## Beta 1 scope

Live today: **Go, Python, Rust, TypeScript** across **four Reviewed boolean capabilities**. The repository also carries **eight Reviewed SPDX license identities**, but Beta 1 is **not a complete licensing workflow**.

When Reviewed evidence is insufficient, **abstention is the correct result**. PLLDN does not provide legal advice or certification.

[Release](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/releases/tag/v0.0.1-beta.1) ? [Changelog](CHANGELOG.md)

## Under the hood

- Deterministic constraint evaluation; no LLM owns the recommendation path.
- Free text may propose existing filters; only confirmed facts enter the decision path.
- Reviewed knowledge, runtime approval, and release evidence stay separate.

**Deep docs:** [Architecture](docs/architecture.md) ? [Data contracts](docs/data-contracts.md) ? [Verification](docs/verification.md) ? [Security](SECURITY.md) ? [Contributing](CONTRIBUTING.md)

## Support

PLLDN is free and community-supported. GitHub's native Sponsor button currently routes to [Ko-fi](https://ko-fi.com/keilerhirsch); [GitHub Sponsors](https://github.com/sponsors/KeilerHirsch) remains linked for future availability but is not currently an active native funding destination.

Voluntary support creates **no feature entitlement**, ranking influence, approval authority, review priority, or release priority.

## License

Own code, documentation, and project data are licensed under [EUPL-1.2](LICENSE).
