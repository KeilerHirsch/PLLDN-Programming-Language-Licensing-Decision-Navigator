// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type {
  LanguageComplexityProfile,
  LanguageEcosystemProfile,
  LanguagePerformanceProfile,
} from "../product/types.ts";

export type DecisionTone = "favorable" | "mixed" | "unfavorable" | "neutral";
export type LanguageDecisionMetric = keyof (LanguagePerformanceProfile &
  LanguageComplexityProfile &
  LanguageEcosystemProfile);
export type LicenseDecisionMetric =
  | "commercial_use"
  | "saas_hosting"
  | "competitive_use"
  | "osi_status"
  | "model";

function scaleTone(
  value: string,
  favorable: string,
  mixed: string,
  unfavorable: string,
): DecisionTone {
  if (value === favorable) return "favorable";
  if (value === mixed) return "mixed";
  if (value === unfavorable) return "unfavorable";
  return "neutral";
}

export function languageDecisionTone(
  metric: LanguageDecisionMetric,
  value: string,
): DecisionTone {
  switch (metric) {
    case "throughput_potential":
    case "latency_predictability":
      return scaleTone(value, "high", "medium", "low");
    case "startup":
    case "build_speed":
      return scaleTone(value, "fast", "medium", "slow");
    case "runtime_overhead":
    case "learning_curve":
    case "language_surface":
    case "memory_reasoning":
    case "toolchain":
    case "dependency_management":
    case "deployment":
      return scaleTone(value, "low", "medium", "high");
    case "breadth":
    case "hiring_pool":
      return scaleTone(value, "broad", "moderate", "niche");
    case "tooling":
      return scaleTone(value, "strong", "good", "basic");
    case "maturity":
      // Age alone is not a disadvantage; emerging ecosystems have mixed trade-offs.
      if (value === "mature") return "favorable";
      if (value === "emerging") return "mixed";
      return "neutral";
  }
}

export function licenseDecisionTone(
  metric: LicenseDecisionMetric,
  value: string,
): DecisionTone {
  switch (metric) {
    case "commercial_use":
    case "saas_hosting":
    case "competitive_use":
      return scaleTone(value, "yes", "conditional", "no");
    case "osi_status":
      return value === "approved" ? "favorable" : "neutral";
    case "model":
      // License models describe terms, not an overall quality ranking.
      return "neutral";
  }
}
