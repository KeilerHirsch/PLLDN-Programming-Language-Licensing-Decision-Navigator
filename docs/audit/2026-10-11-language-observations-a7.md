<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Audit A7 — accessible workload observations and descriptive comparison

**Status:** two immutable Node.js 24.15.0 JSON-workload observations with reproducible dispersion and explicit comparison limits. No language rating or complexity assessment is verified by this analysis.

## Reproduce the archived analysis

Run `npm run audit:language-observations`. The offline command checks the original byte-level SHA-256 of both [A6 reports](2026-10-11-language-experiment-a6-replication.md), validates their raw sample counts and recorded summaries, and emits deterministic JSON. It makes no network requests, executes no measured-source commands, and does not change the archives.

The JavaScript editorial profile exposes the same analysis in a separate, initially collapsed **Measured workload evidence** disclosure. Each run has its own original Actions link, commit-pinned raw record and exact measured-source link. Other languages and all Unassessed identities receive no inferred observations.

## Statistics and experimental unit

Each recorded process has five warmups followed by 21 ordered timed samples. One sample is 16 paired JSON stringify/parse operations over 2,048 records. Startup, I/O, build time and request-level latency are outside this measured section.

All 42 original samples are retained, with no outlier removal. Compute summaries separately for each process; never pool these timings into 42 independent host observations.

For a sorted sample of length `n`, percentile `p` uses the nearest-rank value at one-based position `ceil(n × p)`. Both real sample counts are odd, so the nearest-rank median is their middle observation. IQR is Q3 minus Q1. MAD is the median absolute deviation from that median, without a normal-distribution scaling factor.

| Whole-workload duration, ns | Run 38156931914 | Run 38157594143 |
| --- | ---: | ---: |
| Median | 19,814,713 | 20,701,353 |
| Q1 | 19,622,458 | 20,545,833 |
| Q3 | 20,048,643 | 21,148,289 |
| IQR | 426,185 | 602,456 |
| Unscaled MAD | 233,930 | 317,975 |
| Sample p95 | 24,795,169 | 22,457,945 |

IQR and MAD describe the observed within-process spread. They are not confidence intervals for a runtime difference, measures of request latency, or uncertainty estimates across independent hardware allocations. The browser rounds durations to two decimal places in milliseconds; the raw records and CLI retain integer nanoseconds.

## Comparison eligibility

The analysis records exact agreement, disagreement or unknown values for the workload identity, input and implementation hashes, measured-section parameters, runtime/V8, OS/kernel, architecture, CPU model, logical core count, memory, runtime flags and runner image.

The actual A6 pair differs at `environment.cpu_model`: AMD EPYC 9V74 versus AMD EPYC 7763. The reported common image, Node version and input do not establish matched physical hardware.

Even an otherwise matching v0.1 metadata pair remains **DESCRIPTIVE_ONLY_NOT_CONTROLLED**. This historical report format does not establish physical host identity, CPU affinity/frequency, isolation/background load, replicated independent processes per environment, or an equivalent alternate implementation. Independent physical host count remains UNKNOWN and the comparison confidence interval is null. No speedup, regression verdict or rating promotion is emitted.

For a controlled implementation comparison, record the intended variable separately from confounders: exact toolchain versions and flags, separately hashed equivalent implementations, common fixture and correctness semantics, same-host paired or appropriately blocked allocations, balanced/interleaved order, repeated fresh processes, independent allocation identifiers, raw per-process timing and environment controls. Any uncertainty model must identify its experimental unit and assumptions before interpreting a difference. Matching CPU product names alone is insufficient.

Complexity requires evaluated tasks, participant expertise, predefined scoring anchors and independent adjudication. These CPU measurements cannot validate learning curve, language surface, memory reasoning, toolchain, dependency-management or deployment bands.

The [pyperf analysis guidance](https://pyperf.readthedocs.io/en/latest/analyze.html) motivates exposing distributions and robust descriptive spread. The [Google Benchmark guide](https://google.github.io/benchmark/user_guide.html) discusses repeated measurements, interleaving and environmental variance. Neither source validates these two observations as a controlled comparison or supplies a general language ranking.

## Behavioral verification

- Initial A7 reproducer: all seven new `node --test tests/workload-observations.test.ts` cases executed and failed before the module/CLI existed; the real Chromium probe rejected the absent measured-workload disclosure. After implementation, all seven cases and desktop/mobile/candidate probes passed.
- Browser-capability regression: plain `environment.node` metadata was wrongly rejected by a substring check. The failing reproducer was observed before repair. Static, dynamic, re-export and CommonJS quoted `node:` references remain rejected.
- `node --test tests/browser-build.test.ts tests/ui-product-contract.test.ts tests/workload-observations.test.ts`: 16/16 PASS after integration fixes.
- Negative checks cover invalid/unsafe timings, altered summaries, incomplete samples, unsupported schema, unknown metadata and attempted rating promotion. Two deterministic CLI runs also check byte-exact archive integrity.
- The Chromium smoke opens the separate evidence on desktop and a 390px viewport, checks both genuine runs and uncertainty boundaries, validates source links and expanded mobile layout.

The original Beta release/tag/workflow, historical snapshots, 345 seeded Preview claims, 385 unverified editorial bands and 841 Unassessed candidates are outside this change. No new release or Reviewed promotion is implied.
