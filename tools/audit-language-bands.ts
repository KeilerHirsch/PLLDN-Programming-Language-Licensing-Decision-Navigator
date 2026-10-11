// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LANGUAGE_BAND_COMPLEXITY_DIMENSIONS,
  LANGUAGE_BAND_PERFORMANCE_DIMENSIONS,
} from "../src/product/language-band-provenance.ts";
import { LANGUAGE_DECISION_PROFILES } from "../src/product/language-decision-profiles.ts";

const inventory = JSON.parse(
  readFileSync("catalog/audit/language-band-evidence.v0.3.json", "utf8"),
);
const ids = Object.keys(LANGUAGE_DECISION_PROFILES).sort();
const performance = [...LANGUAGE_BAND_PERFORMANCE_DIMENSIONS];
const complexity = [...LANGUAGE_BAND_COMPLEXITY_DIMENSIONS];
assert.equal(inventory.schema_version, "0.3");
assert.equal(inventory.review_status, "EDITORIAL_PREVIEW_NOT_REVIEWED");
assert.equal(inventory.evidence_status, "NO_LINKED_INDEPENDENT_EVIDENCE");
assert.deepEqual(inventory.editorial_language_ids, ids);
assert.deepEqual(inventory.performance_dimensions, performance);
assert.deepEqual(inventory.complexity_dimensions, complexity);
assert.deepEqual(inventory.independently_supported_band_claims, []);
assert.deepEqual(inventory.reproducible_test_refs, []);
assert.equal(new Set(ids).size, ids.length);
for (const id of ids) {
  const profile = LANGUAGE_DECISION_PROFILES[id];
  assert(profile, `Missing editorial profile for ${id}`);
  assert.deepEqual(
    Object.keys(profile.performance).sort(),
    [...performance].sort(),
  );
  assert.deepEqual(
    Object.keys(profile.complexity).sort(),
    [...complexity].sort(),
  );
}
const totals = {
  performance_bands: ids.length * performance.length,
  complexity_bands: ids.length * complexity.length,
  total_bands: ids.length * (performance.length + complexity.length),
};
assert.deepEqual(inventory.assessment_units, totals);
for (const kind of ["performance", "complexity"]) {
  assert.equal(typeof inventory.promotion_contract?.[kind], "string");
  assert(inventory.promotion_contract[kind].length > 100);
}
console.log(
  JSON.stringify({
    schema_version: inventory.schema_version,
    evidence_status: inventory.evidence_status,
    editorial_languages: ids.length,
    ...totals,
    independently_supported_bands:
      inventory.independently_supported_band_claims.length,
    reproducible_test_refs: inventory.reproducible_test_refs.length,
  }),
);
