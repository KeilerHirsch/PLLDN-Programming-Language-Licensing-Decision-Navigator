# Current pre-release threat model

Assets: canonical project facts, reviewed knowledge integrity, source identity,
review authority, snapshot identity, dependency provenance and private contributor data.

Untrusted inputs: candidate JSON, source references, PR content, dependency changes,
caller-injected browser runtime material, facet actions and knowledge-derived display text.
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
| Unapproved browser runtime material | `bootstrapUiRuntime()` requires caller-supplied approval and reuses `verifySnapshot()` | Protect the external approval source |
| Knowledge text becomes executable HTML | DOM renderer uses `textContent`/native element creation and forbids HTML interpolation | Review future rendering helpers |
| UI invents or weakens decision semantics | Controller reuses `evaluateDecision()` and `facetCounts()`; UI-owned constraints are namespaced | Keep business rules out of render/startup code |
| Stale recommendation remains after failed UI action | Failed action renders a diagnostic state instead of reusing prior counts/results | Add application E2E coverage before Beta |
| Browser build leaks Node-only or synthetic fixture material | Deterministic bundle tests reject `node:`, `readFileSync` and test candidate IDs | Review future build plugins/assets |
| Workflow credential theft | Read-only PR jobs, pinned Actions, no PR secrets | Protect repository administration |
| Dependency compromise | Exact pins, integrity lock, audit, notices | Review updates and upstream provenance |

SHA-256 proves identity, not factual correctness. Human review establishes the scoped
approval decision recorded in the snapshot; it is not a certification. Runtime trust
still requires a separately supplied manifest digest. CI evidence is a report, not a
signature. A compromised trusted runner or administrator remains outside this library's
protection.

No user roadmap ingestion, authentication, hosting or free-text parser exists yet.
A framework-free browser shell exists, but the repository ships no default trusted
runtime snapshot and Stage 3 does not imply broad factual coverage or v0.0.1 readiness.
