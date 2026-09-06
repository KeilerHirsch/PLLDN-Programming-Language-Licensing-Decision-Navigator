# Security policy

PLLDN is still pre-release and has no supported application release. Security fixes target the main branch.

Report vulnerabilities through GitHub's private vulnerability reporting:
https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/security/advisories/new

Do not disclose secrets or an unpatched vulnerability in a public issue.
If the private form is unavailable, wait for a private reporting channel to be restored.

Relevant boundaries include candidate/reviewed knowledge, schema references, dependency
installation, browser runtime injection, deployment-profile approvals, generated Pages
artifacts, DOM rendering, deterministic free-text rules and confirmation, workflow
permissions and protected snapshot approvals. Stage 4 user text remains bounded and local;
it must not become executable code, network input, telemetry or canonical project state
without explicit facet confirmation. Stage 5A's static Pages path uses a separately approved
minimal runtime projection, generated-byte security checks and an exact-SHA least-privilege
deployment workflow. It adds no account, backend or secret-bearing browser feature.
See [the threat model](docs/threat-model.md).

Security-sensitive fixes need a regression, provenance and review.
No response-time guarantee or security certification is claimed.
