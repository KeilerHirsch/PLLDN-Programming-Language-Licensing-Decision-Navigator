// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import {
  addEvidence,
  type MutableAssessment,
  markExcluded,
  markUnresolved,
  preferenceFromTruth,
} from "./assessment.ts";
import { evaluateConditions, relevantFacts } from "./facts.ts";
import { evaluateCandidateClaim, type KnowledgeIndex } from "./knowledge.ts";
import type { ConditionRecord, Operator, Truth, TypedValue } from "./types.ts";
import { equalValue, typedValue } from "./value.ts";

export function componentForm(
  project: Record<string, unknown>,
  componentId: string | null,
): string {
  if (componentId === null) return "project";
  const component = (project.components as Record<string, unknown>[]).find(
    (item) => item.component_id === componentId,
  );
  if (!component) throw new Error("Unknown decision component");
  return component.form as string;
}
export function constraintsForDecision(
  project: Record<string, unknown>,
  componentId: string | null,
): Record<string, unknown>[] {
  return relevantFacts(project, componentId)
    .filter((fact) => fact.kind === "constraint")
    .sort((a, b) => String(a.fact_id).localeCompare(String(b.fact_id)));
}

function activeConstraint(
  project: Record<string, unknown>,
  componentId: string | null,
  fact: Record<string, unknown>,
): { truth: Truth; unresolvedFactIds: string[] } {
  if (fact.state === "TRUE") return { truth: "TRUE", unresolvedFactIds: [] };
  if (fact.state === "FALSE") return { truth: "FALSE", unresolvedFactIds: [] };
  if (fact.state === "UNKNOWN")
    return {
      truth: "UNKNOWN",
      unresolvedFactIds: [fact.fact_id as string],
    };
  if (fact.state === "NOT_APPLICABLE")
    return { truth: "FALSE", unresolvedFactIds: [] };
  return evaluateConditions(
    project,
    componentId,
    (fact.conditions ?? []) as ConditionRecord[],
  );
}
export function hasHardConstraintConflict(
  project: Record<string, unknown>,
  componentId: string | null,
  constraints: readonly Record<string, unknown>[],
): boolean {
  const active = constraints.filter(
    (fact) => activeConstraint(project, componentId, fact).truth === "TRUE",
  );
  for (let i = 0; i < active.length; i += 1) {
    const left = active[i];
    if (!left || !["MUST", "FORBIDDEN"].includes(left.strength as string))
      continue;
    for (let j = i + 1; j < active.length; j += 1) {
      const right = active[j];
      if (!right || left.dimension_id !== right.dimension_id) continue;
      const leftValue = typedValue(left.value);
      const rightValue = typedValue(right.value);
      const same =
        (left.operator ?? "EQ") === (right.operator ?? "EQ") &&
        equalValue(leftValue, rightValue);
      if (same && new Set([left.strength, right.strength]).size === 2)
        return true;
      if (
        left.strength === "MUST" &&
        right.strength === "MUST" &&
        (left.operator ?? "EQ") === "EQ" &&
        (right.operator ?? "EQ") === "EQ" &&
        !equalValue(leftValue, rightValue)
      )
        return true;
      if (left.strength === "MUST" && right.strength === "MUST") {
        const leftOp = (left.operator ?? "EQ") as string;
        const rightOp = (right.operator ?? "EQ") as string;
        const lower =
          leftOp === "GTE" ? leftValue : rightOp === "GTE" ? rightValue : null;
        const upper =
          leftOp === "LTE" ? leftValue : rightOp === "LTE" ? rightValue : null;
        if (lower !== null && upper !== null) {
          if (
            lower.type === "integer" &&
            upper.type === "integer" &&
            lower.value > upper.value
          )
            return true;
          if (
            lower.type === "quantity" &&
            upper.type === "quantity" &&
            lower.unit === upper.unit &&
            lower.value > upper.value
          )
            return true;
        }
      }
    }
  }
  return false;
}

function asOperator(fact: Record<string, unknown>): Operator {
  return (fact.operator ?? "EQ") as Operator;
}
function asValue(fact: Record<string, unknown>): TypedValue {
  if (fact.value === undefined)
    throw new Error("Decision-bearing constraint requires a value");
  return typedValue(fact.value);
}

export function applyConstraints(
  index: KnowledgeIndex,
  project: Record<string, unknown>,
  componentId: string | null,
  constraints: readonly Record<string, unknown>[],
  assessments: Map<string, MutableAssessment>,
): void {
  for (const fact of constraints) {
    const factId = fact.fact_id as string;
    const strength = fact.strength as string;
    if (strength === "NEUTRAL") continue;
    const active = activeConstraint(project, componentId, fact);
    for (const assessment of assessments.values()) {
      if (active.truth === "FALSE") continue;
      if (active.truth === "UNKNOWN") {
        if (["MUST", "FORBIDDEN"].includes(strength))
          markUnresolved(assessment, factId);
        if (["PREFER", "AVOID"].includes(strength))
          assessment.preferences.set(factId, "UNKNOWN");
        continue;
      }
      const claim = evaluateCandidateClaim(
        index,
        project,
        componentId,
        assessment.candidate_id,
        fact.dimension_id as string,
        asOperator(fact),
        asValue(fact),
      );
      addEvidence(assessment, claim.claimIds, claim.sourceIds);
      for (const id of claim.unresolvedFactIds) assessment.unresolved.add(id);
      const truth = claim.truth;
      if (strength === "MUST") {
        if (truth === "FALSE") markExcluded(assessment, factId);
        if (truth === "UNKNOWN") markUnresolved(assessment, factId);
      } else if (strength === "FORBIDDEN") {
        if (truth === "TRUE") markExcluded(assessment, factId);
        if (truth === "UNKNOWN") markUnresolved(assessment, factId);
      } else if (strength === "PREFER") {
        assessment.preferences.set(factId, preferenceFromTruth(truth));
      } else if (strength === "AVOID") {
        assessment.preferences.set(factId, preferenceFromTruth(truth, true));
      }
    }
  }
}
