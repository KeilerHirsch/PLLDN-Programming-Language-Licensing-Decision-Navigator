// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const expectedPath = "reports/node24-json-roundtrip-v0.1.json";
assert.deepEqual(process.argv.slice(2), [expectedPath]);
const report = JSON.parse(readFileSync(expectedPath, "utf8"));
const selfTest = spawnSync(
  process.execPath,
  ["tools/benchmark-node24-json-v01.ts", "--self-test"],
  { encoding: "utf8" },
);
assert.equal(selfTest.status, 0, selfTest.stderr);
const fixture = JSON.parse(selfTest.stdout);
const sourceHash = createHash("sha256")
  .update(readFileSync("tools/benchmark-node24-json-v01.ts"))
  .digest("hex");
assert.equal(report.schema_version, "0.1");
assert.equal(report.workload_id, fixture.workload_id);
assert.equal(report.input_sha256, fixture.input_sha256);
assert.equal(report.benchmark_source_sha256, sourceHash);
assert.equal(report.workload.expected_checksum, fixture.expected_checksum);
assert.equal(report.workload.records, fixture.records);
assert.equal(report.workload.repeats_per_sample, fixture.repeats_per_sample);
assert.equal(report.workload.measured_samples, 21);
assert.equal(report.workload.warmups, 5);
assert.equal(report.status, "MEASURED_WORKLOAD_ONLY_NOT_REVIEWED");
assert.equal(report.not_a_language_ranking, true);
assert.equal(report.editorial_band_promotions, 0);
assert.equal(report.source_commit, process.env.BENCHMARK_SOURCE_SHA);
assert.match(report.source_commit, /^[a-f0-9]{40}$/u);
assert.equal(report.environment.node, "v24.15.0");
assert.equal(report.environment.github_runner_os, "Linux");
assert.equal(report.raw_wall_nanoseconds.length, 21);
const raw = report.raw_wall_nanoseconds.map((n: unknown) => {
  assert.equal(typeof n, "string");
  assert.match(n as string, /^[1-9][0-9]*$/u);
  return Number(n);
});
assert(raw.every((n: number) => Number.isSafeInteger(n)));
const sorted = [...raw].sort((a, b) => a - b);
assert.equal(report.summary.median_wall_nanoseconds, sorted[10]);
assert.equal(report.summary.p95_wall_nanoseconds, sorted[19]);
assert.equal(report.summary.minimum_wall_nanoseconds, sorted[0]);
assert.equal(report.summary.maximum_wall_nanoseconds, sorted[20]);
assert(Array.isArray(report.caveats));
assert(report.caveats.length >= 4);
console.log(
  JSON.stringify({
    validation: "PASS",
    workload_id: report.workload_id,
    source_commit: report.source_commit,
    samples: raw.length,
    median_wall_nanoseconds: sorted[10],
    p95_wall_nanoseconds: sorted[19],
    result_status: report.status,
  }),
);
