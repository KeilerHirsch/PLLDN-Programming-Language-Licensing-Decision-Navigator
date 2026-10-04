// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { LANGUAGE_DECISION_PROFILES } from "./language-decision-profiles.ts";
import { LICENSE_DECISION_PROFILES } from "./license-decision-profiles.ts";
import type { LanguageProductProfile, LicenseProductProfile } from "./types.ts";

export interface ProductFilterState {
  languageCategory: string;
  languageThroughput: string;
  languageLearning: string;
  languageEcosystem: string;
  licenseModel: string;
  licenseCommercial: string;
  licenseSaas: string;
  licenseCompetitive: string;
  licenseOsi: string;
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilterState = {
  languageCategory: "any",
  languageThroughput: "any",
  languageLearning: "any",
  languageEcosystem: "any",
  licenseModel: "any",
  licenseCommercial: "any",
  licenseSaas: "any",
  licenseCompetitive: "any",
  licenseOsi: "any",
};

export function languageMatchesFilters(
  profile: LanguageProductProfile,
  filters: ProductFilterState,
): boolean {
  const decision = LANGUAGE_DECISION_PROFILES[profile.entity_id];
  if (!decision) return false;
  if (
    filters.languageCategory !== "any" &&
    !profile.categories.includes(
      filters.languageCategory as LanguageProductProfile["categories"][number],
    )
  ) {
    return false;
  }
  if (
    filters.languageThroughput !== "any" &&
    decision.performance.throughput_potential !== filters.languageThroughput
  ) {
    return false;
  }
  if (
    filters.languageLearning !== "any" &&
    decision.complexity.learning_curve !== filters.languageLearning
  ) {
    return false;
  }
  if (
    filters.languageEcosystem !== "any" &&
    decision.ecosystem.breadth !== filters.languageEcosystem
  ) {
    return false;
  }
  return true;
}

export function licenseMatchesFilters(
  profile: LicenseProductProfile,
  filters: ProductFilterState,
): boolean {
  const decision = LICENSE_DECISION_PROFILES[profile.entity_id];
  if (!decision) return false;
  return (
    (filters.licenseModel === "any" ||
      decision.model === filters.licenseModel) &&
    (filters.licenseCommercial === "any" ||
      decision.rights.commercial_use === filters.licenseCommercial) &&
    (filters.licenseSaas === "any" ||
      decision.rights.saas_hosting === filters.licenseSaas) &&
    (filters.licenseCompetitive === "any" ||
      decision.rights.competitive_use === filters.licenseCompetitive) &&
    (filters.licenseOsi === "any" || decision.osi_status === filters.licenseOsi)
  );
}
