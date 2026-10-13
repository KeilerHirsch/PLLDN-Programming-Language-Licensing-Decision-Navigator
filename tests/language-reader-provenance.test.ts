// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_COMPARE_DIMENSIONS } from "../src/product/catalog.ts";
import { exportCatalogLanguageCompareCsv } from "../src/ui/language-compare-export.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

test("mixed and editorial CSV preserve Preview claim IDs and review status alongside sources", () => {
  const dimension = PRODUCT_COMPARE_DIMENSIONS[0];
  assert(dimension);
  const preview: CatalogPreviewView = {
    status: "Preview", knowledge_snapshot: "reader-provenance-fixture", licenses: [],
    languages: [{
      entity_id: "language.go", label: "Go", entity_type: "language",
      version_scope: [], target_scope: [],
      facts: [{
        dimension_id: dimension, claim_id: "claim.reader-export-provenance",
        label: "Fixture dimension", state: "UNKNOWN", value: null, conditions: [],
        review_status: "NOT_REVIEWED",
        sources: [{ source_id: "source.reader-fixture", title: "Fixture source", reference: "https://example.org/fixture" }],
      }],
    }],
  };
  for (const ids of [
    ["language.go", "candidate.language.6261736963"],
    ["language.go", "language.python"],
  ]) {
    const csv = exportCatalogLanguageCompareCsv(ids, preview);
    assert(csv.includes('"Preview claim ID: Fixture dimension","claim.reader-export-provenance","UNKNOWN"'));
    assert(csv.includes('"Preview review status: Fixture dimension","NOT_REVIEWED","UNKNOWN"'));
    assert(csv.includes("https://example.org/fixture"));
  }
});
