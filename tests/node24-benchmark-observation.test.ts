// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const reportPath =
  "catalog/audit/observations/node24-json-run-38156931914.v0.1.json";
const sha256 = (input: Uint8Array): string =>
  createHash("sha256").update(input).digest("hex");

test("archived first Node 24 workload is byte-exact and tied to real Actions run", () => {
  const original = readFileSync(reportPath);
  assert.equal(
    sha256(original),
    "1113f78e77805cf66985632dd2a7586fa71f7c35cfbddf87f016730bd4d07d05",
  );
  const report = JSON.parse(original.toString("utf8"));
  assert.equal(report.schema_version, "0.1");
  assert.equal(report.workload_id, "javascript.node24.json-roundtrip-v0.1");
  assert.equal(report.status, "MEASURED_WORKLOAD_ONLY_NOT_REVIEWED");
  assert.equal(report.editorial_band_promotions, 0);
  assert.equal(report.not_a_language_ranking, true);
  assert.equal(
    report.source_commit,
    "c5cfc313464056869fc0bc1c16684dab1a4dee6e",
  );
  assert.equal(report.environment.github_run_id, "38156931914");
  assert.equal(report.environment.node, "v24.15.0");
  assert.equal(report.environment.os, "linux");
  assert.equal(report.environment.github_runner_os, "Linux");
  assert.equal(
    report.benchmark_source_sha256,
    sha256(readFileSync("tools/benchmark-node24-json-v01.ts")),
  );
  assert.equal(
    report.input_sha256,
    "6467fe8a85f6d13f8b62ce39cf1987da1a8358154a7863e827afb6b66c04ec67",
  );
  assert.equal(report.workload.records, 2048);
  assert.equal(report.workload.repeats_per_sample, 16);
  assert.equal(report.workload.warmups, 5);
  assert.equal(report.workload.measured_samples, 21);
  assert.equal(report.workload.expected_checksum, 34808);
  assert(Array.isArray(report.raw_wall_nanoseconds));
  assert.equal(report.raw_wall_nanoseconds.length, 21);
  const durations = report.raw_wall_nanoseconds.map((value: unknown) => {
    assert.equal(typeof value, "string");
    assert.match(value as string, /^[1-9][0-9]*$/u);
    return Number(value);
  });
  assert(durations.every((value: number) => Number.isSafeInteger(value)));
  const ordered = durations.sort((a: number, b: number) => a - b);
  assert.equal(report.summary.minimum_wall_nanoseconds, ordered[0]);
  assert.equal(report.summary.median_wall_nanoseconds, ordered[10]);
  assert.equal(report.summary.p95_wall_nanoseconds, ordered[19]);
  assert.equal(report.summary.maximum_wall_nanoseconds, ordered[20]);
  assert.equal(report.summary.median_wall_nanoseconds, 19814713);
  assert.equal(report.summary.p95_wall_nanoseconds, 24795169);
  assert(report.caveats.length >= 4);
});

test("archived measured workload never promotes the 385 qualitative language bands", () => {
  const inventory = JSON.parse(
    readFileSync("catalog/audit/language-band-evidence.v0.3.json", "utf8"),
  );
  const protocol = JSON.parse(
    readFileSync("catalog/audit/language-benchmark-protocol.v0.1.json", "utf8"),
  );
  const snapshot = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(inventory.assessment_units.total_bands, 385);
  assert.equal(inventory.independently_supported_band_claims.length, 0);
  assert.equal(inventory.reproducible_test_refs.length, 0);
  assert.equal(protocol.status, "PROTOCOL_ONLY_NO_RUN_IN_THIS_RECORD");
  assert.deepEqual(protocol.measurements, []);
  assert.equal(snapshot.editorial_band_promotions, 0);
  assert.equal(snapshot.not_a_language_ranking, true);
});
