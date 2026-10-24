# Getting started with PLLDN

PLLDN runs in a browser. No installation, account, API key, or external language model is required.

[Open PLLDN](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/)

## Explore the catalogues

1. Open [Languages](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/?catalog=languages#catalog) or [Licenses](https://keilerhirsch.github.io/PLLDN-Programming-Language-Licensing-Decision-Navigator/?catalog=licenses#catalog).
2. Search by name or SPDX identifier; use filters to narrow the results.
3. Open a profile, compare options, or share **Link to this view**.

See [Catalogue navigation](catalogue.md), [Language discovery](language-information.md) and [Reader profiles](language-reader-profiles.md).

## Understanding the scope

The unified catalogue lists **194 languages** and **714 licenses**, including **159 additional languages** and **682 additional licenses** with pinned sources but UNKNOWN assessments.

The **Preview navigator** has 35 language profiles, 32 license profiles, and 30 use-case guides, with qualitative performance, complexity and ecosystem bands. These are editorial previews, not approved recommendations.

The **Reviewed decision lab** currently covers Go, Python, Rust, TypeScript, four Reviewed boolean capabilities, and eight Reviewed SPDX license identities. A missing review is not a positive assessment: the decision lab abstains when evidence is insufficient.

PLLDN supplies decision-support information, **not legal advice or certification**. Source links and evaluation scope matter more than the total number of catalogue entries.

See [Identity sources](identity-index.md), [Data contracts](data-contracts.md), and [Governance](../GOVERNANCE.md).

## Local development and verification

The version set documented for this repository is **Node.js 24.15.0** and **npm 11.12.1**.

```sh
npm ci --ignore-scripts
npm run verify
npm run evidence
```

Run verification on your actual checkout; the existence of these commands does not establish that your local tree passed them. See [Contributing](../CONTRIBUTING.md) for the development and review process.

## Releases and support

- [v0.0.1 Beta 1](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/releases/tag/v0.0.1-beta.1) (historical release; not necessarily the current live application state)
- [Changelog](../CHANGELOG.md)
- [Security reporting](../SECURITY.md)

Voluntary support is not a purchase of features, prioritisation, ranking influence or approval authority.
