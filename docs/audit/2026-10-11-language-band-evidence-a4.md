<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# Language audit A4 — performance and complexity claim status (2026-10-11)

**Status:** exhaustive structural audit of **linked evidence** for the 35 Editorial language profiles, *not* a benchmark, subjective expert validation, or license compatibility opinion. Baseline `main`: `b0979bed0082e79c462ce0a87182637a3f352db2`.

## Specific defect: numerical-looking bands without attached measurement conditions

`src/product/language-decision-profiles.ts` contains five Performance and six Complexity fields per Editorial language identity. Every language has values like `high`, `fast`, `low`. The values are directly displayed, filtered and exported without a corresponding **band-specific measurement, evaluated task, reproducible test reference, toolchain/platform scope or independently linked assessment**. These values should **not** be interpreted as measured absolute cross-language rankings. This is a reproducible evidence-completeness observation, not a determination that any particular value is false.

Current coverage for the Editorial decision bands: **35 languages × (5 performance + 6 complexity) = 385 assessment units** (175 performance, 210 complexity). These **385 are separate** from the 345 historical Preview claims sourced from three internal matrices, which remain unchanged and still not independently proven. The unrelated 841 Unassessed candidates remain explicitly UNKNOWN.

## Versioned, checkable evidence boundary

`catalog/audit/language-band-evidence.v0.3.json` records the exact 35 existing language IDs, eleven named dimensions, and the state `NO_LINKED_INDEPENDENT_EVIDENCE` / `EDITORIAL_PREVIEW_NOT_REVIEWED`; empty independently supported claim refs and reproducible test refs are explicit. The record describes what has been linked **in this new audit registry**, not what sources may exist on the Internet.

`npm run audit:language-bands` deterministically checks current source keys and dimensions against the v0.3 registry. It fails closed if an existing language or dimension changes without a corresponding registry migration. The test suite checks totals, empty-evidence discipline, and UI/CSV evidence-status presentation. All original qualitative Editorial values, v0.1 historical knowledge, Beta release/tag, and Reviewed Decision Lab remain unchanged.

Visible product behavior: every detailed language card now labels the metrics as unverified estimates; the expanded performance/complexity details explain the evidence gap; the language compare matrix (and shared CSV export) exposes an explicit evidence-status row. These notices do not turn `high`/ `fast` into `UNKNOWN` or silently promote them to `Reviewed`.

## Proposed proof rubric for a **future** per-band Reviewed record

**Performance:** (1) precisely versioned language implementation/compiler/runtime and operating system/target, (2) reproducible source and input data hashes, (3) workload scenario and correctness check, (4) toolchain flags and runtime settings, CPU/memory environment, process isolation, (5) warmup and repeated calibrated trials with raw samples and variability, (6) exactly defined units (for example wall time, CPU time, peak RSS, throughput and p95 latency), (7) explicit comparison baseline and its conditions, and (8) traceable reproduction command/CI artifact. Measurements compare **workloads and implementations under stated conditions**, not inherent universal properties of a language. `startup`, `build_speed`, `runtime_overhead`, `latency_predictability`, `throughput_potential` each need different workloads and denominators. Do not derive a universal ordinal band from an unrelated microbenchmark.

**Complexity:** Define task families, participant expertise and task constraints, scoring anchors for `low/medium/high`, tooling/dependency setup, baseline conditions, independent evaluator protocol, observable outcomes (setup time, cognitive difficulty proxy, failure modes and rework), adjudication, and reproducibility. The `learning_curve` and `language_surface` bands are not CPU benchmarks; subjectivity must be recorded rather than hidden.

Useful **benchmark-methodology sources**, not sources of cross-language rankings:
- [Official Go `testing` benchmark documentation](https://pkg.go.dev/testing), including calibration, reporting and benchmarking tools.
- [Python `pyperf` reproducible benchmark guidance](https://pyperf.readthedocs.io/en/stable/run_benchmark.html), including warmup, multiple process runs, environmental noise and metadata.
- [Google Benchmark user guide](https://github.com/google/benchmark/blob/main/docs/user_guide.md), including repeated timed iterations and reporting.

## Unresolved work

Zero of these 385 units is currently promoted to Reviewed by this audit; the **next substantive work** is to select versioned toolchains/workloads, run actual benchmarks and task studies, pin exact raw outputs, independently check and then version *individual* evidence-bearing claims. This PR is an explicit honesty boundary and an implementable audit contract — **not a claim that the underlying language expertise has been externally verified**.

**Required merge gates:** Verify Ubuntu, Windows, Chromium, Cross-platform Replay, Security, Community all green at exact PR head; post-merge `main` Verify/Security/Pages separately verified.
