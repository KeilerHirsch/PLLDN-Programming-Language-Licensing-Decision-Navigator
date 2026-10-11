// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const benchmark = "tools/benchmark-node24-json-v01.ts";
const workflow = ".github/workflows/language-benchmark.yml";
const run = (...args: string[]) =>
  spawnSync(process.execPath, [benchmark, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_ACTIONS: "false",
      BENCHMARK_SOURCE_SHA: "",
    },
  });

test("Node 24 workload fixture identity and checksum replay deterministically", () => {
  const first = run("--self-test");
  const second = run("--self-test");
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  const evidence = JSON.parse(first.stdout);
  assert.equal(evidence.schema_version, "0.1");
  assert.equal(evidence.records, 2048);
  assert.equal(evidence.repeats_per_sample, 16);
  assert.match(evidence.input_sha256, /^[a-f0-9]{64}$/u);
  assert(Number.isSafeInteger(evidence.expected_checksum));
  assert(evidence.expected_checksum > 0);
});

test("measurement cannot run as an unpinned local benchmark", () => {
  const bad = run("--output", "reports/node24-json-roundtrip-v0.1.json");
  assert.notEqual(bad.status, 0);
  assert(
    bad.stderr.includes("Unsupported runtime version") ||
      bad.stderr.includes("Exact source commit required"),
  );
  const unwanted = run("--output", "../unsafe.json");
  assert.notEqual(unwanted.status, 0);
  assert(unwanted.stderr.includes("Only the fixed report path is supported"));
});

test("manual evidence workflow pins main, runtime and read-only artifact transport", () => {
  const yaml = readFileSync(workflow, "utf8");
  assert.match(yaml, /^name: Manual Node 24 workload evidence$/mu);
  assert.match(yaml, /workflow_dispatch:/u);
  assert.doesNotMatch(
    yaml,
    /^\s+(?:push|pull_request|pull_request_target|schedule):/mu,
  );
  assert.match(yaml, /^permissions:\n\s{2}contents: read$/mu);
  assert.match(yaml, /if: github.ref == 'refs\/heads\/main'/u);
  assert.match(yaml, /persist-credentials: false/u);
  assert.match(yaml, /ref: \$\{\{ inputs.target_sha \}\}/u);
  assert.match(yaml, /git rev-parse refs\/remotes\/origin\/main/u);
  assert.match(yaml, /test "\$GITHUB_SHA" = "\$BENCHMARK_SOURCE_SHA"/u);
  assert.match(yaml, /node-version: "24\.15\.0"/u);
  assert.match(
    yaml,
    /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/u,
  );
  assert.match(
    yaml,
    /actions\/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1/u,
  );
  assert.match(
    yaml,
    /actions\/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9/u,
  );
  assert.match(yaml, /retention-days: 90/u);
  assert.match(yaml, /validate-node24-benchmark/u);
  assert.doesNotMatch(
    yaml,
    /contents: write|pages: write|id-token: write|gh release/u,
  );
});

test("first workload data remains separate from Reviewed and Editorial metric bands", () => {
  const doc = readFileSync(
    "docs/audit/2026-10-11-language-band-evidence-a4.md",
    "utf8",
  );
  const script = readFileSync(benchmark, "utf8");
  assert(doc.includes("385"));
  assert(script.includes("MEASURED_WORKLOAD_ONLY_NOT_REVIEWED"));
  assert(script.includes("editorial_band_promotions: 0"));
  assert(script.includes("process.hrtime.bigint"));
  assert(script.includes("sha256(readFileSync(sourcePath))"));
});
