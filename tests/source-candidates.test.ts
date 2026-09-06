// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { Document } from "../src/validation/documents.ts";
import {
  buildFreshnessReport,
  type FreshnessCandidateReport,
} from "../tools/source-candidates.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const toolPath = fileURLToPath(
  new URL("../tools/source-candidates.ts", import.meta.url),
);

function claim(
  claimId: string,
  validUntil?: string,
  sourceIds: readonly string[] = ["source.example"],
): Document {
  return {
    kind: "claim",
    record: {
      claim_id: claimId,
      source_ids: [...sourceIds],
      verified_at: "2026-09-05T20:00:00Z",
      world_freshness_class: "volatile",
      ...(validUntil === undefined ? {} : { valid_until: validUntil }),
      value: { type: "string", value: "must-not-leak" },
    },
  };
}
test("freshness reporter classifies only explicit valid_until claims", () => {
  const report = buildFreshnessReport(
    [
      claim("claim.z-later", "2026-09-06T23:00:00Z"),
      claim("claim.b-due", "2026-09-06T20:50:00Z", ["source.b", "source.b2"]),
      { kind: "source", record: { source_id: "source.b" } },
      claim("claim.a-expired", "2026-09-06T19:59:59Z", ["source.a"]),
      claim("claim.normative-without-expiry"),
    ],
    "2026-09-06T20:00:00Z",
    2,
  );

  assert.equal(report.schema_version, "0.1");
  assert.equal(report.evaluated_at, "2026-09-06T20:00:00Z");
  assert.equal(report.review_window_hours, 2);
  assert.deepEqual(
    report.candidates.map((item) => [item.claim_id, item.reason]),
    [
      ["claim.a-expired", "EXPIRED"],
      ["claim.b-due", "REVIEW_DUE"],
    ],
  );
  assert.deepEqual(report.candidates[1]?.source_ids, ["source.b", "source.b2"]);
  assert.equal("value" in (report.candidates[0] ?? {}), false);
});

test("freshness boundaries are inclusive and deterministic", () => {
  const report = buildFreshnessReport(
    [
      claim("claim.exact-expiry", "2026-09-06T20:00:00Z"),
      claim("claim.exact-horizon", "2026-09-06T22:00:00Z"),
    ],
    "2026-09-06T20:00:00Z",
    2,
  );
  assert.deepEqual(
    report.candidates.map((item) => item.reason),
    ["EXPIRED", "REVIEW_DUE"],
  );
});
test("invalid evaluation time and review window fail closed", () => {
  for (const at of [
    "2026-09-06T20:00:00",
    "not-a-time",
    "2026-02-30T00:00:00Z",
  ])
    assert.throws(() => buildFreshnessReport([], at, 2));
  for (const window of [0, -1, 1.5, Number.NaN])
    assert.throws(() =>
      buildFreshnessReport([], "2026-09-06T20:00:00Z", window),
    );
});

test("invalid claim freshness metadata fails closed", () => {
  assert.throws(() =>
    buildFreshnessReport(
      [claim("claim.bad-expiry", "not-a-time")],
      "2026-09-06T20:00:00Z",
      2,
    ),
  );
});

test("zero candidates is a valid canonical report", () => {
  const report = buildFreshnessReport(
    [claim("claim.later", "2026-09-07T20:00:00Z"), claim("claim.no-expiry")],
    "2026-09-06T20:00:00Z",
    2,
  );
  assert.deepEqual(report.candidates, []);
});
test("real Reviewed pack CLI output is byte-deterministic", () => {
  const dir = mkdtempSync(join(tmpdir(), "plldn-source-candidates-"));
  try {
    const first = join(dir, "first.json");
    const second = join(dir, "second.json");
    const args = [
      toolPath,
      "--evaluated-at",
      "2026-09-06T20:00:00Z",
      "--review-window-hours",
      "2",
    ];
    execFileSync(process.execPath, [...args, "--output", first], {
      cwd: repoRoot,
      stdio: "pipe",
    });
    execFileSync(process.execPath, [...args, "--output", second], {
      cwd: repoRoot,
      stdio: "pipe",
    });
    const firstRaw = readFileSync(first, "utf8");
    assert.equal(firstRaw, readFileSync(second, "utf8"));
    const report = JSON.parse(firstRaw) as FreshnessCandidateReport;
    assert.deepEqual(
      report.candidates.map((item) => [item.claim_id, item.reason]),
      [
        ["claim.go-current-version", "REVIEW_DUE"],
        ["claim.python-current-version", "REVIEW_DUE"],
        ["claim.rust-current-version", "REVIEW_DUE"],
        ["claim.typescript-current-version", "REVIEW_DUE"],
      ],
    );
    assert.deepEqual(report.candidates[0]?.source_ids, ["source.go-release"]);
    assert.equal(firstRaw.includes("must-not-leak"), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("CLI requires every explicit argument", () => {
  const result = spawnSync(
    process.execPath,
    [
      toolPath,
      "--evaluated-at",
      "2026-09-06T20:00:00Z",
      "--review-window-hours",
      "2",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /output|required|argument/i);
});
