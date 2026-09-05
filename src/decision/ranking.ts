// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { type MutableAssessment, sortedStrings } from "./assessment.ts";

function preferenceKeys(assessments: readonly MutableAssessment[]): string[] {
  return sortedStrings(
    assessments.flatMap((assessment) => [...assessment.preferences.keys()]),
  );
}

function dominates(
  a: MutableAssessment,
  b: MutableAssessment,
  keys: readonly string[],
): boolean {
  if (keys.length === 0) return false;
  let better = false;
  for (const key of keys) {
    const av = a.preferences.get(key) ?? "UNKNOWN";
    const bv = b.preferences.get(key) ?? "UNKNOWN";
    if (av === "UNKNOWN" || bv === "UNKNOWN") return false;
    const an = av === "SATISFIED" ? 1 : 0;
    const bn = bv === "SATISFIED" ? 1 : 0;
    if (an < bn) return false;
    if (an > bn) better = true;
  }
  return better;
}
export function nonDominated(
  eligible: readonly MutableAssessment[],
): MutableAssessment[] {
  const keys = preferenceKeys(eligible);
  return eligible
    .filter(
      (candidate) =>
        !eligible.some(
          (other) => other !== candidate && dominates(other, candidate, keys),
        ),
    )
    .sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
}
