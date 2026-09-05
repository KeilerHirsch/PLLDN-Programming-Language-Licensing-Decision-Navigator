// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { asObject } from "../validation/json.ts";
import type { ConditionRecord, Truth } from "./types.ts";
import { assertionTruth, typedValue } from "./value.ts";

const activeLifecycles = new Set(["current", "target"]);
function relevantScope(
  fact: Record<string, unknown>,
  componentId: string | null,
): boolean {
  const scope = asObject(fact.scope);
  if (scope.kind === "global") return true;
  return (
    scope.kind === "component" &&
    componentId !== null &&
    scope.component_id === componentId
  );
}
export function relevantFacts(
  project: Record<string, unknown>,
  componentId: string | null,
  dimensionId?: string,
): Record<string, unknown>[] {
  return (project.facts as Record<string, unknown>[])
    .filter((fact) => activeLifecycles.has(fact.lifecycle as string))
    .filter((fact) => relevantScope(fact, componentId))
    .filter(
      (fact) => dimensionId === undefined || fact.dimension_id === dimensionId,
    )
    .sort((a, b) => String(a.fact_id).localeCompare(String(b.fact_id)));
}

export interface ConditionEvaluation {
  truth: Truth;
  unresolvedFactIds: string[];
}
function evaluateFact(
  project: Record<string, unknown>,
  componentId: string | null,
  fact: Record<string, unknown>,
  condition: ConditionRecord,
  path: ReadonlySet<string>,
): ConditionEvaluation {
  const id = fact.fact_id as string;
  if (path.has(id)) return { truth: "UNKNOWN", unresolvedFactIds: [id] };
  if (fact.state === "CONDITIONAL") {
    const nested = evaluateConditions(
      project,
      componentId,
      (fact.conditions ?? []) as ConditionRecord[],
      new Set([...path, id]),
    );
    if (nested.truth === "FALSE")
      return { truth: "UNKNOWN", unresolvedFactIds: [] };
    if (nested.truth === "UNKNOWN") return nested;
  }
  const state = fact.state === "CONDITIONAL" ? "TRUE" : (fact.state as string);
  const truth = assertionTruth(
    state,
    fact.value === undefined ? undefined : typedValue(fact.value),
    condition.operator,
    condition.value,
  );
  return {
    truth,
    unresolvedFactIds: truth === "UNKNOWN" ? [id] : [],
  };
}
export function evaluateCondition(
  project: Record<string, unknown>,
  componentId: string | null,
  condition: ConditionRecord,
  path: ReadonlySet<string> = new Set(),
): ConditionEvaluation {
  const matches = relevantFacts(
    project,
    componentId,
    condition.dimension_id,
  ).filter((fact) => fact.kind === "fact");
  if (matches.length === 0) return { truth: "UNKNOWN", unresolvedFactIds: [] };
  const results = matches.map((fact) =>
    evaluateFact(project, componentId, fact, condition, path),
  );
  const unresolved = [
    ...new Set(results.flatMap((result) => result.unresolvedFactIds)),
  ].sort();
  if (results.some((result) => result.truth === "TRUE"))
    return { truth: "TRUE", unresolvedFactIds: unresolved };
  if (results.some((result) => result.truth === "UNKNOWN"))
    return { truth: "UNKNOWN", unresolvedFactIds: unresolved };
  return { truth: "FALSE", unresolvedFactIds: [] };
}

export function evaluateConditions(
  project: Record<string, unknown>,
  componentId: string | null,
  conditions: readonly ConditionRecord[],
  path: ReadonlySet<string> = new Set(),
): ConditionEvaluation {
  const results = conditions.map((condition) =>
    evaluateCondition(project, componentId, condition, path),
  );
  const unresolved = [
    ...new Set(results.flatMap((result) => result.unresolvedFactIds)),
  ].sort();
  if (results.some((result) => result.truth === "FALSE"))
    return { truth: "FALSE", unresolvedFactIds: unresolved };
  if (results.some((result) => result.truth === "UNKNOWN"))
    return { truth: "UNKNOWN", unresolvedFactIds: unresolved };
  return { truth: "TRUE", unresolvedFactIds: [] };
}
