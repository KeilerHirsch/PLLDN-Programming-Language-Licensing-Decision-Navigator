// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  hasCompletedFullVerify,
  mostRecentVerifyRun,
} from "../tools/require-verified-push.ts";

const sha = "a".repeat(40);
const repository = "KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator";
const successful = {
  head_sha: sha,
  head_branch: "main",
  event: "push",
  status: "completed",
  conclusion: "success",
  created_at: "2026-10-26T14:00:00Z",
  repository: { full_name: repository },
};

test("manual Pages requires a successful full Verify for the exact commit", () => {
  assert.equal(
    hasCompletedFullVerify({ workflow_runs: [successful] }, sha, repository),
    true,
  );
});

test("manual Pages fails closed without trustworthy workflow-run data", () => {
  for (const payload of [null, {}, { workflow_runs: null }, { workflow_runs: [] }]) {
    assert.equal(hasCompletedFullVerify(payload, sha, repository), false);
  }
});

test("a Verify success from another revision, branch, event or repo cannot authorize", () => {
  const changes = [
    { head_sha: "b".repeat(40) },
    { head_branch: "develop" },
    { event: "pull_request" },
    { repository: { full_name: "someone/PLLDN" } },
  ];
  for (const change of changes) {
    const run = { ...successful, ...change };
    assert.equal(
      hasCompletedFullVerify({ workflow_runs: [run] }, sha, repository),
      false,
    );
  }
});

test("browser, Windows or replay failure must block manual publish", () => {
  for (const conclusion of ["failure", "cancelled", "skipped", null]) {
    const run = { ...successful, conclusion };
    assert.equal(
      hasCompletedFullVerify({ workflow_runs: [run] }, sha, repository),
      false,
    );
  }
  const pending = { ...successful, status: "in_progress", conclusion: null };
  assert.equal(
    hasCompletedFullVerify({ workflow_runs: [pending] }, sha, repository),
    false,
  );
});

test("latest failing or pending run supersedes an older successful Verify", () => {
  const newest = {
    ...successful,
    created_at: "2026-10-26T15:00:00Z",
    status: "completed",
    conclusion: "failure",
  };
  const payload = { workflow_runs: [successful, newest] };
  assert.equal(mostRecentVerifyRun(payload, sha, repository)?.conclusion, "failure");
  assert.equal(hasCompletedFullVerify(payload, sha, repository), false);
});
