// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import firstRun from "../../catalog/audit/observations/node24-json-run-38156931914.v0.1.json" with {
  type: "json",
};
import secondRun from "../../catalog/audit/observations/node24-json-run-38157594143.v0.1.json" with {
  type: "json",
};

export type Node24Observation = typeof firstRun;
const REPOSITORY =
  "https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator";
const ARCHIVE_COMMIT = "5405ce10303621a04dec20311b523ca63f02b62d";

export const WORKLOAD_ARCHIVES = [
  {
    report: firstRun,
    path: "catalog/audit/observations/node24-json-run-38156931914.v0.1.json",
    sha256: "1113f78e77805cf66985632dd2a7586fa71f7c35cfbddf87f016730bd4d07d05",
  },
  {
    report: secondRun,
    path: "catalog/audit/observations/node24-json-run-38157594143.v0.1.json",
    sha256: "e80fbae4981d95bce628904661c87a4064a4e0fd96c3b4fbe5510a4ad6bc73c0",
  },
] as const;

function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function sampleSpread(raw: readonly string[]) {
  check(raw.length > 0, "Missing raw samples");
  const sorted = raw
    .map((value) => {
      check(
        typeof value === "string" && /^[1-9][0-9]*$/u.test(value),
        "Invalid raw sample",
      );
      const number = Number(value);
      check(Number.isSafeInteger(number), "Unsafe raw sample");
      return number;
    })
    .sort((a, b) => a - b);
  const rank = (values: readonly number[], fraction: number): number => {
    const value = values[Math.ceil(values.length * fraction) - 1];
    check(value !== undefined, "Missing percentile sample");
    return value;
  };
  const median = rank(sorted, 0.5);
  const deviations = sorted
    .map((value) => Math.abs(value - median))
    .sort((a, b) => a - b);
  const q1 = rank(sorted, 0.25);
  const q3 = rank(sorted, 0.75);
  return {
    samples: raw.length,
    minimum_ns: rank(sorted, 1 / sorted.length),
    q1_ns: q1,
    median_ns: median,
    q3_ns: q3,
    p95_ns: rank(sorted, 0.95),
    maximum_ns: rank(sorted, 1),
    iqr_ns: q3 - q1,
    mad_ns: rank(deviations, 0.5),
  };
}

function validatedSpread(report: Node24Observation) {
  check(report.schema_version === "0.1", "Unsupported observation schema");
  check(
    report.status === "MEASURED_WORKLOAD_ONLY_NOT_REVIEWED" &&
      report.not_a_language_ranking === true &&
      report.editorial_band_promotions === 0,
    "Invalid observation status or promotion",
  );
  check(/^[a-f0-9]{40}$/u.test(report.source_commit), "Invalid source commit");
  check(
    /^[a-f0-9]{64}$/u.test(report.input_sha256) &&
      /^[a-f0-9]{64}$/u.test(report.benchmark_source_sha256),
    "Invalid workload digest",
  );
  check(
    /^[0-9]+$/u.test(report.environment.github_run_id),
    "Invalid run identity",
  );
  check(
    report.workload.measured_samples === 21 &&
      report.raw_wall_nanoseconds.length === 21,
    "Missing or inconsistent raw samples",
  );
  const spread = sampleSpread(report.raw_wall_nanoseconds);
  check(
    report.summary.minimum_wall_nanoseconds === spread.minimum_ns &&
      report.summary.median_wall_nanoseconds === spread.median_ns &&
      report.summary.p95_wall_nanoseconds === spread.p95_ns &&
      report.summary.maximum_wall_nanoseconds === spread.maximum_ns,
    "Recorded summary differs from raw samples",
  );
  return spread;
}

function recorded(value: unknown): boolean {
  if (typeof value === "string")
    return value.trim() !== "" && value.trim().toUpperCase() !== "UNKNOWN";
  if (typeof value === "number")
    return Number.isSafeInteger(value) && value > 0;
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

export function compareObservations(
  left: Node24Observation,
  right: Node24Observation,
) {
  validatedSpread(left);
  validatedSpread(right);
  const fields: [string, unknown, unknown][] = [
    ["workload_id", left.workload_id, right.workload_id],
    ["input_sha256", left.input_sha256, right.input_sha256],
    [
      "benchmark_source_sha256",
      left.benchmark_source_sha256,
      right.benchmark_source_sha256,
    ],
  ];
  for (const key of Object.keys(
    left.workload,
  ) as (keyof Node24Observation["workload"])[]) {
    fields.push([`workload.${key}`, left.workload[key], right.workload[key]]);
  }
  for (const key of [
    "node",
    "v8",
    "os",
    "release",
    "architecture",
    "cpu_model",
    "reported_logical_cores",
    "total_memory_bytes",
    "node_exec_argv",
    "github_runner_os",
    "github_runner_image",
  ] as const) {
    fields.push([
      `environment.${key}`,
      left.environment[key],
      right.environment[key],
    ]);
  }
  const matched: string[] = [];
  const mismatched: string[] = [];
  const unknown: string[] = [];
  for (const [field, a, b] of fields) {
    if (!recorded(a) || !recorded(b)) unknown.push(field);
    else if (JSON.stringify(a) === JSON.stringify(b)) matched.push(field);
    else mismatched.push(field);
  }
  return {
    status: "DESCRIPTIVE_ONLY_NOT_CONTROLLED" as const,
    matched_fields: matched,
    mismatched_fields: mismatched,
    unknown_fields: unknown,
    independent_host_count: "UNKNOWN" as const,
    confidence_interval: null,
    missing_controls: [
      "physical_host_identity",
      "cpu_affinity_and_frequency",
      "isolation_and_background_load",
      "independent_process_replications_per_environment",
      "comparable_alternate_implementation",
    ],
  };
}

export function archivedWorkloadAnalysis() {
  const observations = WORKLOAD_ARCHIVES.map(({ report, path, sha256 }) => ({
    run_id: report.environment.github_run_id,
    source_commit: report.source_commit,
    benchmark_source_sha256: report.benchmark_source_sha256,
    input_sha256: report.input_sha256,
    raw_record_sha256: sha256,
    raw_record_url: `${REPOSITORY}/blob/${ARCHIVE_COMMIT}/${path}`,
    run_url: `${REPOSITORY}/actions/runs/${report.environment.github_run_id}`,
    source_url: `${REPOSITORY}/blob/${report.source_commit}/tools/benchmark-node24-json-v01.ts`,
    environment: report.environment,
    workload: report.workload,
    spread: validatedSpread(report),
  }));
  return {
    schema_version: "0.1",
    audit_id: "A7",
    scope: "javascript.node24.json-roundtrip-v0.1",
    observations,
    total_raw_samples: observations.reduce(
      (total, entry) => total + entry.spread.samples,
      0,
    ),
    comparison: compareObservations(firstRun, secondRun),
    editorial_band_promotions: 0,
  };
}

export function workloadEvidenceFor(entityId: string) {
  return entityId === "language.javascript" ? archivedWorkloadAnalysis() : null;
}
