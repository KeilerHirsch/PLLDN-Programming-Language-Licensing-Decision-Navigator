# PLLDN - Programming Language & Licensing Decision Navigator

A faceted decision navigator for programming languages, software licenses and architecture constraints.

PLLDN is in Stage 0: repository foundations. It provides strict data contracts,
reference validation and digest-bound snapshot checks. It does not yet provide
a recommendation engine, user interface or reviewed technology catalogue.

## Run the checks

Install Node.js **24.15.0** with npm **11.12.1**, then:

```sh
npm ci --ignore-scripts
npm run verify
npm run evidence
```

Verification checks types, repository policy, formatting and tests with coverage.
Reports are written to the ignored `reports/` directory. Tests use synthetic data.
Network access is needed for dependency installation and vulnerability checks;
the contract and snapshot checks do not fetch knowledge or schemas.

## Decision principles

- Filters and explicit project facts are authoritative.
- Constraints come before ranking. Unknown is never silently false.
- Knowledge needs scope, sources, review and reproducible evidence.
- A candidate cannot approve itself. Released snapshots remain immutable.
- Language and license choices are component- and scenario-specific.

The first planned public product release is **v0.0.1 Beta**. The current
repository is not that release and makes no accuracy or certification claim.

Start with [architecture](docs/architecture.md), [data contracts](docs/data-contracts.md)
or [contributing](CONTRIBUTING.md).

PLLDN will be free to use, without a paid feature tier. Funding is limited to
voluntary GitHub Sponsors and Ko-fi support; donation links will be added when verified.

Own code, documentation and synthetic data are licensed under [EUPL-1.2](LICENSE).
