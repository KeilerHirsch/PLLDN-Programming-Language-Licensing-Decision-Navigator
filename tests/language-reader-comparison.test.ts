// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { exportCsvCell } from "../src/product/unassessed-export.ts";
import {
  exportCatalogLanguageCompareCsv,
  exportEditorialLanguageCompareCsv,
} from "../src/ui/language-compare-export.ts";
import {
  catalogLanguageComparisonRows,
  selectCatalogLanguages,
  selectEditorialLanguages,
} from "../src/ui/product.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

const preview: CatalogPreviewView = {
  knowledge_snapshot: "reader-ui-test-preview",
  status: "Preview",
  languages: [],
  licenses: [],
};
const basic = "candidate.language.6261736963";
test("one comparison selects canonical editorial and pinned unassessed languages without invented IDs", () => {
  const selected = selectCatalogLanguages(["language.rust", basic]);
  assert.deepEqual(
    selected.map((language) => language.label),
    ["Rust", "BASIC"],
  );
  assert(selected[0]?.editorial);
  assert.equal(selected[1]?.editorial, null);
  assert.throws(() => selectCatalogLanguages([basic, basic]));
  assert.throws(() => selectCatalogLanguages(["candidate.language.made-up"]));
  assert.throws(() =>
    selectCatalogLanguages(["candidate.license.artistic-2.0"]),
  );
  assert.throws(() =>
    selectCatalogLanguages([
      "language.rust",
      basic,
      "language.go",
      "language.python",
      "language.java",
    ]),
  );
  assert.throws(() => selectEditorialLanguages([basic]));
  assert.throws(() => exportEditorialLanguageCompareCsv([basic], preview));
});
test("mixed reader comparison supplies useful rows and keeps every unassessed rating UNKNOWN", () => {
  const selected = selectCatalogLanguages(["language.rust", basic]);
  const rows = catalogLanguageComparisonRows(preview);
  const unassessed = selected[1];
  assert(unassessed);
  for (const label of [
    "Implementation",
    "Prerequisites",
    "Execution workflow",
    "Example code",
    "Example status",
    "Implementation and runtime licenses",
  ]) {
    const row = rows.find((candidate) => candidate.label === label);
    assert(row, label);
    assert(row.value(unassessed), label);
    assert(row.sources(unassessed).length > 0, label + " sources");
  }
  for (const row of rows.filter((candidate) => candidate.assessment)) {
    assert.equal(row.value(unassessed), "UNKNOWN", row.label);
  }
  for (const row of rows.filter((candidate) => candidate.dimensionId)) {
    assert.equal(row.value(unassessed), "UNKNOWN", row.label);
  }
});
test("new CSV matches every presentation row and provenance and retains spreadsheet protection", () => {
  const selected = selectCatalogLanguages(["language.rust", basic]);
  const rows = catalogLanguageComparisonRows(preview);
  const expected =
    [
      ["Attribute", ...selected.map((language) => language.label)],
      ...rows.flatMap((row) => [
        [row.label, ...selected.map((language) => row.value(language))],
        [
          "Sources: " + row.label,
          ...selected.map(
            (language) =>
              row
                .sources(language)
                .map((source) => source.url)
                .join(" | ") || "UNKNOWN",
          ),
        ],
      ]),
    ]
      .map((row) => row.map(exportCsvCell).join(","))
      .join("\n") + "\n";
  assert.equal(
    exportCatalogLanguageCompareCsv(["language.rust", basic], preview),
    expected,
  );
  assert.equal(exportCsvCell("=1+1"), JSON.stringify("'=1+1"));
  assert.throws(() => exportCatalogLanguageCompareCsv([], preview));
  assert.throws(() =>
    exportCatalogLanguageCompareCsv([basic], {
      ...preview,
      knowledge_snapshot: "",
    }),
  );
});
