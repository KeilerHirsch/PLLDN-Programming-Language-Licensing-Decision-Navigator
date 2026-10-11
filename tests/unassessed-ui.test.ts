// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import candidates from "../catalog/unassessed-candidates.v0.2.json" with {
  type: "json",
};

test("UI candidate overlay covers the entire index, never editorial profiles", () => {
  const languages = candidates.records.filter((x) => x.kind === "language");
  const licenses = candidates.records.filter((x) => x.kind === "license");
  assert.equal(languages.length, 159);
  assert.equal(licenses.length, 682);
  assert(languages.every((x) => x.review_status === "NOT_REVIEWED"));
  assert(licenses.every((x) => x.review_status === "NOT_REVIEWED"));
  assert.equal(new Set(candidates.records.map((x) => x.id)).size, 841);
});

test("browser profile disclosures use safe text APIs with exact provenance", () => {
  const product = readFileSync("src/ui/product.ts", "utf8");
  const probe = readFileSync("tools/browser-smoke.ts", "utf8");
  for (const expected of [
    "renderUnassessedProfile",
    "unassessedLanguageProfiles.get",
    "unassessedLicenseProfiles.get",
    "candidates.source_pins.linguist_commit",
    "candidates.source_pins.spdx_commit",
    "record.claim_refs.length !== 0",
    'record.review_status !== "NOT_REVIEWED"',
    'reference.rel = "noopener noreferrer"',
    'details.dataset.candidateId = record.id',
  ]) assert(product.includes(expected), expected);
  for (const expected of ["candidate.language.61676461", "candidate.license.artistic-2.0"]) {
    assert(probe.includes(expected), expected);
  }
  for (const forbidden of ["innerHTML", "insertAdjacentHTML", "eval("]) {
    assert.equal(product.includes(forbidden), false);
  }
});
