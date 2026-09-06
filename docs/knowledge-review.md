# Knowledge review

The promotion path is candidate, source and test review, human approval,
decision-difference review, then immutable snapshot publication. Stage 0 established
candidate and snapshot trust boundaries; Stage 1 added deterministic decision
evaluation. Stage 2 has now exercised the promotion path for its first small pack.

The human review binds candidate manifest
`4e5248d930fc592fe95a7dd03bd7bfd26e2c4ba619c291ebd71820b63864544f`.
Promotion produced `reviewed.stage2-core.2026-09-05` with 16 Reviewed assertions
and the retained human review record. AI or candidate content cannot self-approve.

Review sources appropriate to the assertion class, including primary technical
documentation and applicable license identity sources. Check source scope, version,
target, observation time and expiry. A URL or `Reviewed` label alone is not authority.

A change review must identify changed records, affected corpus cases and affected
recommendations with component and scenario scope. Automated PR-level decision-surface
diffs are not implemented yet; missing diffs must not be reported as zero.

Runtime approval remains separate from human knowledge review. A trusted snapshot
digest must be supplied independently and protected against snapshot-controlled
replacement. The repository's default runtime allowlist remains empty. Released
snapshots must remain immutable; corrections require a new snapshot.

## Stage 5B advisory automation

Freshness reports and PR classifiers operate before authority is granted. Their complete
path is candidate input -> candidate PR -> validation and evidence -> human review ->
immutable promotion -> separate runtime approval. No job summary or artifact is approval.

Freshness automation reports only claims whose existing `valid_until` metadata is expired
or inside the explicit review horizon. It does not propose replacement values, sources or
Reviewed assertions. PR classification reports touched review surfaces and companion
evidence patterns; it does not decide whether those companions are sufficient.

Dictionary issue submissions are untrusted candidate material. A resulting PR still needs
the Stage 4 rule schema, positive and negative/near-miss corpus coverage, ambiguity and
conflict behavior, manual/text equivalence and normal human review before promotion.
