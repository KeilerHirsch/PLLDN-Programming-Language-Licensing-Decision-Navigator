// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

export type LanguageCategory =
  | "assurance"
  | "domain"
  | "fundament"
  | "functional"
  | "legacy"
  | "managed"
  | "science"
  | "scripting"
  | "system"
  | "tool";

export type LicenseFamily =
  | "network-copyleft"
  | "permissive"
  | "public-domain-like"
  | "strong-copyleft"
  | "weak-copyleft";

export interface LanguageProductProfile {
  entity_id: string;
  label: string;
  tagline: string;
  categories: readonly LanguageCategory[];
  build_path: string;
  good_for: readonly string[];
  watch_for: readonly string[];
}

export interface LicenseProductProfile {
  entity_id: string;
  label: string;
  family: LicenseFamily;
  tagline: string;
  good_when: string;
  watch_for: string;
}

export interface UseCaseGuide {
  use_case_id: string;
  label: string;
  question: string;
  language_ids: readonly string[];
  rationale: string;
}

export interface ProductModel {
  languages: readonly LanguageProductProfile[];
  licenses: readonly LicenseProductProfile[];
  use_cases: readonly UseCaseGuide[];
}


export type DecisionBand = "low" | "medium" | "high";
export type PaceBand = "fast" | "medium" | "slow";
export type EcosystemBreadth = "niche" | "moderate" | "broad";
export type MaturityBand = "emerging" | "mature" | "legacy-stable";
export type ToolingBand = "basic" | "good" | "strong";

export interface LanguagePerformanceProfile {
  throughput_potential: DecisionBand;
  startup: PaceBand;
  runtime_overhead: DecisionBand;
  latency_predictability: DecisionBand;
  build_speed: PaceBand;
}

export interface LanguageComplexityProfile {
  learning_curve: DecisionBand;
  language_surface: DecisionBand;
  memory_reasoning: DecisionBand;
  toolchain: DecisionBand;
  dependency_management: DecisionBand;
  deployment: DecisionBand;
}

export interface LanguageEcosystemProfile {
  maturity: MaturityBand;
  breadth: EcosystemBreadth;
  tooling: ToolingBand;
  hiring_pool: EcosystemBreadth;
}

export interface LanguageDecisionProfile {
  performance: LanguagePerformanceProfile;
  complexity: LanguageComplexityProfile;
  ecosystem: LanguageEcosystemProfile;
}
