# Dependency roles and licenses

The authoritative installed versions and integrity hashes are in package-lock.json.
Installation uses npm ci with lifecycle scripts disabled.

| Direct dependency | Role | Declared license |
| --- | --- | --- |
| ajv | Runtime schema validation | MIT |
| ajv-formats | Runtime date/URI format validation | MIT |
| jsonc-parser | Strict token and duplicate-key checks | MIT |
| typescript | Development type checking | Apache-2.0 |
| @types/node | Development declarations | MIT |
| @biomejs/biome | Development formatting and linting | MIT OR Apache-2.0 |
| esbuild-wasm | Build-only browser bundling | MIT |

The exact dual-license expression for Biome is retained. For this development-tool
use, the MIT option is selected. This decision is not a generic compatibility
rule in PLLDN's knowledge model.

Transitive license expressions are checked against a small reviewed allowlist.
An unknown expression stops verification and requires review. npm's integrity
hashes identify package archives; they do not certify publisher trustworthiness.

This source repository does not vendor node_modules or commit generated browser bundles.
Future redistribution must preserve the notices required by the actual included
dependencies. The current pre-release package remains private and cannot be published to npm accidentally.
