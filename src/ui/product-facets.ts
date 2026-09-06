// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { Document } from "../validation/documents.ts";
import type { FacetDefinition } from "./types.ts";

function booleanOptions(trueLabel: string, falseLabel: string) {
  return [
    {
      option_id: "true",
      label: trueLabel,
      value: { type: "boolean" as const, value: true },
    },
    {
      option_id: "false",
      label: falseLabel,
      value: { type: "boolean" as const, value: false },
    },
  ] as const;
}

export const PRODUCT_FACETS: readonly FacetDefinition[] = [
  {
    facet_id: "runtime-garbage-collection",
    label: "Runtime garbage collection",
    group: "Runtime",
    dimension_id: "dimension.runtime-garbage-collection",
    operator: "EQ",
    strength: "MUST",
    options: booleanOptions("Must use GC", "Must not use GC"),
  },
  {
    facet_id: "memory-safety-without-gc",
    label: "Safe-code memory safety without garbage collection",
    group: "Assurance",
    dimension_id: "dimension.safe-code-memory-safety-without-gc",
    operator: "EQ",
    strength: "MUST",
    options: booleanOptions("Must provide", "Must not provide"),
  },
  {
    facet_id: "static-type-checker",
    label: "Static type checker",
    group: "Assurance",
    dimension_id: "dimension.static-type-checker",
    operator: "EQ",
    strength: "MUST",
    options: booleanOptions("Must have", "Must not have"),
  },
  {
    facet_id: "emits-javascript",
    label: "Emits JavaScript",
    group: "Integration",
    dimension_id: "dimension.emits-javascript",
    operator: "EQ",
    strength: "MUST",
    options: booleanOptions("Must emit JavaScript", "Must not emit JavaScript"),
  },
];

export function validatedProductFacets(
  knowledge: readonly Document[],
): readonly FacetDefinition[] {
  const dimensions = new Map<string, Record<string, unknown>>();
  for (const document of knowledge) {
    if (document.kind !== "dimension") continue;
    const id = document.record.dimension_id;
    if (typeof id === "string") dimensions.set(id, document.record);
  }

  for (const facet of PRODUCT_FACETS) {
    const dimension = dimensions.get(facet.dimension_id);
    if (!dimension) {
      throw new Error(`Product facet dimension missing: ${facet.dimension_id}`);
    }
    if (dimension.value_type !== "boolean") {
      throw new Error(
        `Product facet dimension must be boolean: ${facet.dimension_id}`,
      );
    }
  }
  return PRODUCT_FACETS;
}
