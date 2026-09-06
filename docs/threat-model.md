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
| False-confident free-text mapping | Small reviewed literal rule surface plus gold-corpus regression; unsupported text abstains | Require a regression case and review for every rule expansion |
| Contradictory text silently chooses one interpretation | Opposing same-facet matches become `CONFLICTING` and are not confirmable | User resolves the authoritative facet manually |
| Rule drift invents knowledge | Production rules target only checked-in facets derived from Reviewed boolean dimensions | Re-review facet/rule changes together with provenance tests |
| User text becomes code, network input or persisted telemetry | 16 KiB bound, declarative token rules, no regex/code/provider surface, source checks forbid network/dynamic execution | Review future adapters and storage proposals as new trust boundaries |
| Analysis silently mutates canonical facts | Raw text/proposals remain outside `UiController`; only explicit PROPOSED confirmation calls the existing facet path | Preserve manual/text equivalence tests |
| Workflow credential theft | Read-only PR jobs, pinned Actions, no PR secrets | Protect repository administration |
| Dependency compromise | Exact pins, integrity lock, audit, notices | Review updates and upstream provenance |

SHA-256 proves identity, not factual correctness. Human review establishes the scoped
approval decision recorded in the snapshot; it is not a certification. Runtime trust
still requires a separately supplied manifest digest. CI evidence is a report, not a
signature. A compromised trusted runner or administrator remains outside this library's
protection.

Stage 4 accepts bounded local text only through the deterministic proposal accelerator;
it does not persist, upload or treat that text as canonical project state. No account,
authentication, backend, hosted inference or general natural-language parser exists.
The repository still ships no default trusted runtime snapshot, and Stage 4 does not imply
broad factual coverage, general recommendation accuracy or v0.0.1 readiness.
