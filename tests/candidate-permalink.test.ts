// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pinnedCandidateById } from "../src/ui/product.ts";

test("candidate permalinks resolve only pinned source identities", () => {
  const agda = pinnedCandidateById("candidate.language.61676461");
  assert.equal(agda?.kind, "language");
  assert.equal(agda?.name, "Agda");
  assert.equal(agda?.review_status, "NOT_REVIEWED");
  assert.equal(agda?.stage, "UNASSESSED_PREVIEW");
  assert.equal(agda?.claim_refs.length, 0);

  const artistic = pinnedCandidateById("candidate.license.artistic-2.0");
  assert.equal(artistic?.kind, "license");
  assert.equal(artistic?.review_status, "NOT_REVIEWED");
  assert.equal(artistic?.stage, "UNASSESSED_PREVIEW");
  assert.equal(pinnedCandidateById("candidate.license.fake"), null);
  assert.equal(pinnedCandidateById(null), null);
  assert.equal(pinnedCandidateById(""), null);
});

test("browser identity links are same-origin, searchable and fully test-driven", () => {
  const product = readFileSync("src/ui/product.ts", "utf8");
  const main = readFileSync("src/ui/main.ts", "utf8");
  const browser = readFileSync("tools/browser-smoke.ts", "utf8");
  assert(
    product.includes('destination.searchParams.set("candidate", record.id)'),
  );
  assert(product.includes('destination.hash = "catalog"'));
  assert(product.includes('permalink.dataset.candidatePermalink = "true"'));
  assert(
    main.includes(
      'new URLSearchParams(window.location.search).get("candidate")',
    ),
  );
  assert(main.includes("pinnedCandidateById("));
  assert(main.includes("profile.scrollIntoView("));
  assert(browser.includes('"?candidate=candidate.language.61676461"'));
  assert(browser.includes('"?candidate=candidate.license.artistic-2.0"'));
});
