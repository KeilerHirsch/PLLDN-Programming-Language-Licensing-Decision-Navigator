// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = "catalog/audit/observations/";
function sha256(raw: Uint8Array): string {
  return createHash("sha256").update(raw).digest("hex");
}

function loadMeasuredRun(id: string, expectedDigest: string) {
  const bytes = readFileSync(`${root}node24-json-run-${id}.v0.1.json`);
  assert.equal(sha256(bytes), expectedDigest);
  const report = JSON.parse(bytes.toString("utf8"));
  assert.equal(report.schema_version, "0.1");
  assert.equal(report.workload_id, "javascript.node24.json-roundtrip-v0.1");
  assert.equal(report.status, "MEASURED_WORKLOAD_ONLY_NOT_REVIEWED");
  assert.equal(report.editorial_band_promotions, 0);
  assert.equal(report.not_a_language_ranking, true);
  assert.equal(report.environment.github_run_id, id);
  assert.equal(report.environment.node, "v24.15.0");
  assert.equal(report.workload.records, 2048);
  assert.equal(report.workload.repeats_per_sample, 16);
  assert.equal(report.workload.warmups, 5);
  assert.equal(report.workload.measured_samples, 21);
  const samples = report.raw_wall_nanoseconds as unknown[];
  assert.equal(samples.length, 21);
  const sorted = samples.map((x) => {
    assert.equal(typeof x, "string");
    assert.match(x as string, /^[1-9][0-9]*$/u);
    return Number(x);
  }).sort((a, b) => a - b);
  assert(sorted.every((x) => Number.isSafeInteger(x)));
  assert.equal(report.summary.minimum_wall_nanoseconds, sorted[0]);
  assert.equal(report.summary.median_wall_nanoseconds, sorted[10]);
  assert.equal(report.summary.p95_wall_nanoseconds, sorted[19]);
  assert.equal(report.summary.maximum_wall_nanoseconds, sorted[20]);
  assert.equal(
    report.benchmark_source_sha256,
    sha256(readFileSync("tools/benchmark-node24-json-v01.ts")),
  );
  return report;
}

test("separate real-run raw JSON reports stay SHA-pinned and non-Reviewed", () => {
  const first = loadMeasuredRun(
    "38156931914",
    "1113f78e77805cf66985632dd2a7586fa71f7c35cfbddf87f016730bd4d07d05",
  );
  const second = loadMeasuredRun(
    "38157594143",
    "e80fbae4981d95bce628904661c87a4064a4e0fd96c3b4fbe5510a4ad6bc73c0",
  );
  assert.equal(first.source_commit, "c5cfc313464056869fc0bc1c16684dab1a4dee6e");
  assert.equal(second.source_commit, "81ef871fbdb5a567b55f86875eab13ea2f1e2afe");
  assert.equal(first.input_sha256, second.input_sha256);
  assert.equal(first.benchmark_source_sha256, second.benchmark_source_sha256);
  assert.equal(first.environment.v8, second.environment.v8);
  assert.equal(first.environment.github_runner_image, second.environment.github_runner_image);
  assert.notEqual(first.environment.cpu_model, second.environment.cpu_model);
  assert.equal(first.summary.median_wall_nanoseconds, 19814713);
  assert.equal(second.summary.median_wall_nanoseconds, 20701353);
  assert.equal(first.summary.p95_wall_nanoseconds, 24795169);
  assert.equal(second.summary.p95_wall_nanoseconds, 22457945);
  const audit = JSON.parse(
    readFileSync("catalog/audit/language-band-evidence.v0.3.json", "utf8"),
  );
  assert.deepEqual(audit.independently_supported_band_claims, []);
  assert.deepEqual(audit.reproducible_test_refs, []);
  assert.equal(first.editorial_band_promotions, 0);
  assert.equal(second.editorial_band_promotions, 0);
});
