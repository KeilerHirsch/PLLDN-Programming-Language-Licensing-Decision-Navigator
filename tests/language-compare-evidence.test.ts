// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRODUCT_COMPARE_DIMENSIONS } from "../src/product/catalog.ts";
import { languageComparisonRows } from "../src/ui/product.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

test("only the nine historical Preview dimensions create evidence drilldowns", () => {
  const catalog: CatalogPreviewView = {
    status: "Preview",
    knowledge_snapshot: "fixture",
    languages: [],
    licenses: [],
  };
  const rows = languageComparisonRows(catalog);
  assert.deepEqual(
    rows.filter((row) => row.dimensionId).map((row) => row.dimensionId),
    [...PRODUCT_COMPARE_DIMENSIONS],
  );
  assert.equal(rows[0]?.dimensionId, undefined);
});

test("source drilldowns preserve unknown and do not inject markup", () => {
  const product = readFileSync("src/ui/product.ts", "utf8");
  const browser = readFileSync("tools/browser-smoke.ts", "utf8");
  assert(product.includes('details.dataset.compareEvidence = "true"'));
  assert(product.includes('fact?.review_status ?? "UNKNOWN"'));
  assert(product.includes('"No Preview claim recorded"'));
  assert(product.includes("No sources recorded for this Preview dimension."));
  assert(product.includes("safeHttps(source.reference)"));
  assert(product.includes('link.rel = "noopener noreferrer"'));
  assert(product.includes("cell.append(renderCompareEvidence(fact))"));
  assert(browser.includes("evidence.length === 36"));
  assert(!product.includes("innerHTML"));
});
