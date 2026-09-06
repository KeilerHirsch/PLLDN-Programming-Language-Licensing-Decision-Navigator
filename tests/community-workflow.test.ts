// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflowPath = new URL(
  "../.github/workflows/community.yml",
  import.meta.url,
);

function workflow(): string {
  return readFileSync(workflowPath, "utf8");
}

test("community workflow is scheduled, manual and globally read-only", () => {
  const yaml = workflow();
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /cron:/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /permissions:\s*\r?\n\s+contents: read/);
  for (const forbidden of [
    "contents: write",
    "issues: write",
    "pull-requests: write",
    "checks: write",
    "gh issue create",
    "gh pr comment",
    "gh pr merge",
  ]) {
    assert.equal(yaml.includes(forbidden), false, forbidden);
  }
});
test("freshness job reads protected main with immutable tool pins", () => {
  const yaml = workflow();
  assert.match(
    yaml,
    /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/,
  );
  assert.match(
    yaml,
    /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/,
  );
  assert.match(
    yaml,
    /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/,
  );
  assert.match(yaml, /ref:\s*main/);
  assert.match(yaml, /persist-credentials:\s*false/);
  assert.match(yaml, /node-version:\s*["']?24\.15\.0["']?/);
  assert.match(yaml, /npm@11\.12\.1/);
  assert.match(yaml, /npm ci --ignore-scripts/);
});

test("freshness job passes explicit time and review horizon", () => {
  const yaml = workflow();
  assert.match(yaml, /date -u \+%Y-%m-%dT%H:%M:%SZ/);
  assert.match(yaml, /--evaluated-at/);
  assert.match(yaml, /--review-window-hours 24/);
  assert.match(yaml, /--output reports\/source-candidates\.json/);
  assert.match(yaml, /GITHUB_STEP_SUMMARY/);
  assert.match(yaml, /cat reports\/source-candidates\.json/);
});
test("freshness workflow uploads only the advisory JSON report", () => {
  const yaml = workflow();
  assert.match(yaml, /name:\s*source-candidates/);
  assert.match(yaml, /path:\s*reports\/source-candidates\.json/);
  assert.match(yaml, /retention-days:\s*30/);
  assert.equal(yaml.includes("knowledge/reviewed/**"), false);
  assert.equal(yaml.includes("text-rules/**"), false);
});
test("pull-request assistance is isolated from the freshness job", () => {
  const yaml = workflow();
  assert.match(yaml, /pull_request:/);
  assert.match(
    yaml,
    /freshness:\s*\r?\n\s+if:\s*github\.event_name != 'pull_request'/,
  );
  assert.match(
    yaml,
    /review:\s*\r?\n\s+if:\s*github\.event_name == 'pull_request'/,
  );
  assert.equal(yaml.includes("npm ci --ignore-scripts      - name"), false);
});

test("PR review uses trusted base tooling and fetches head only for diff", () => {
  const yaml = workflow();
  assert.match(yaml, /github\.event\.pull_request\.base\.sha/);
  assert.match(yaml, /github\.event\.pull_request\.head\.sha/);
  assert.match(yaml, /git fetch[^\n]+HEAD_SHA|git fetch[^\n]+head\.sha/i);
  assert.match(yaml, /git diff --name-only/);
  assert.match(yaml, /node tools\/community-review\.ts/);
  assert.match(yaml, /reports\/community-review\.json/);

  const fetchHead = yaml.search(
    /git fetch[^\n]+HEAD_SHA|git fetch[^\n]+head\.sha/i,
  );
  assert.ok(fetchHead >= 0);
  const afterFetch = yaml.slice(fetchHead);
  assert.equal(/npm ci|npm run/.test(afterFetch), false);
});

test("PR assistance remains artifact-and-summary only", () => {
  const yaml = workflow();
  assert.match(yaml, /name:\s*community-review/);
  assert.match(yaml, /path:\s*reports\/community-review\.json/);
  assert.match(yaml, /GITHUB_STEP_SUMMARY/);
  for (const forbidden of [
    "gh pr comment",
    "gh issue create",
    "pull-requests: write",
    "issues: write",
    "contents: write",
  ]) {
    assert.equal(yaml.includes(forbidden), false, forbidden);
  }
});
