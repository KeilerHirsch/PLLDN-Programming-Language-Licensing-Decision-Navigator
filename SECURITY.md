# Security policy

PLLDN v0.0.1 Beta 1 is the first supported public prerelease. Security fixes target the main branch and published immutable corrections use a superseding release identity.

Report vulnerabilities through GitHub's private vulnerability reporting:
https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/security/advisories/new

Do not disclose secrets or an unpatched vulnerability in a public issue.
If the private form is unavailable, wait for a private reporting channel to be restored.

## Public security boundary

PLLDN separates reviewed knowledge, browser input, repository contributions, build/deploy workflows, and release publication into distinct trust boundaries.

- User text stays local and non-executable unless it is explicitly confirmed into an existing supported filter.
- Repository contributions are untrusted until reviewed and must not gain approval or merge authority through automation.
- Public browser functionality does not require an account, backend, telemetry, API key, or provider credential.
- Build, deployment, and release workflows use least-privilege permissions and verify the artifacts they publish.

Security-sensitive fixes require a regression test, provenance, and review.

No response-time guarantee or security certification is claimed.
