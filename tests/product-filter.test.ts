// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import {
  DEFAULT_PRODUCT_UI_STATE,
  languageMatchesFilters,
  licenseMatchesFilters,
} from "../src/ui/product.ts";

test("language catalogue filters combine decision dimensions deterministically", () => {
  const filters = {
    ...DEFAULT_PRODUCT_UI_STATE.filters,
    languageThroughput: "high",
    languageLearning: "low",
    languageEcosystem: "broad",
  };
  const ids = PRODUCT_MODEL.languages
    .filter((profile) => languageMatchesFilters(profile, filters))
    .map((profile) => profile.entity_id);

  assert(ids.includes("language.go"));
  assert(ids.includes("language.csharp"));
  assert(ids.includes("language.kotlin"));
  assert.equal(ids.includes("language.python"), false);
  assert.equal(ids.includes("language.rust"), false);
});

test("language category filter composes with performance filters", () => {
  const filters = {
    ...DEFAULT_PRODUCT_UI_STATE.filters,
    languageCategory: "system",
    languageThroughput: "high",
  };
  const ids = PRODUCT_MODEL.languages
    .filter((profile) => languageMatchesFilters(profile, filters))
    .map((profile) => profile.entity_id);

  assert(ids.includes("language.c"));
  assert(ids.includes("language.cpp"));
  assert(ids.includes("language.rust"));
  assert(ids.includes("language.zig"));
  assert.equal(ids.includes("language.python"), false);
});

test("license catalogue filters expose source-available business restrictions", () => {
  const filters = {
    ...DEFAULT_PRODUCT_UI_STATE.filters,
    licenseModel: "source-available",
    licenseCommercial: "no",
  };
  const ids = PRODUCT_MODEL.licenses
    .filter((profile) => licenseMatchesFilters(profile, filters))
    .map((profile) => profile.entity_id);

  assert(ids.includes("license.polyform-noncommercial-1.0.0"));
  assert(ids.includes("license.polyform-strict-1.0.0"));
  assert.equal(ids.includes("license.mit"), false);
});

test("license competition filter finds PolyForm protective variants", () => {
  const filters = {
    ...DEFAULT_PRODUCT_UI_STATE.filters,
    licenseCompetitive: "no",
  };
  const ids = PRODUCT_MODEL.licenses
    .filter((profile) => licenseMatchesFilters(profile, filters))
    .map((profile) => profile.entity_id);

  assert(ids.includes("license.polyform-perimeter-1.0.1"));
  assert(ids.includes("license.polyform-shield-1.0.0"));
  assert.equal(ids.includes("license.apache-2.0"), false);
});
