// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  exportCsvCell,
  exportUnassessedCandidateCsv,
  UNASSESSED_EXPORT_HEADER,
} from "../src/product/unassessed-export.ts";

test("export is deterministic and includes exactly 841 unassessed records", () => {
  const csv = exportUnassessedCandidateCsv();
  assert.equal(csv, exportUnassessedCandidateCsv());
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, 842);
  assert.equal(lines[0], UNASSESSED_EXPORT_HEADER.join(","));
  assert(lines.some((line) => line.includes('"candidate.language.61626170"')));
  assert(lines.some((line) => line.includes('"candidate.license.zpl-2.1"')));
  assert(lines.every((line) => !line.includes('"Reviewed"')));
  assert(lines.some((line) => line.includes('"false"')));
  assert(lines.some((line) => line.includes('"true"')));
  assert(csv.includes('"UNKNOWN"'));
});
test("CSV encoding resists spreadsheet formulas and preserves delimiters", () => {
  assert.equal(exportCsvCell('Ada, "SPARK"'), '"Ada, ""SPARK"""');
  assert.equal(exportCsvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(exportCsvCell(" +SUM(1)"), '"\' +SUM(1)"');
  assert.equal(exportCsvCell("-2"), '"\'-2"');
  assert.equal(exportCsvCell("text"), '"text"');
});
test("browser makes neutral catalogue export discoverable", () => {
  const product = readFileSync("src/ui/product.ts", "utf8");
  const runtime = readFileSync("src/ui/main.ts", "utf8");
  assert(product.includes("Export all 841 unassessed identities (CSV)"));
  assert(product.includes('"export-unassessed-csv"'));
  assert(runtime.includes('action === "export-unassessed-csv"'));
  assert(runtime.includes("exportUnassessedCandidateCsv()"));
  assert(runtime.includes("URL.revokeObjectURL(url)"));
});
