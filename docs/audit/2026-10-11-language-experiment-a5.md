<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Audit A5 — first reproducible, narrowly scoped performance measurement

**Stage:** protocol and toolchain implementation; not a measured result yet, not a Reviewed claim. The run is invoked manually only after merging the verified protocol to protected `main`.

## Why start with one constrained implementation?

The 35 Editorial language profiles contain 385 subjective performance/complexity bands with no individually linked independent measurements. To reduce audit risk, start with one repeatable implementation-specific result: JavaScript on **Node.js 24.15.0** (exact pinned project runtime) doing **JSON encoding + decoding** of a deterministic 2,048-record in-memory array. A benchmark result is a property of the whole test setup, not an intrinsic universal language score. Do not update `throughput_potential`, `startup`, `build_speed`, `learning_curve` or any other scalar based on this workload.

## Experimental protocol

The benchmark source is `tools/benchmark-node24-json-v01.ts`, the manual trigger is `.github/workflows/language-benchmark.yml`, and the corresponding immutable definition/limits are `catalog/audit/language-benchmark-protocol.v0.1.json`.

- Exactly 16 JSON stringify+parse pairs on the same deterministic 2,048-record input per sample; every sample's selected checksum is checked against a precomputed expected value.
- Five unmeasured warmups, 21 individually timed samples via Node's monotonic [`process.hrtime.bigint()`](https://nodejs.org/api/process.html#processhrtimebigint), using **nanoseconds** for raw measurements; median and nearest-rank p95 are explicitly recomputed in a validator.
- Report includes exact source commit SHA, **SHA-256 of workload source bytes**, SHA-256 of workload input, Node and V8 versions, CPU model and reported logical cores, OS/version/architecture, GitHub runner image metadata, memory totals, CPU process time, wall-time samples and a non-promotional caveat array.
- Workflow trigger is `workflow_dispatch` on `main`, with required `target_sha`. The checkout SHA, `github.sha` and fetched `origin/main` **must all match the exact requested commit**. All actions are full SHA pinned; permissions are only `contents: read`; no `pull_request_target`, no write rights, no release, no scheduled benchmarking.
- The output `reports/node24-json-roundtrip-v0.1.json` is checked against the deterministic fixture and source SHA by `tools/validate-node24-benchmark.ts` **before** 90-day artifact upload.

## How to produce real evidence

1. Merge the code **only after** Ubuntu, Windows, Chromium, Cross-platform replay, Security and Community gates pass on the exact PR head; verify post-merge `main` Verify/Security/Pages separately.
2. Launch the named workflow on **that current main** and supply the exact 40-hex commit as `target_sha` (for example using `gh workflow run language-benchmark.yml --ref main -f target_sha=<SHA>`).
3. Require the GitHub workflow run to succeed. Download its uploaded JSON artifact and check its raw samples, code/input hashes, runner details and truthful caveats; save run URL and artifact digest. A later immutable v0.2 *measurement record* can cite the run and raw artifact. A GitHub artifact expires after 90 days; a stable reviewed dataset requires deliberate archival and digest checks rather than treating an expiring link as permanent.
4. Keep the v0.3 **385-band Editorial unverified registry** and all historical claims untouched. A future independent audit can test one specifically worded, environment-scoped statement with a separately reviewed protocol and reference baseline. Merely recording a 21-sample run does **not** create an independently audited language ranking.

## Measurement limitations

A GitHub-hosted VM is not an isolated benchmark laboratory. CPU scheduling, turbo/frequency, VM contention, GC and image revisions can change results. Samples from a single process are not independent hosts. The p95 is **among complete workload runs**, not tail latency of server requests. The benchmark omits Node startup, build time, cold cache, filesystem, network, energy consumption, portability, cross-language comparators, and complexity tests. The setup is intentionally cheap and reproducible enough to expose the next correctness and provenance problems without masquerading as a language leaderboard.
