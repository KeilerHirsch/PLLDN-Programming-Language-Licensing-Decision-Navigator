# Contributing

Use issues for missing coverage, incorrect claims and implementation defects.
Include stable record IDs, a minimal non-sensitive example and primary sources.

## Development

Use the pinned Node/npm versions in README.md. Run `npm ci --ignore-scripts`,
then `npm run verify`. Change the schema before its consumers.
Add a positive case and a negative regression for each material invariant.
Keep extraction, decision, browser and end-to-end corpus categories distinct.

## Origin and authority

By submitting a contribution, you state that you created it or have authority
to contribute it under EUPL-1.2. Identify copied material, its source, license and
required notices. Do not submit private roadmaps or third-party confidential data.
No CLA or mandatory Signed-off-by process is required at this stage.

AI assistance must be disclosed when material to code, claims or provenance.
The submitting person remains responsible for checking sources and tests.
AI output is not an independent factual source or human approval.

## Knowledge changes

Follow [knowledge review](docs/knowledge-review.md). Synthetic fixtures remain test-only;
reviewed runtime knowledge must come from the governed candidate/promotion path.
Include changed record IDs, evidence and expected decision-surface effects in the PR.
Do not present uncomputed recommendation differences as zero change.

Higher-risk changes require independent human review. If no suitable reviewer
is available, the candidate remains unpromoted.
