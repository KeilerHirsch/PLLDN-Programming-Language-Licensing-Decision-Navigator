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
  | "license-transition"
  | "network-copyleft"
  | "permissive"
  | "public-domain-like"
  | "source-available"
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


export type LicenseModel =
  | "license-transition"
  | "open-source"
  | "public-domain-like"
  | "source-available";

export type OsiStatus =
  | "approved"
  | "not-approved"
  | "not-applicable"
  | "unknown";

export type LicensePermission = "yes" | "conditional" | "no" | "unknown";

export type LicenseDisclosureScope =
  | "conditional"
  | "file"
  | "library"
  | "network-service"
  | "none"
  | "unknown"
  | "work";

export type LicenseTimeRule = "change-date" | "none" | "trial" | "unknown";

export interface LicenseDecisionProfile {
  model: LicenseModel;
  osi_status: OsiStatus;
  spdx_id: string | null;
  canonical_source: string;
  rights: {
    use: LicensePermission;
    modify: LicensePermission;
    redistribute: LicensePermission;
    commercial_use: LicensePermission;
    internal_business_use: LicensePermission;
    saas_hosting: LicensePermission;
    competitive_use: LicensePermission;
  };
  obligations: {
    source_disclosure: LicenseDisclosureScope;
    notice: LicensePermission;
    patent_grant: LicensePermission;
    time_rule: LicenseTimeRule;
  };
  compliance_complexity: DecisionBand;
  business_model_friction: DecisionBand;
}
