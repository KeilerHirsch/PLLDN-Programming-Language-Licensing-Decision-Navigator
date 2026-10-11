<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Audit A6 — separately allocated GitHub runner replication, no language score

**Status:** two measured *workload-only* observations, both with independently validated raw reports, but **not** independently reviewed by a third-party and **not** a standardized cross-language benchmark.

## Replication provenance

| Evidence | First measured run | Second measured run |
| --- | --- | --- |
| GitHub Action | [#38156931914](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/actions/runs/38156931914) | [#38157594143](https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/actions/runs/38157594143) |
| Exact source main | `c5cfc313464056869fc0bc1c16684dab1a4dee6e` | `81ef871fbdb5a567b55f86875eab13ea2f1e2afe` |
| Runtime / V8 | Node v24.15.0 / V8 13.6.233.17-node.48 | Identical |
| Benchmark source SHA-256 | `f046736314ac257ccfcda1e0c2b879213e47e147930d441185fdf35af78f6577` | Identical |
| Input SHA-256 | `6467fe8a85f6d13f8b62ce39cf1987da1a8358154a7863e827afb6b66c04ec67` | Identical |
| Runner VM reported CPU model | AMD EPYC 9V74 80-Core Processor | **AMD EPYC 7763 64-Core Processor** |
| Reported logical cores | 4 | 4 |
| Image revision | 20261004.327.1 | 20261004.327.1 |
| Original JSON SHA-256 | `1113f78e77805cf66985632dd2a7586fa71f7c35cfbddf87f016730bd4d07d05` | `e80fbae4981d95bce628904661c87a4064a4e0fd96c3b4fbe5510a4ad6bc73c0` |
| Artifact ZIP ID | 11709425110 | 11709780336 |
| Artifact ZIP SHA-256 | `2fcc21cdfe316d65c6934c43f78a3cc242abfd35baadd364960588b27e5238dd` | `d454ca70e9eb5d990dfaae3d93e870bde06e2f88ef9cc56203ca2a2b74162530` |
| Archived exact JSON | `catalog/audit/observations/node24-json-run-38156931914.v0.1.json` | `catalog/audit/observations/node24-json-run-38157594143.v0.1.json` |

Both workflows finished successfully, with their internal JSON source/fixture/time-percentile validator PASS. Original results are committed verbatim and protected by SHA assertions in `tests/node24-benchmark-observation.test.ts` and `tests/node24-benchmark-replication.test.ts`.

## Recorded measurements, not inferred language rankings

Workload: 2,048 deterministic records × 16 JSON encode+decode pairs per timed invocation, five untimed warmups and 21 nanosecond samples per run.

| Raw 21-sample summary | Run 1 | Run 2 |
| --- | ---: | ---: |
| Median | **19,814,713 ns** (19.81 ms) | **20,701,353 ns** (20.70 ms) |
| Sample p95 | **24,795,169 ns** (24.80 ms) | **22,457,945 ns** (22.46 ms) |

The second median is 886,640 ns (approximately **4.5%** longer) while its sample p95 is lower. This cannot be attributed to a language-runtime regression or improvement because the **reported VM CPU model changed**, even with the same Node version and hosted runner image. Both sample sets are merely descriptive, not controlled experiments with matched hardware, confidence intervals or independent hosts.

## Non-promotion and next quality gates

This is an evidence-rich example of *why* PLLDN must demand exact hardware and workload provenance before attaching the labels `Fast` / `High` to languages. No existing application-facing band has been changed or promoted: all **385** Editorial metrics remain non-Reviewed, as do the **345** historically seed-backed Preview claims and the **841** Unassessed candidates.

Next useful experiments: pin dedicated runner hardware (or reliably detect and reject runner-CPU mismatches), repeat across multiple independent VMs per architecture, and define equivalently validated workload implementations. Workload execution and file hashes support reproducibility, not automatic expert verification of a general dimension.
