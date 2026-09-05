# Current pre-release threat model

Assets: canonical project facts, reviewed knowledge integrity, source identity,
review authority, snapshot identity, dependency provenance and private contributor data.

Untrusted inputs: candidate JSON, source references, PR content and dependency changes.
Trusted inputs are layered: reviewed repository schemas, explicitly selected validation
code, a hash-bound human review decision and, separately, a protected runtime snapshot
approval set.

| Threat | Implemented boundary | Remaining responsibility |
| --- | --- | --- |
| Duplicate keys, coercion, malformed values | Strict parser and schema checks | Review schema changes |
| Dangling IDs and scope expansion | Referential and scope checks | Verify factual evidence |
| Candidate self-approval | Candidate rejects `Reviewed`; promotion requires separate human review bound to the exact candidate manifest | Protect reviewer identity and approval input |
| Review drift to another candidate | Review records pin the candidate manifest and require complete assertion coverage | Re-review every changed candidate manifest |
| Formatter mutates immutable snapshot | `knowledge/reviewed/**` is excluded from formatting and reproduction is tested | Keep future generators deterministic |
| Modified snapshot bytes | Exact file set and SHA-256 checks | Authenticate runtime approval digest |
| Stale or future assertion | Explicit clock and freshness checks | Refresh volatile claims before expiry |
| Executable data or remote schema loading | No data-driven execution or remote resolver | Review future adapters |
| Workflow credential theft | Read-only PR jobs, pinned Actions, no PR secrets | Protect repository administration |
| Dependency compromise | Exact pins, integrity lock, audit, notices | Review updates and upstream provenance |

SHA-256 proves identity, not factual correctness. Human review establishes the scoped
approval decision recorded in the snapshot; it is not a certification. Runtime trust
still requires a separately supplied manifest digest. CI evidence is a report, not a
signature. A compromised trusted runner or administrator remains outside this library's
protection.

No user roadmap ingestion, authentication, hosting or free-text parser exists yet.
The first Stage 2 reviewed snapshot does not imply broader factual coverage, UI security
or v0.0.1 release readiness.
