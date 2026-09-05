# Stage 0 threat model

Assets: canonical project facts, reviewed knowledge integrity, source identity,
review authority, dependency provenance and private contributor data.

Untrusted inputs: candidate JSON, source references, PR content and dependency changes.
Trusted inputs: reviewed repository schemas, explicitly selected validation code
and a separately protected snapshot approval set.

| Threat | Implemented boundary | Remaining responsibility |
| --- | --- | --- |
| Duplicate keys, coercion, malformed values | Strict parser and schema checks | Review schema changes |
| Dangling IDs and scope expansion | Referential and scope checks | Verify factual evidence |
| Candidate self-approval | External digest required | Protect caller and approval configuration |
| Modified snapshot bytes | Exact file set and SHA-256 checks | Authenticate initial approval |
| Stale or future assertion | Explicit clock and freshness checks | Select time policy for live use vs replay |
| Executable data or remote schema loading | No data-driven execution or remote resolver | Review future adapters |
| Workflow credential theft | Read-only PR jobs, pinned Actions, no PR secrets | Protect repository administration |
| Dependency compromise | Exact pins, integrity lock, audit, notices | Review updates and upstream provenance |

SHA-256 proves identity, not factual correctness or human review.
CI evidence is a report, not a signature or certification.
Report export requires a matching verified source tree, but a compromised trusted
runner or administrator remains outside this library's protection.

No user roadmap ingestion, authentication, hosting or parser exists in Stage 0.
Do not infer that their future threat models are already covered.
