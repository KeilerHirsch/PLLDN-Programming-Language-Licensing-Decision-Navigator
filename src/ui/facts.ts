// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { validateDocument } from "../validation/documents.ts";
import type { FacetDefinition, FacetSelections } from "./types.ts";

const UI_FACET_PREFIX = "ui.facet.";
const FACET_ID = /^[a-z][a-z0-9._-]{1,63}$/;

function catalogueById(
  facets: readonly FacetDefinition[],
): ReadonlyMap<string, FacetDefinition> {
  const byId = new Map<string, FacetDefinition>();
  for (const facet of facets) {
    if (!FACET_ID.test(facet.facet_id)) throw new Error("Invalid facet ID");
    if (byId.has(facet.facet_id)) throw new Error("Duplicate facet ID");
    const optionIds = new Set<string>();
    for (const option of facet.options) {
      if (!FACET_ID.test(option.option_id))
        throw new Error("Invalid facet option ID");
      if (optionIds.has(option.option_id))
        throw new Error("Duplicate facet option ID");
      optionIds.add(option.option_id);
    }
    byId.set(facet.facet_id, facet);
  }
  return byId;
}
function assertBaseProject(base: Record<string, unknown>): void {
  validateDocument("project-facts", base);
  for (const fact of base.facts as Record<string, unknown>[]) {
    if (String(fact.fact_id).startsWith(UI_FACET_PREFIX)) {
      throw new Error("Base project uses reserved UI facet namespace");
    }
  }
}

function selectionFact(
  facet: FacetDefinition,
  optionId: string,
  componentId: string | null,
): Record<string, unknown> {
  const option = facet.options.find((item) => item.option_id === optionId);
  if (!option)
    throw new Error(`Unknown facet option: ${facet.facet_id}/${optionId}`);
  return {
    fact_id: `${UI_FACET_PREFIX}${facet.facet_id}`,
    dimension_id: facet.dimension_id,
    scope:
      componentId === null
        ? { kind: "global" }
        : { kind: "component", component_id: componentId },
    kind: "constraint",
    lifecycle: "target",
    state: "TRUE",
    strength: facet.strength,
    operator: facet.operator,
    value: structuredClone(option.value),
  };
}
export function deriveProject(
  base: Record<string, unknown>,
  facets: readonly FacetDefinition[],
  selections: FacetSelections,
  componentId: string | null,
): Record<string, unknown> {
  assertBaseProject(base);
  const byId = catalogueById(facets);
  const derived = structuredClone(base);
  const facts = derived.facts as Record<string, unknown>[];
  for (const facetId of Object.keys(selections).sort()) {
    const facet = byId.get(facetId);
    if (!facet) throw new Error(`Unknown facet: ${facetId}`);
    const optionId = selections[facetId];
    if (typeof optionId !== "string")
      throw new Error(`Unknown facet option: ${facetId}`);
    facts.push(selectionFact(facet, optionId, componentId));
  }
  validateDocument("project-facts", derived);
  return derived;
}

export function projectWithoutFacet(
  base: Record<string, unknown>,
  facets: readonly FacetDefinition[],
  selections: FacetSelections,
  facetId: string,
  componentId: string | null,
): Record<string, unknown> {
  const remaining = Object.fromEntries(
    Object.entries(selections).filter(([id]) => id !== facetId),
  );
  return deriveProject(base, facets, remaining, componentId);
}
export function resetProject(
  base: Record<string, unknown>,
): Record<string, unknown> {
  assertBaseProject(base);
  return structuredClone(base);
}
