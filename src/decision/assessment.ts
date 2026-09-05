// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { CandidateAssessment, PreferenceOutcome } from "./types.ts";

export interface MutableAssessment {
  candidate_id: string;
  status: "ELIGIBLE" | "EXCLUDED" | "UNRESOLVED";
  exclusions: Set<string>;
  unresolved: Set<string>;
  preferences: Map<string, PreferenceOutcome>;
  rule_ids: Set<string>;
  claim_ids: Set<string>;
  relation_ids: Set<string>;
  source_ids: Set<string>;
}

export function sortedStrings(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

export function mutableCandidate(id: string): MutableAssessment {
  return {
    candidate_id: id,
    status: "ELIGIBLE",
    exclusions: new Set(),
    unresolved: new Set(),
    preferences: new Map(),
    rule_ids: new Set(),
    claim_ids: new Set(),
    relation_ids: new Set(),
    source_ids: new Set(),
  };
}
export function addEvidence(
  assessment: MutableAssessment,
  claimIds: readonly string[],
  sourceIds: readonly string[],
): void {
  for (const id of claimIds) assessment.claim_ids.add(id);
  for (const id of sourceIds) assessment.source_ids.add(id);
}

export function markExcluded(assessment: MutableAssessment, id: string): void {
  assessment.exclusions.add(id);
  assessment.status = "EXCLUDED";
}

export function markUnresolved(
  assessment: MutableAssessment,
  id: string,
): void {
  assessment.unresolved.add(id);
  if (assessment.status !== "EXCLUDED") assessment.status = "UNRESOLVED";
}

export function preferenceFromTruth(
  truth: "TRUE" | "FALSE" | "UNKNOWN",
  invertPreference = false,
): PreferenceOutcome {
  if (truth === "UNKNOWN") return "UNKNOWN";
  const satisfied = truth === "TRUE";
  return satisfied !== invertPreference ? "SATISFIED" : "UNSATISFIED";
}
export function freezeAssessment(
  assessment: MutableAssessment,
): CandidateAssessment {
  return {
    candidate_id: assessment.candidate_id,
    status: assessment.status,
    exclusions: sortedStrings(assessment.exclusions),
    unresolved: sortedStrings(assessment.unresolved),
    preferences: Object.fromEntries(
      [...assessment.preferences.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ),
    rule_ids: sortedStrings(assessment.rule_ids),
    claim_ids: sortedStrings(assessment.claim_ids),
    relation_ids: sortedStrings(assessment.relation_ids),
    source_ids: sortedStrings(assessment.source_ids),
  };
}
