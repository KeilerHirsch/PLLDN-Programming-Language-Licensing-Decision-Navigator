// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  licensePreviewClaimRows,
  previewFactText,
} from "../src/ui/preview-evidence.ts";
import type { CatalogPreviewFactView, CatalogPreviewView } from "../src/ui/types.ts";

const claim: CatalogPreviewFactView = {
  claim_id: "historic-preview-claim",
  dimension_id: "dimension.example",
  label: "Example Preview dimension",
  state: "CONDITIONAL",
  value: { type: "string", value: "pinned observation" },
  review_status: "NOT_REVIEWED",
  conditions: [],
  sources: [
    {
      source_id: "example",
      title: "Source",
      reference: "https://example.org/license",
    },
  ],
};

const catalogue: CatalogPreviewView = {
  status: "Preview",
  knowledge_snapshot: "test-only-pinned-snapshot",
  languages: [],
  licenses: [
    {
      entity_id: "license.mit",
      label: "MIT",
      entity_type: "license",
      version_scope: [],
      target_scope: [],
      facts: [claim],
    },
    {
      entity_id: "license.apache-2.0",
      label: "Apache-2.0",
      entity_type: "license",
      version_scope: [],
      target_scope: [],
      facts: [],
    },
  ],
};

test("license Preview claim matrix preserves recorded IDs and missing fields", () => {
  const rows = licensePreviewClaimRows(catalogue, [
    "license.mit",
    "license.apache-2.0",
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.dimensionId, "dimension.example");
  assert.equal(rows[0]?.facts[0]?.claim_id, claim.claim_id);
  assert.equal(rows[0]?.facts[1], undefined);
  assert.equal(previewFactText(rows[0]?.facts[0]), "pinned observation (conditional)");
  assert.equal(previewFactText(rows[0]?.facts[1]), "Unknown");
  assert.equal(previewFactText({ ...claim, state: "UNKNOWN", value: null }), "Unknown");
});

test("license claim matrix neither invents rights nor expands unassessed identities", () => {
  assert.equal(licensePreviewClaimRows(catalogue, ["candidate.license.unknown"]).length, 0);
  assert.throws(() =>
    licensePreviewClaimRows({ ...catalogue, status: "Reviewed" as "Preview" }, ["license.mit"]),
  );
  assert.deepEqual(licensePreviewClaimRows(catalogue, []), []);
});
