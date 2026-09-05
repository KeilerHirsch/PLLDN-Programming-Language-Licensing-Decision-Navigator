# Knowledge review

The intended promotion path is candidate, pull request, source and test review,
human approval, decision-difference review, then immutable snapshot publication.
Stage 0 established candidate and snapshot trust boundaries; Stage 1 adds deterministic
decision evaluation. Neither automates promotion nor substitutes AI review for human approval.

Review sources appropriate to the assertion class, including primary technical
documentation and applicable license text. Check source scope, version, target,
observation time and expiry. A URL or Reviewed label alone is not authority.

A change review must identify changed records, affected corpus cases and affected
recommendations with component and scenario scope. Automated PR-level decision-surface
diffs are not implemented yet; missing diffs must not be reported as zero.

A production approval digest must be supplied independently of candidate content
and protected against candidate-controlled replacement. The production allowlist
is currently empty. Test pins and synthetic fixtures are test-only evidence.
Released snapshots must remain immutable; corrections require a new snapshot.
