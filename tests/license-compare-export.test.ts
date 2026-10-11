// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { exportEditorialLicenseCompareCsv } from "../src/ui/license-compare-export.ts";
import { licenseComparisonRows } from "../src/ui/license-comparison.ts";

test("selected Editorial license export is deterministic and complete", () => {
  const ids = ["license.mit", "license.apache-2.0"];
  const csv = exportEditorialLicenseCompareCsv(ids);
  assert.equal(csv, exportEditorialLicenseCompareCsv(ids));
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, licenseComparisonRows().length + 4);
  assert.equal(lines[0], '"Attribute","MIT","Apache-2.0"');
  assert(lines.some((line) => line.startsWith('"Entity ID",')));
  assert(lines.some((line) => line.startsWith('"Canonical terms",')));
  assert(csv.includes('"Editorial Preview (not Reviewed)"'));
  assert(csv.includes('"license.mit"'));
  assert(csv.includes('"SaaS / hosting"'));
  assert(csv.includes('"Commercial use"'));
});

test("export fails closed on empty, repeated and unassessed candidate selection", () => {
  assert.throws(() => exportEditorialLicenseCompareCsv([]));
  assert.throws(() => exportEditorialLicenseCompareCsv(["license.mit", "license.mit"]));
  assert.throws(() =>
    exportEditorialLicenseCompareCsv(["candidate.license.artistic-2.0"]),
  );
});

test("UI provides real download action, not an inert link", () => {
  const product = readFileSync("src/ui/license-comparison.ts", "utf8");
  const handler = readFileSync("src/ui/main.ts", "utf8");
  assert(product.includes('"export-license-compare"'));
  assert(handler.includes('action === "export-license-compare"'));
  assert(handler.includes("exportEditorialLicenseCompareCsv("));
  assert(handler.includes("plldn-editorial-license-comparison.csv"));
  assert(handler.includes("URL.revokeObjectURL(url)"));
});
