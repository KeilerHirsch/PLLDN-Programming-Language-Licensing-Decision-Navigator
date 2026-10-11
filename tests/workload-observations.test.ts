// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

function archived(id: string) {
  return JSON.parse(readFileSync(`catalog/audit/observations/node24-json-run-${id}.v0.1.json`, "utf8"));
}

test("nearest-rank spread preserves every raw value and reports unscaled MAD", async () => {
  const { sampleSpread } = await import("../src/product/workload-observations.ts");
  const raw = ["100", "2", "3", "4", "1"];
  assert.deepEqual(sampleSpread(raw), {
    samples: 5, minimum_ns: 1, q1_ns: 2, median_ns: 3, q3_ns: 4,
    p95_ns: 100, maximum_ns: 100, iqr_ns: 2, mad_ns: 1,
  });
  assert.deepEqual(raw, ["100", "2", "3", "4", "1"]);
});

test("invalid or unsafe raw timings cannot become descriptive evidence", async () => {
  const { sampleSpread } = await import("../src/product/workload-observations.ts");
  for (const raw of [[], ["0"], ["-1"], ["1.5"], ["NaN"], ["01"], ["9007199254740993"]]) {
    assert.throws(() => sampleSpread(raw));
  }
});

test("genuine archives expose dispersion without pooling or promotion", async () => {
  const { archivedWorkloadAnalysis } = await import("../src/product/workload-observations.ts");
  const result = archivedWorkloadAnalysis();
  assert.equal(result.total_raw_samples, 42);
  assert.equal(result.observations.length, 2);
  assert.deepEqual(result.observations.map((entry) => entry.spread.median_ns), [19814713, 20701353]);
  assert.deepEqual(result.observations.map((entry) => entry.spread.iqr_ns), [426185, 602456]);
  assert.deepEqual(result.observations.map((entry) => entry.spread.mad_ns), [233930, 317975]);
  assert.equal(result.comparison.status, "DESCRIPTIVE_ONLY_NOT_CONTROLLED");
  assert.deepEqual(result.comparison.mismatched_fields, ["environment.cpu_model"]);
  assert.equal(result.comparison.confidence_interval, null);
  assert.equal(result.editorial_band_promotions, 0);
});

test("matching CPU names alone cannot establish a controlled comparison", async () => {
  const { compareObservations } = await import("../src/product/workload-observations.ts");
  const left = archived("38156931914");
  const right = archived("38157594143");
  right.environment.cpu_model = left.environment.cpu_model;
  const comparison = compareObservations(left, right);
  assert.deepEqual(comparison.mismatched_fields, []);
  assert.equal(comparison.status, "DESCRIPTIVE_ONLY_NOT_CONTROLLED");
  assert.equal(comparison.independent_host_count, "UNKNOWN");
  assert.equal(comparison.confidence_interval, null);
  assert(comparison.missing_controls.includes("physical_host_identity"));
  assert(comparison.missing_controls.includes("independent_process_replications_per_environment"));
});

test("changed workload, flags and unknown metadata are comparison blockers", async () => {
  const { compareObservations } = await import("../src/product/workload-observations.ts");
  const left = archived("38156931914");
  const right = structuredClone(left);
  right.input_sha256 = "a".repeat(64);
  right.environment.node_exec_argv = ["--jitless"];
  right.environment.github_runner_image = "UNKNOWN";
  const comparison = compareObservations(left, right);
  assert(comparison.mismatched_fields.includes("input_sha256"));
  assert(comparison.mismatched_fields.includes("environment.node_exec_argv"));
  assert(comparison.unknown_fields.includes("environment.github_runner_image"));
  assert(!comparison.matched_fields.includes("environment.github_runner_image"));
});

test("summary tampering, unsupported schema and partial samples fail closed", async () => {
  const { compareObservations } = await import("../src/product/workload-observations.ts");
  const left = archived("38156931914");
  const badSummary = structuredClone(left);
  badSummary.summary.median_wall_nanoseconds += 1;
  assert.throws(() => compareObservations(left, badSummary), /summary/u);
  const badSchema = structuredClone(left);
  badSchema.schema_version = "0.2";
  assert.throws(() => compareObservations(left, badSchema), /schema/u);
  const missingSample = structuredClone(left);
  missingSample.raw_wall_nanoseconds.pop();
  assert.throws(() => compareObservations(left, missingSample), /sample/u);
  const promoted = structuredClone(left);
  promoted.editorial_band_promotions = 1;
  assert.throws(() => compareObservations(left, promoted), /promotion/u);
});

test("offline archive audit replays byte-identical reports deterministically", () => {
  const childEnv = { ...process.env };
  delete childEnv.NODE_V8_COVERAGE;
  delete childEnv.NODE_TEST_CONTEXT;
  const run = () => spawnSync(process.execPath, ["tools/audit-language-observations.ts"], {
    encoding: "utf8", env: childEnv,
  });
  const first = run();
  const second = run();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  const result = JSON.parse(first.stdout);
  assert.equal(result.archive_integrity, "PASS");
  assert.equal(result.total_raw_samples, 42);
  assert.equal(result.comparison.status, "DESCRIPTIVE_ONLY_NOT_CONTROLLED");
});
