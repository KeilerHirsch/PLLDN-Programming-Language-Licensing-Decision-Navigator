// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
// A manual Pages dispatch is not a completed Verify workflow.
// This gate fails closed unless a successful full push Verify is bound to this commit.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type VerifyRun = {
  head_sha?: string;
  head_branch?: string;
  event?: string;
  status?: string;
  conclusion?: string | null;
  created_at?: string;
  repository?: { full_name?: string };
};

export function mostRecentVerifyRun(
  payload: unknown,
  sha: string,
  repository: string,
): VerifyRun | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const runs = (payload as { workflow_runs?: unknown }).workflow_runs;
  if (!Array.isArray(runs)) return undefined;
  const matches = runs.filter((value): value is VerifyRun => {
    if (!value || typeof value !== "object") return false;
    const run = value as VerifyRun;
    return (
      run.head_sha === sha &&
      run.head_branch === "main" &&
      run.event === "push" &&
      run.repository?.full_name === repository &&
      typeof run.created_at === "string" &&
      Number.isFinite(Date.parse(run.created_at))
    );
  });
  matches.sort(
    (a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""),
  );
  return matches[0];
}

export function hasCompletedFullVerify(
  payload: unknown,
  sha: string,
  repository: string,
): boolean {
  const run = mostRecentVerifyRun(payload, sha, repository);
  return run?.status === "completed" && run.conclusion === "success";
}

async function requireVerifiedPushRun(): Promise<void> {
  const sha = process.env.TARGET_SHA ?? "";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error("Invalid TARGET_SHA");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error("Invalid GITHUB_REPOSITORY");
  if (!token) throw new Error("Missing read-only GITHUB_TOKEN");

  // This endpoint is scoped to the actual Verify workflow, not arbitrary checks.
  const uri = new URL(
    `https://api.github.com/repos/${repository}/actions/workflows/verify.yml/runs`,
  );
  uri.searchParams.set("event", "push");
  uri.searchParams.set("branch", "main");
  uri.searchParams.set("head_sha", sha);
  uri.searchParams.set("per_page", "100");

  const response = await fetch(uri, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`Cannot read Verify runs: HTTP ${response.status}`);
  const payload: unknown = await response.json();
  if (!hasCompletedFullVerify(payload, sha, repository)) {
    throw new Error(
      "Manual Pages publish blocked: no successful full Verify for HEAD",
    );
  }
  console.log("Full Verify workflow success confirmed for exact main commit.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await requireVerifiedPushRun();
}
