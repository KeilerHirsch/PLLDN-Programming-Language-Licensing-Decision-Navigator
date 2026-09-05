# Architecture

Stage 0 is an authoring and validation library running on Node.js. It is not a
browser bundle or a recommendation engine. Future adapters must use the same
versioned JSON schemas.

The trust path is: strict JSON parsing, schema validation, typed reference and
scope validation, manifest integrity checks, then external snapshot approval.
The caller supplies trusted manifest digests from a separately protected source.
A candidate manifest, a source URL or a Reviewed label cannot approve itself.
The production digest allowlist is empty.

Snapshot verification returns validated knowledge documents only. Project facts
and decision traces are separate inputs and outputs; they cannot be smuggled into
a knowledge snapshot. No record URL is fetched and no data-supplied code executes.

Stage 0 checks structural and referential consistency. Source accuracy, human
review and promotion remain external responsibilities. Engine semantics, conflict
resolution, ranking, recommendation diffs and a user interface belong to later
stages.
