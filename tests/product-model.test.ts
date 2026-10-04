// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import { LANGUAGE_DECISION_PROFILES } from "../src/product/language-decision-profiles.ts";

function candidateEntityIds(type: "language" | "license"): string[] {
  const root = "knowledge/candidate/catalog-2026-10-03/entities";
  return readdirSync(root)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(`${root}/${name}`, "utf8")))
    .filter(
      (document) =>
        document.kind === "entity" && document.record.entity_type === type,
    )
    .map((document) => String(document.record.entity_id))
    .sort();
}

test("Product Model v1 exactly covers the broad Preview catalogue", () => {
  const languageIds = PRODUCT_MODEL.languages
    .map((item) => item.entity_id)
    .sort();
  const licenseIds = PRODUCT_MODEL.licenses
    .map((item) => item.entity_id)
    .sort();

  assert.deepEqual(languageIds, candidateEntityIds("language"));
  assert.deepEqual(licenseIds, candidateEntityIds("license"));
  assert.equal(new Set(languageIds).size, 35);
  assert.equal(new Set(licenseIds).size, 15);
  assert(PRODUCT_MODEL.use_cases.length >= 12);

  for (const profile of PRODUCT_MODEL.languages) {
    assert(profile.tagline.length > 20);
    assert(profile.build_path.includes("→"));
    assert(
      profile.good_for.length >= 2 || profile.entity_id === "language.solidity",
    );
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


test("Decision Dimensions v2 covers every language with bounded editorial bands", () => {
  const expected = new Set(
    PRODUCT_MODEL.languages.map((profile) => profile.entity_id),
  );
  assert.deepEqual(
    [...Object.keys(LANGUAGE_DECISION_PROFILES)].sort(),
    [...expected].sort(),
  );

  const allowedDecision = new Set(["low", "medium", "high"]);
  const allowedPace = new Set(["fast", "medium", "slow"]);
  const allowedMaturity = new Set(["emerging", "mature", "legacy-stable"]);
  const allowedBreadth = new Set(["niche", "moderate", "broad"]);
  const allowedTooling = new Set(["basic", "good", "strong"]);

  for (const profile of Object.values(LANGUAGE_DECISION_PROFILES)) {
    assert(allowedDecision.has(profile.performance.throughput_potential));
    assert(allowedPace.has(profile.performance.startup));
    assert(allowedDecision.has(profile.performance.runtime_overhead));
    assert(allowedDecision.has(profile.performance.latency_predictability));
    assert(allowedPace.has(profile.performance.build_speed));

    for (const value of Object.values(profile.complexity)) {
      assert(allowedDecision.has(value));
    }
    assert(allowedMaturity.has(profile.ecosystem.maturity));
    assert(allowedBreadth.has(profile.ecosystem.breadth));
    assert(allowedTooling.has(profile.ecosystem.tooling));
    assert(allowedBreadth.has(profile.ecosystem.hiring_pool));
  }
});
