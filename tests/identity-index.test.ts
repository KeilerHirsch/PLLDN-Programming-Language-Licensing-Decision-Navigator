// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import {
  INDEX_ONLY_LANGUAGES,
  INDEX_ONLY_LICENSES,
  LANGUAGE_IDENTITIES,
  LANGUAGE_IDENTITY_SOURCE,
  LICENSE_IDENTITIES,
  LICENSE_IDENTITY_SOURCE,
  SPDX_IDENTITY_VERSION,
} from "../src/product/identity-index.ts";
import { LICENSE_DECISION_PROFILES } from "../src/product/license-decision-profiles.ts";

test("pinned language identity index extends profiles without duplicate assessment", () => {
  const keys = LANGUAGE_IDENTITIES.map((name) => name.toLocaleLowerCase("en-US"));
  assert(LANGUAGE_IDENTITIES.length >= 100);
  assert.equal(keys.length, new Set(keys).size);
  assert.equal(INDEX_ONLY_LANGUAGES.length > 65, true);
  const existing = new Set(
    PRODUCT_MODEL.languages.map((x) => x.label.toLocaleLowerCase("en-US")),
  );
  for (const name of INDEX_ONLY_LANGUAGES) {
    assert(!existing.has(name.toLocaleLowerCase("en-US")), name);
  }
  assert.match(LANGUAGE_IDENTITY_SOURCE, /github-linguist\/linguist\/blob\/[a-f0-9]{40}\//u);
});

test("pinned SPDX identities are links and never silently become license decisions", () => {
  assert.equal(SPDX_IDENTITY_VERSION, "3.29.0");
  assert(LICENSE_IDENTITIES.length >= 100);
  assert(INDEX_ONLY_LICENSES.length >= 65);
  const keys = LICENSE_IDENTITIES.map((entry) => entry.id.toLocaleLowerCase("en-US"));
  assert.equal(keys.length, new Set(keys).size);
  const profiled = new Set(
    Object.values(LICENSE_DECISION_PROFILES)
      .map((entry) => entry.spdx_id?.toLocaleLowerCase("en-US"))
      .filter((id): id is string => Boolean(id)),
  );
  for (const license of LICENSE_IDENTITIES) {
    assert(license.id.length > 0 && license.name.length > 0);
    assert.equal(license.reference, `https://spdx.org/licenses/${license.id}.html`);
  }
  for (const license of INDEX_ONLY_LICENSES) {
    assert(!profiled.has(license.id.toLocaleLowerCase("en-US")), license.id);
  }
  assert.match(LICENSE_IDENTITY_SOURCE, /spdx\/license-list-data\/blob\/[a-f0-9]{40}\//u);
});

test("identity-only indexes do not expand Reviewed or rated profile counts", () => {
  assert.equal(PRODUCT_MODEL.languages.length, 35);
  assert.equal(PRODUCT_MODEL.licenses.length, 32);
  assert.equal(Object.keys(LICENSE_DECISION_PROFILES).length, 32);
});
