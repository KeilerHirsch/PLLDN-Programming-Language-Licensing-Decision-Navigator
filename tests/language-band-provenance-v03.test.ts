// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { LANGUAGE_DECISION_PROFILES } from "../src/product/language-decision-profiles.ts";
import {
  LANGUAGE_BAND_COMPLEXITY_DIMENSIONS,
  LANGUAGE_BAND_EVIDENCE_NOTICE,
  LANGUAGE_BAND_PERFORMANCE_DIMENSIONS,
} from "../src/product/language-band-provenance.ts";

test("Editorial language metrics inventory stays unverified and complete", () => {
  const ledger = JSON.parse(
    readFileSync("catalog/audit/language-band-evidence.v0.3.json", "utf8"),
  );
  assert.equal(ledger.review_status, "EDITORIAL_PREVIEW_NOT_REVIEWED");
  assert.equal(ledger.evidence_status, "NO_LINKED_INDEPENDENT_EVIDENCE");
  assert.deepEqual(ledger.independently_supported_band_claims, []);
  assert.deepEqual(ledger.reproducible_test_refs, []);
  assert.deepEqual(ledger.editorial_language_ids, Object.keys(LANGUAGE_DECISION_PROFILES).sort());
  assert.deepEqual(ledger.performance_dimensions, [...LANGUAGE_BAND_PERFORMANCE_DIMENSIONS]);
  assert.deepEqual(ledger.complexity_dimensions, [...LANGUAGE_BAND_COMPLEXITY_DIMENSIONS]);
  assert.equal(ledger.assessment_units.total_bands, 385);
  const cmd = spawnSync(process.execPath, ["tools/audit-language-bands.ts"], { encoding: "utf8" });
  assert.equal(cmd.status, 0, cmd.stderr);
  const report = JSON.parse(cmd.stdout);
  assert.equal(report.editorial_languages, 35);
  assert.equal(report.performance_bands, 175);
  assert.equal(report.complexity_bands, 210);
  assert.equal(report.independently_supported_bands, 0);
  assert.equal(report.reproducible_test_refs, 0);
});

test("Performance and complexity caveat reaches cards, compare and CSV", () => {
  assert(LANGUAGE_BAND_EVIDENCE_NOTICE.includes("Unverified Editorial Preview"));
  assert(LANGUAGE_BAND_EVIDENCE_NOTICE.includes("not measured cross-language rankings"));
  const source = readFileSync("src/ui/product.ts", "utf8");
  const csv = readFileSync("src/ui/language-compare-export.ts", "utf8");
  assert(source.includes("LANGUAGE_BAND_EVIDENCE_NOTICE"));
  assert(source.includes('dataset.languageBandEvidence = "unverified"'));
  assert(source.includes('label: "Performance / complexity evidence status"'));
  assert(csv.includes("languageComparisonRows(catalog)"));
});
