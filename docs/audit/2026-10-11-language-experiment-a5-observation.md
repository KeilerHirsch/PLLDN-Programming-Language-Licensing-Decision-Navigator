<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Audit A5 — archived first real Node 24 benchmark observation

**State:** `MEASURED_WORKLOAD_ONLY_NOT_REVIEWED`. This is a real, reproducible workload observation, **not** independent verification of any Editorial performance band and **not** a universal language ranking.

## Actual execution and origin

- **GitHub Actions run:** [Manual Node 24 workload evidence #38156931914](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/actions/runs/38156931914), completed successfully with report validation PASS; job `114521731491`.
- **Measured exact main commit:** `c5cfc313464056869fc0bc1c16684dab1a4dee6e` (post #75, all Verify/Security/Pages green).
- **Workflow artifact:** `node24-json-workload-c5cfc313464056869fc0bc1c16684dab1a4dee6e`, artifact ID `11709425110`, archive SHA-256 `2fcc21cdfe316d65c6934c43f78a3cc242abfd35baadd364960588b27e5238dd`; GitHub retention 90 days (expiry 2027-01-09).
- **Original raw JSON SHA-256:** `1113f78e77805cf66985632dd2a7586fa71f7c35cfbddf87f016730bd4d07d05`. A **byte-exact copy** of that JSON is preserved as `catalog/audit/observations/node24-json-run-38156931914.v0.1.json`; the regression test checks its SHA-256 and contents. It is no longer dependent on GitHub's expiring artifact retention.
- **Benchmark code SHA-256:** `f046736314ac257ccfcda1e0c2b879213e47e147930d441185fdf35af78f6577`; generated deterministic input SHA-256 `6467fe8a85f6d13f8b62ce39cf1987da1a8358154a7863e827afb6b66c04ec67`.

## Precisely what was measured

Node.js **v24.15.0** / V8 `13.6.233.17-node.48`; Ubuntu 24.04 hosted runner, Linux kernel `6.17.0-1022-azure`, x64, reported CPU `AMD EPYC 9V74 80-Core Processor`, four reported logical cores, `20261004.327.1` runner image. Those are *reported virtual hardware properties*, not guaranteed dedicated physical cores.

Each sample is 16 in-process `JSON.stringify + JSON.parse` pairs using one deterministic 2,048-record array (32,768 rows processed per sample). Five warmups; **21 measured wall-times** with `process.hrtime.bigint()`. A checksum is asserted on each warmup and sample, and the independent report validator recomputes the nearest-rank p95 and median from the raw nanoseconds.

| Observed property | Exact value | Rounded |
| --- | ---: | ---: |
| Minimum (21 samples) | 18,762,397 ns | 18.76 ms |
| Median (11th sorted sample) | **19,814,713 ns** | **19.81 ms** |
| p95 (20th sorted sample) | **24,795,169 ns** | **24.80 ms** |
| Maximum (21 samples) | 27,774,075 ns | 27.77 ms |

Raw nanosecond list (original order), process CPU time, RSS, exact environment and warnings all remain in the linked source JSON.

## What the number does **not** prove

The GitHub runner is a **shared VM**, not an isolated performance laboratory. The measurement is one process on one hosted VM image at one point in time. No comparator implementation, performance baseline, statistical uncertainty interval, multiple host replicates or independent third-party run exists. It does not measure startup, compilation, JIT warmup separately, memory-management pause guarantees, network latency, application throughput, ecosystem quality, developer learning cost or software complexity.

**No rating changed.** The 385 Editorial language bands in the v0.3 register still have **zero** independently verified per-band claims. The 345 historical internally seeded Preview claims, 841 unassessed identities, Reviewed Decision Lab, and immutable Beta 1 release/tag are untouched.

A valid next step is a **second independent replication on a different runner**, then a matched alternate implementation and workload design, all versioned. Only such scoped primary observations can potentially underpin a specific evidence-bearing decision in a later review process; this initial run has `not_a_language_ranking: true` and `editorial_band_promotions: 0`.
