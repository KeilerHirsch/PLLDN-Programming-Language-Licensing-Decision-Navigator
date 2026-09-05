# Data contracts

Version 0.1 JSON schemas in schemas/ are the contract authority. Documents use
a closed wrapper containing kind and record. Stable IDs carry typed references;
unknown properties and unresolved or wrong-kind references are rejected.

Assertions distinguish TRUE, FALSE, UNKNOWN, NOT_APPLICABLE and CONDITIONAL.
Typed values describe booleans, integers, strings, enums, sets or quantities.
Unknown and not-applicable assertions cannot carry a value; conditional
assertions require conditions. These are representation checks, not inference.

Project lifecycle, fact kind and constraint strength are separate dimensions.
Constraints may carry explicit `EQ`, `NEQ`, `IN`, `GTE` or `LTE` operators;
plain facts may not. Operator/value types are checked against their dimension.
Global and component facts do not imply an automatic precedence rule. Component
and boundary IDs must resolve. License identifiers name exact supported variants;
listing an identifier does not assert license compatibility.

Entity scopes bound versions and targets. Relations carry separate from_scope
and to_scope, each checked against its own endpoint. Evidence references identify
sources and tests but do not prove that a source is accurate or a test meaningful.
Promotion must assess that evidence independently.

Volatile evidence requires an expiry. Evaluation time must be an explicit
timezone-bearing date-time; future evidence and expired assertions fail.
Replaying historical decisions requires their original evaluation time, schema
version and tooling, rather than silently substituting today's context. Decision
traces may separately name unresolved fact IDs and unresolved dimension IDs so a
missing fact is not fabricated merely to explain an `ASK` result.

Canonicalization is project-specific, not an RFC 8785 implementation: object keys
use JavaScript string ordering, arrays retain order, and output is UTF-8 with LF.
Unsafe keys, duplicate decoded JSON keys, non-finite or unsafe numbers, unpaired
surrogates and unsupported JavaScript values fail. Parsing is bounded to 1 MiB
and depth 64. Schema digest and exact file hashes bind snapshot interpretation.
Breaking contract changes require an explicit version and migration decision.
