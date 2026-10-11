// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, release, totalmem } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = "0.1";
const RUNTIME_VERSION = "v24.15.0";
const RECORDS = 2048;
const REPEATS_PER_SAMPLE = 16;
const WARMUPS = 5;
const SAMPLES = 21;
const OUTPUT = "reports/node24-json-roundtrip-v0.1.json";
const WORKLOAD_ID = "javascript.node24.json-roundtrip-v0.1";
const sourcePath = fileURLToPath(import.meta.url);

function sha256(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

const inputRecords = Array.from({ length: RECORDS }, (_, id) => ({
  id,
  group: id % 13,
  active: id % 3 === 0,
  amount: (id * 17) % 1009,
  token: `row-${id.toString(16).padStart(4, "0")}`,
}));
const inputJson = JSON.stringify(inputRecords);
const inputSha256 = sha256(inputJson);
const expectedChecksum = Array.from(
  { length: REPEATS_PER_SAMPLE },
  (_, index) => inputRecords[index].amount + RECORDS,
).reduce((a, b) => a + b, 0);

function roundTripWorkload(): number {
  let checksum = 0;
  for (let i = 0; i < REPEATS_PER_SAMPLE; i += 1) {
    const bytes = JSON.stringify(inputRecords);
    const parsed = JSON.parse(bytes) as typeof inputRecords;
    checksum += parsed[i].amount + parsed.length;
  }
  return checksum;
}

function validateFixture(): void {
  assert.equal(inputRecords.length, RECORDS);
  assert.equal(JSON.parse(inputJson).length, RECORDS);
  assert.equal(roundTripWorkload(), expectedChecksum);
  assert.match(inputSha256, /^[a-f0-9]{64}$/u);
}

function percentile(sorted: readonly number[], percentage: number): number {
  assert(sorted.length > 0);
  const index = Math.ceil(sorted.length * percentage) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function run(): void {
  validateFixture();
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--self-test") {
    console.log(
      JSON.stringify({
        schema_version: SCHEMA_VERSION,
        workload_id: WORKLOAD_ID,
        records: RECORDS,
        repeats_per_sample: REPEATS_PER_SAMPLE,
        input_sha256: inputSha256,
        expected_checksum: expectedChecksum,
      }),
    );
    return;
  }
  assert.deepEqual(args, ["--output", OUTPUT], "Only the fixed report path is supported");
  assert.equal(process.version, RUNTIME_VERSION, "Unsupported runtime version");
  const sourceSha = process.env.BENCHMARK_SOURCE_SHA;
  assert.match(sourceSha ?? "", /^[a-f0-9]{40}$/u, "Exact source commit required");
  assert.equal(process.env.GITHUB_ACTIONS, "true", "Run only on GitHub Actions");

  const sampleDurationsNs: string[] = [];
  for (let i = 0; i < WARMUPS; i += 1) {
    assert.equal(roundTripWorkload(), expectedChecksum);
  }
  const startCpu = process.cpuUsage();
  const startAt = new Date().toISOString();
  const startRss = process.memoryUsage().rss;
  for (let i = 0; i < SAMPLES; i += 1) {
    const begin = process.hrtime.bigint();
    const checksum = roundTripWorkload();
    const duration = process.hrtime.bigint() - begin;
    assert.equal(checksum, expectedChecksum);
    assert(duration > 0n, "Nonpositive wall time");
    sampleDurationsNs.push(String(duration));
  }
  const cpu = process.cpuUsage(startCpu);
  const sorted = sampleDurationsNs.map(Number).sort((a, b) => a - b);
  const medianNs = percentile(sorted, 0.5);
  const p95Ns = percentile(sorted, 0.95);
  const report = {
    schema_version: SCHEMA_VERSION,
    workload_id: WORKLOAD_ID,
    status: "MEASURED_WORKLOAD_ONLY_NOT_REVIEWED",
    not_a_language_ranking: true,
    editorial_band_promotions: 0,
    source_commit: sourceSha,
    benchmark_source_sha256: sha256(readFileSync(sourcePath)),
    input_sha256: inputSha256,
    workload: {
      kind: "in-process JSON.stringify + JSON.parse round trips",
      records: RECORDS,
      repeats_per_sample: REPEATS_PER_SAMPLE,
      records_processed_per_sample: RECORDS * REPEATS_PER_SAMPLE,
      expected_checksum: expectedChecksum,
      validation: "Every warmup and measured sample asserted against known checksum",
      warmups: WARMUPS,
      measured_samples: SAMPLES,
      timer: "process.hrtime.bigint",
      measured_section: "paired stringify and parse; no process startup, I/O, file access, or toolchain build",
    },
    environment: {
      captured_at_utc: startAt,
      node: process.version,
      v8: process.versions.v8,
      os: platform(),
      release: release(),
      architecture: process.arch,
      cpu_model: cpus()[0]?.model ?? "UNKNOWN",
      reported_logical_cores: cpus().length,
      total_memory_bytes: totalmem(),
      node_exec_argv: process.execArgv,
      github_runner_os: process.env.RUNNER_OS ?? "UNKNOWN",
      github_runner_image: process.env.ImageVersion ?? "UNKNOWN",
      github_run_id: process.env.GITHUB_RUN_ID ?? "UNKNOWN",
    },
    raw_wall_nanoseconds: sampleDurationsNs,
    summary: {
      median_wall_nanoseconds: medianNs,
      p95_wall_nanoseconds: p95Ns,
      minimum_wall_nanoseconds: sorted[0],
      maximum_wall_nanoseconds: sorted[sorted.length - 1],
      process_cpu_user_microseconds: cpu.user,
      process_cpu_system_microseconds: cpu.system,
      process_rss_before_bytes: startRss,
      process_rss_after_bytes: process.memoryUsage().rss,
    },
    caveats: [
      "Runner VM is shared/non-isolated; CPU frequency, thermal state and noisy neighbours are uncontrolled.",
      "No control comparison against another runtime/compiler/workload and no statistical confidence interval.",
      "Single process; p95 is across whole workload repetitions, not request latency.",
      "Process startup, garbage collector tracing, dependency resolution, build time and end-to-end app performance not measured.",
      "This is evidence for one Node.js implementation under this one runner environment; no high/fast bands are verified.",
    ],
  };
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({
      workload_id: WORKLOAD_ID,
      report: OUTPUT,
      samples: SAMPLES,
      median_ns: medianNs,
      p95_ns: p95Ns,
      source_commit: sourceSha,
    }),
  );
}

run();
