// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  factProvenanceDisclosure,
  isInternalPreviewSeed,
} from "../src/ui/source-provenance.ts";
import type { CatalogPreviewFactView, UiEvidenceSource } from "../src/ui/types.ts";

const seed: UiEvidenceSource = {
  source_id: "source.catalog-block2-preview",
  title: "PLLDN Block 2 initial platform and ecosystem matrix",
  reference:
    "https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/blob/main/knowledge/candidate/catalog-2026-10-03/evidence/block2-platform-ecosystem.md",
};
const fact: CatalogPreviewFactView = {
  claim_id: "claim.python.webassembly-support",
  dimension_id: "dimension.webassembly-support",
  label: "WebAssembly support",
  state: "TRUE",
  value: { type: "boolean", value: true },
  review_status: "Preview",
  conditions: [],
  sources: [seed],
};

test("only the exact pinned-internal seed IDs and repository path classify as seed", () => {
  assert.equal(isInternalPreviewSeed(seed), true);
  assert.equal(
    isInternalPreviewSeed({ ...seed, source_id: "source.official.python" }),
    false,
  );
  assert.equal(
    isInternalPreviewSeed({
      ...seed,
      reference: "https://example.org/reviewed-evidence",
    }),
    false,
  );
  assert.equal(
    isInternalPreviewSeed({
      ...seed,
      reference: "javascript:alert(1)",
    }),
    false,
  );
});

test("claim provenance language never upgrades links to independent verification", () => {
  assert.match(factProvenanceDisclosure(fact), /Internal classification seed only/u);
  assert.match(
    factProvenanceDisclosure({ ...fact, sources: [] }),
    /No recorded source/u,
  );
  assert.match(factProvenanceDisclosure(undefined), /not independently verified/u);
  assert.match(
    factProvenanceDisclosure({
      ...fact,
      sources: [
        {
          source_id: "source.extra",
          title: "External source awaiting review",
          reference: "https://example.org/not-reviewed",
        },
      ],
    }),
    /Independent verification is not established/u,
  );
});
