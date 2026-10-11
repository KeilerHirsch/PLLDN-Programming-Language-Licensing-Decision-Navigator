// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRODUCT_COMPARE_DIMENSIONS } from "../src/product/catalog.ts";
import { exportEditorialLanguageCompareCsv } from "../src/ui/language-compare-export.ts";
import {
  languageComparisonRows,
  selectEditorialLanguages,
} from "../src/ui/product.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

const preview: CatalogPreviewView = {
  knowledge_snapshot: "pinned-fixture-preview",
  status: "Preview",
  languages: [],
  licenses: [],
};

test("language CSV matches the presentation rows with IDs and snapshot", () => {
  const ids = ["language.go", "language.python"];
  const csv = exportEditorialLanguageCompareCsv(ids, preview);
  assert.equal(csv, exportEditorialLanguageCompareCsv(ids, preview));
  const lines = csv.trimEnd().split("\n");
  assert.equal(
    lines.length,
    languageComparisonRows(preview).length + 4 + 3 * PRODUCT_COMPARE_DIMENSIONS.length,
  );
  assert.equal(lines[0], '"Attribute","Go","Python"');
  assert(lines.includes('"Entity ID","language.go","language.python"'));
  assert(
    lines.includes(
      '"Evidence tier","Editorial Preview (not Reviewed)","Editorial Preview (not Reviewed)"',
    ),
  );
  assert(
    lines.includes(
      '"Preview snapshot","pinned-fixture-preview","pinned-fixture-preview"',
    ),
  );
  assert(csv.includes('"Preview claim ID:'));
  assert(csv.includes('"Preview sources:'));
});

test("export rejects empty, duplicates, index-only and absent snapshot", () => {
  assert.throws(() => exportEditorialLanguageCompareCsv([], preview));
  assert.throws(() =>
    exportEditorialLanguageCompareCsv(["language.go", "language.go"], preview),
  );
  assert.throws(() =>
    exportEditorialLanguageCompareCsv(["candidate.language.61676461"], preview),
  );
  assert.throws(() =>
    exportEditorialLanguageCompareCsv(["language.go"], {
      ...preview,
      knowledge_snapshot: "",
    }),
  );
  assert.equal(selectEditorialLanguages(["language.go"]).length, 1);
});

test("browser and download use the same rows and existing CSV safety helper", () => {
  const product = readFileSync("src/ui/product.ts", "utf8");
  const exporter = readFileSync("src/ui/language-compare-export.ts", "utf8");
  const main = readFileSync("src/ui/main.ts", "utf8");
  const browser = readFileSync("tools/browser-smoke.ts", "utf8");
  assert(product.includes("languageComparisonRows(catalog)"));
  assert(product.includes('"export-language-compare"'));
  assert(exporter.includes("row.map(exportCsvCell)"));
  assert(exporter.includes("fact?.sources.map("));
  assert(main.includes('action === "export-language-compare"'));
  assert(main.includes("plldn-editorial-language-comparison.csv"));
  assert(
    browser.includes(
      "language comparison must expose a real CSV download control",
    ),
  );
  assert(!exporter.includes("innerHTML"));
});
