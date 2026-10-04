// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_MODEL } from "../src/product/catalog.ts";

test("Product Model v1 covers the broad Preview catalogue", () => {
  assert.equal(PRODUCT_MODEL.languages.length, 35);
  assert.equal(PRODUCT_MODEL.licenses.length, 15);
  assert(PRODUCT_MODEL.use_cases.length >= 12);

  const languageIds = PRODUCT_MODEL.languages.map((item) => item.entity_id);
  const licenseIds = PRODUCT_MODEL.licenses.map((item) => item.entity_id);
  assert.equal(new Set(languageIds).size, languageIds.length);
  assert.equal(new Set(licenseIds).size, licenseIds.length);

  for (const profile of PRODUCT_MODEL.languages) {
    assert(profile.tagline.length > 20);
    assert(profile.build_path.includes("→"));
    assert(profile.good_for.length >= 2 || profile.entity_id === "language.solidity");
    assert(profile.watch_for.length >= 1);
  }
  for (const profile of PRODUCT_MODEL.licenses) {
    assert(profile.tagline.length > 15);
    assert(profile.good_when.length > 15);
    assert(profile.watch_for.length > 15);
  }
});

test("Use-case guidance references only known Product Model languages", () => {
  const known = new Set(PRODUCT_MODEL.languages.map((item) => item.entity_id));
  for (const guide of PRODUCT_MODEL.use_cases) {
    assert(guide.language_ids.length > 0, guide.use_case_id);
    for (const id of guide.language_ids) {
      assert(known.has(id), `${guide.use_case_id}: ${id}`);
    }
  }
});
