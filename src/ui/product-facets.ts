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

function validateOperator(
  facet: FacetDefinition,
  valueType: string,
): void {
  if (facet.operator === "IN" && valueType !== "set") {
    throw new Error(`IN facet requires a set dimension: ${facet.dimension_id}`);
  }
  if (
    ["GTE", "LTE"].includes(facet.operator) &&
    !["integer", "quantity"].includes(valueType)
  ) {
    throw new Error(
      `Ordered facet requires an integer or quantity dimension: ${facet.dimension_id}`,
    );
  }
}

function validateOption(
  facet: FacetDefinition,
  dimension: Record<string, unknown>,
): void {
  const valueType = String(dimension.value_type);
  const allowed = new Set((dimension.allowed_values ?? []) as string[]);
  for (const option of facet.options) {
    if (option.value.type !== valueType) {
      throw new Error(
        `Facet option type mismatch: ${facet.facet_id}/${option.option_id}`,
      );
    }
    if (
      option.value.type === "enum" &&
      !allowed.has(option.value.value)
    ) {
      throw new Error(
        `Facet option outside dimension vocabulary: ${facet.facet_id}/${option.option_id}`,
      );
    }
    if (
      option.value.type === "set" &&
      !option.value.value.every((value) => allowed.has(value))
    ) {
      throw new Error(
        `Facet option outside dimension vocabulary: ${facet.facet_id}/${option.option_id}`,
      );
    }
    if (
      option.value.type === "quantity" &&
      option.value.unit !== dimension.unit
    ) {
      throw new Error(
        `Facet option unit mismatch: ${facet.facet_id}/${option.option_id}`,
      );
    }
  }
}

export function validateFacetDefinitions(
  knowledge: readonly Document[],
  facets: readonly FacetDefinition[],
): readonly FacetDefinition[] {
  const dimensions = new Map<string, Record<string, unknown>>();
  for (const document of knowledge) {
    if (document.kind !== "dimension") continue;
    const id = document.record.dimension_id;
    if (typeof id === "string") dimensions.set(id, document.record);
  }

  for (const facet of facets) {
    const dimension = dimensions.get(facet.dimension_id);
    if (!dimension) {
      throw new Error(`Product facet dimension missing: ${facet.dimension_id}`);
    }
    validateOperator(facet, String(dimension.value_type));
    validateOption(facet, dimension);
  }
  return facets;
}

export function validatedProductFacets(
  knowledge: readonly Document[],
): readonly FacetDefinition[] {
  return validateFacetDefinitions(knowledge, PRODUCT_FACETS);
}
