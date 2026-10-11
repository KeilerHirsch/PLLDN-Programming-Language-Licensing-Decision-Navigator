// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { countPreviewEvidence } from "../src/ui/preview-evidence-inventory.ts";
import type { CatalogPreviewEntryView } from "../src/ui/types.ts";

const entry: CatalogPreviewEntryView = {
  entity_id: "language.go",
  label: "Go",
  entity_type: "language",
  version_scope: [],
  target_scope: [],
  facts: [
    {
      claim_id: "preview-1",
      dimension_id: "dimension.a",
      label: "Dimension A",
      state: "TRUE",
      value: { type: "boolean", value: true },
      review_status: "NOT_REVIEWED",
      conditions: [],
      sources: [
        {
          source_id: "a",
          title: "Recorded source A",
          reference: "https://example.org/a",
        },
        {
          source_id: "b",
          title: "Recorded source B",
          reference: "https://example.org/a",
        },
      ],
    },
    {
      claim_id: "preview-2",
      dimension_id: "dimension.b",
      label: "Dimension B",
      state: "UNKNOWN",
      value: null,
      review_status: "NOT_REVIEWED",
      conditions: [],
      sources: [],
    },
  ],
};

test("Preview evidence inventory counts records, never legal correctness", () => {
  assert.deepEqual(countPreviewEvidence([entry]), {
    claims: 2,
    withSources: 1,
    withoutSources: 1,
    unknownValues: 1,
    sourceReferences: 2,
    distinctReferences: 1,
  });
  assert.deepEqual(countPreviewEvidence([]), {
    claims: 0,
    withSources: 0,
    withoutSources: 0,
    unknownValues: 0,
    sourceReferences: 0,
    distinctReferences: 0,
  });
});

test("multiple catalogues aggregate reference counts deterministically", () => {
  assert.deepEqual(countPreviewEvidence([entry, entry]), {
    claims: 4,
    withSources: 2,
    withoutSources: 2,
    unknownValues: 2,
    sourceReferences: 4,
    distinctReferences: 1,
  });
});
