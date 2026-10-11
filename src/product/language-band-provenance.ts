// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

/** A v0.3 audit coverage rule, not a replacement for historical Preview bands. */
export const LANGUAGE_BAND_PERFORMANCE_DIMENSIONS = [
  "throughput_potential",
  "startup",
  "runtime_overhead",
  "latency_predictability",
  "build_speed"
] as const;
export const LANGUAGE_BAND_COMPLEXITY_DIMENSIONS = [
  "learning_curve",
  "language_surface",
  "memory_reasoning",
  "toolchain",
  "dependency_management",
  "deployment"
] as const;

/** Shown with heuristic ratings; no per-band Reviewed evidence has been linked. */
export const LANGUAGE_BAND_EVIDENCE_NOTICE =
  "Unverified Editorial Preview bands: no independent, reproducible per-dimension measurement or task-based review is linked (audit v0.3). These are context-sensitive heuristics, not measured cross-language rankings.";
