// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { exportEditorialLicenseCompareCsv } from "../src/ui/license-compare-export.ts";
import { licenseComparisonRows } from "../src/ui/license-comparison.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

const snapshot: CatalogPreviewView = {
  status: "Preview",
  knowledge_snapshot: "fixture-snapshot",
  languages: [],
  licenses: [],
};

test("selected Editorial license export is deterministic and complete", () => {
  const ids = ["license.mit", "license.apache-2.0"];
  const csv = exportEditorialLicenseCompareCsv(ids, snapshot);
  assert.equal(csv, exportEditorialLicenseCompareCsv(ids, snapshot));
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, licenseComparisonRows().length + 5);
  assert.equal(lines[0], '"Attribute","MIT","Apache-2.0"');
  assert(lines.some((line) => line.startsWith('"Entity ID",')));
  assert(lines.some((line) => line.startsWith('"Canonical terms",')));
  assert(csv.includes('"Preview snapshot","fixture-snapshot","fixture-snapshot"'));
  assert(csv.includes('"Editorial Preview (not Reviewed)"'));
  assert(csv.includes('"license.mit"'));
  assert(csv.includes('"SaaS / hosting"'));
  assert(csv.includes('"Commercial use"'));
});

test("export fails closed on empty, repeated and unassessed candidate selection", () => {
  assert.throws(() => exportEditorialLicenseCompareCsv([], snapshot));
  assert.throws(() =>
    exportEditorialLicenseCompareCsv(["license.mit", "license.mit"], snapshot),
  );
  assert.throws(() =>
    exportEditorialLicenseCompareCsv(["candidate.license.artistic-2.0"], snapshot),
  );
});

test("recorded Preview license claims export actual evidence, missing values UNKNOWN", () => {
  const withClaim: CatalogPreviewView = {
    ...snapshot,
    licenses: [
      {
        entity_id: "license.mit",
        entity_type: "license",
        label: "MIT",
        version_scope: [],
        target_scope: [],
        facts: [
          {
            claim_id: "pinned-preview-claim",
            dimension_id: "dimension.example",
            label: "Example source claim",
            state: "UNKNOWN",
            value: null,
            review_status: "NOT_REVIEWED",
            conditions: [],
            sources: [
              {
                source_id: "primary-ref",
                title: "Example primary reference",
                reference: "https://example.org/source",
              },
            ],
          },
        ],
      },
    ],
  };
  const csv = exportEditorialLicenseCompareCsv(
    ["license.mit", "license.apache-2.0"],
    withClaim,
  );
  assert(csv.includes('"Preview fact: Example source claim","Unknown","Unknown"'));
  assert(csv.includes('"Preview claim ID: Example source claim","pinned-preview-claim","UNKNOWN"'));
  assert(csv.includes('"Preview review status: Example source claim","NOT_REVIEWED","UNKNOWN"'));
  assert(csv.includes('"Preview sources: Example source claim","https://example.org/source","UNKNOWN"'));
  assert.equal(
    csv.trimEnd().split("\n").length,
    licenseComparisonRows().length + 5 + 4,
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
