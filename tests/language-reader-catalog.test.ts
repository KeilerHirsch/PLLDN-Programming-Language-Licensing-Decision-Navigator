// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { LANGUAGE_INFORMATION } from "../src/product/language-information.ts";
import {
  licenseCatalogHref,
  READER_PROFILES,
  readerExampleStatus,
  readerProfileByName,
  readerProfileTerms,
} from "../src/product/language-reader-profiles.ts";

test("all 194 exact identities have individually scoped descriptive reader profiles", () => {
  assert.equal(READER_PROFILES.length, 194);
  assert.deepEqual(
    READER_PROFILES.map((row) => row.name).sort(),
    LANGUAGE_INFORMATION.records.map((row) => row.name).sort(),
  );
  for (const row of READER_PROFILES) {
    assert.equal(readerProfileByName(row.name), row);
    assert.equal(row.example.verification.status, "documented");
    for (const fact of Object.values(row.sections))
      assert(fact.source_ids.length > 0);
  }
  assert.equal(readerProfileByName("basic"), undefined);
  assert.equal(readerProfileByName("invented-language"), undefined);
});
test("search includes project conditions and component license scope without inferred ratings", () => {
  const profile = readerProfileByName("BASIC");
  assert(profile);
  const terms = readerProfileTerms("BASIC");
  assert(terms.includes(profile.sections.prerequisites.text));
  assert(terms.includes(profile.implementation.name));
  assert(terms.includes("GPL-2.0-or-later"));
  assert.deepEqual(readerProfileTerms("missing"), []);
});
test("license routes accept only exact catalog identities", () => {
  assert.equal(licenseCatalogHref("MIT"), "?profile=license.mit#catalog");
  assert.equal(
    licenseCatalogHref("PSF-2.0"),
    "?candidate=candidate.license.psf-2.0#catalog",
  );
  for (const expression of [
    "",
    "MIT OR Apache-2.0",
    "mit",
    "MIT_UNKNOWN",
    "javascript:alert(1)",
    "LicenseRef-unknown",
  ])
    assert.equal(licenseCatalogHref(expression), null);
});
test("receipts never promote reference or undocumented language examples", () => {
  const basic = readerProfileByName("BASIC");
  assert(basic);
  assert.equal(readerExampleStatus(basic).status, "documented");
  for (const name of ["JavaScript", "TypeScript"]) {
    const profile = readerProfileByName(name);
    assert(profile);
    const status = readerExampleStatus(profile);
    assert.equal(status.status, "executed");
    assert(status.toolchain);
    assert(status.checked_on);
  }
});
