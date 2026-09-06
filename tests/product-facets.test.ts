// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCT_FACETS,
  validatedProductFacets,
} from "../src/ui/product-facets.ts";
import type { Document } from "../src/validation/documents.ts";

const dimensionIds = [
  "dimension.runtime-garbage-collection",
  "dimension.safe-code-memory-safety-without-gc",
  "dimension.static-type-checker",
  "dimension.emits-javascript",
] as const;

function dimensions(valueType = "boolean"): Document[] {
  return dimensionIds.map((dimension_id) => ({
    kind: "dimension",
    record: {
      schema_version: "0.1",
      dimension_id,
      canonical_name: dimension_id,
      value_type: valueType,
      category: "assurance",
      unit: null,
      allowed_values: [],
    },
  }));
}
test("product facets bind only the approved Reviewed boolean dimensions", () => {
  assert.deepEqual(
    PRODUCT_FACETS.map((facet) => facet.dimension_id),
    [...dimensionIds],
  );
  for (const facet of PRODUCT_FACETS) {
    assert.equal(facet.operator, "EQ");
    assert.equal(facet.strength, "MUST");
    assert.deepEqual(
      facet.options.map((option) => option.value),
      [
        { type: "boolean", value: true },
        { type: "boolean", value: false },
      ],
    );
  }
  assert.deepEqual(validatedProductFacets(dimensions()), PRODUCT_FACETS);
});

test("product facets fail closed on missing or non-boolean dimensions", () => {
  assert.throws(
    () => validatedProductFacets(dimensions().slice(1)),
    /dimension/i,
  );
  assert.throws(() => validatedProductFacets(dimensions("string")), /boolean/i);
});
