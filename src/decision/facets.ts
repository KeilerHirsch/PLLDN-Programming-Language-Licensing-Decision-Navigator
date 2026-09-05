// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { evaluateDecision } from "./evaluate.ts";
import type { DecisionRequest, Operator, TypedValue } from "./types.ts";

export interface FacetCount {
  value: TypedValue;
  eligible: number;
  excluded: number;
  unresolved: number;
  decision_state: string;
}
export interface FacetPreviewOptions {
  strength?: "MUST" | "PREFER" | "NEUTRAL" | "AVOID" | "FORBIDDEN";
  operator?: Operator;
}
function previewFactId(project: Record<string, unknown>): string {
  const used = new Set(
    (project.facts as Record<string, unknown>[]).map(
      (fact) => fact.fact_id as string,
    ),
  );
  if (!used.has("facet.preview")) return "facet.preview";
  let index = 2;
  while (used.has(`facet.preview.${index}`)) index += 1;
  return `facet.preview.${index}`;
}
export async function facetCounts(
  request: DecisionRequest,
  dimensionId: string,
  options: readonly TypedValue[],
  preview: FacetPreviewOptions = {},
): Promise<FacetCount[]> {
  const results: FacetCount[] = [];
  for (const value of options) {
    const project = structuredClone(request.project);
    const facts = project.facts as Record<string, unknown>[];
    facts.push({
      fact_id: previewFactId(project),
      dimension_id: dimensionId,
      scope:
        request.componentId === null
          ? { kind: "global" }
          : { kind: "component", component_id: request.componentId },
      kind: "constraint",
      lifecycle: "target",
      state: "TRUE",
      strength: preview.strength ?? "MUST",
      operator: preview.operator ?? "EQ",
      value: structuredClone(value),
    });
    const evaluated = await evaluateDecision({ ...request, project });
    results.push({
      value: structuredClone(value),
      eligible: evaluated.candidates.filter((x) => x.status === "ELIGIBLE")
        .length,
      excluded: evaluated.candidates.filter((x) => x.status === "EXCLUDED")
        .length,
      unresolved: evaluated.candidates.filter((x) => x.status === "UNRESOLVED")
        .length,
      decision_state: evaluated.trace.state,
    });
  }
  return results;
}
