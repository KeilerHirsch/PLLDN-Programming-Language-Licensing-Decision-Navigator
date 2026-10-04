// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import { LANGUAGE_DECISION_PROFILES } from "../src/product/language-decision-profiles.ts";
import { LICENSE_DECISION_PROFILES } from "../src/product/license-decision-profiles.ts";

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
  assert.equal(new Set(licenseIds).size, 32);
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


test("License Model v2 covers every license entity without requiring SPDX identity", () => {
  const expected = PRODUCT_MODEL.licenses
    .map((profile) => profile.entity_id)
    .sort();
  assert.deepEqual(
    Object.keys(LICENSE_DECISION_PROFILES).sort(),
    expected,
  );

  const shield =
    LICENSE_DECISION_PROFILES["license.polyform-shield-1.0.0"];
  assert(shield);
  assert.equal(shield.spdx_id, null);
  assert.equal(shield.model, "source-available");
  assert.equal(shield.rights.competitive_use, "no");

  const noncommercial =
    LICENSE_DECISION_PROFILES["license.polyform-noncommercial-1.0.0"];
  assert(noncommercial);
  assert.equal(noncommercial.spdx_id, "PolyForm-Noncommercial-1.0.0");
  assert.equal(noncommercial.rights.commercial_use, "no");

  const countdown =
    LICENSE_DECISION_PROFILES["license.polyform-countdown-1.0.0"];
  assert(countdown);
  assert.equal(countdown.model, "license-transition");
  assert.equal(countdown.obligations.time_rule, "change-date");
});
