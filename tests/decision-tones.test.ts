// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  languageDecisionTone,
  licenseDecisionTone,
} from "../src/ui/decision-tones.ts";

test("high throughput and high learning have opposite tones", () => {
  assert.equal(
    languageDecisionTone("throughput_potential", "high"),
    "favorable",
  );
  assert.equal(languageDecisionTone("learning_curve", "high"), "unfavorable");
});

test("performance tones distinguish potential, pace and overhead", () => {
  for (const metric of [
    "throughput_potential",
    "latency_predictability",
  ] as const) {
    assert.equal(languageDecisionTone(metric, "high"), "favorable");
    assert.equal(languageDecisionTone(metric, "medium"), "mixed");
    assert.equal(languageDecisionTone(metric, "low"), "unfavorable");
  }
  for (const metric of ["startup", "build_speed"] as const) {
    assert.equal(languageDecisionTone(metric, "fast"), "favorable");
    assert.equal(languageDecisionTone(metric, "medium"), "mixed");
    assert.equal(languageDecisionTone(metric, "slow"), "unfavorable");
  }
  assert.equal(languageDecisionTone("runtime_overhead", "low"), "favorable");
  assert.equal(languageDecisionTone("runtime_overhead", "medium"), "mixed");
  assert.equal(languageDecisionTone("runtime_overhead", "high"), "unfavorable");
});

test("lower complexity has the favorable tone for every complexity metric", () => {
  for (const metric of [
    "learning_curve",
    "language_surface",
    "memory_reasoning",
    "toolchain",
    "dependency_management",
    "deployment",
  ] as const) {
    assert.equal(languageDecisionTone(metric, "low"), "favorable");
    assert.equal(languageDecisionTone(metric, "medium"), "mixed");
    assert.equal(languageDecisionTone(metric, "high"), "unfavorable");
  }
});

test("ecosystem tones do not dismiss emerging projects", () => {
  for (const metric of ["breadth", "hiring_pool"] as const) {
    assert.equal(languageDecisionTone(metric, "broad"), "favorable");
    assert.equal(languageDecisionTone(metric, "moderate"), "mixed");
    assert.equal(languageDecisionTone(metric, "niche"), "unfavorable");
  }
  assert.equal(languageDecisionTone("tooling", "strong"), "favorable");
  assert.equal(languageDecisionTone("tooling", "good"), "mixed");
  assert.equal(languageDecisionTone("tooling", "basic"), "unfavorable");
  assert.equal(languageDecisionTone("maturity", "mature"), "favorable");
  assert.equal(languageDecisionTone("maturity", "emerging"), "mixed");
  assert.equal(languageDecisionTone("maturity", "legacy-stable"), "neutral");
});

test("license permissions share one scale while descriptive models stay neutral", () => {
  for (const metric of [
    "commercial_use",
    "saas_hosting",
    "competitive_use",
  ] as const) {
    assert.equal(licenseDecisionTone(metric, "yes"), "favorable");
    assert.equal(licenseDecisionTone(metric, "conditional"), "mixed");
    assert.equal(licenseDecisionTone(metric, "no"), "unfavorable");
    assert.equal(licenseDecisionTone(metric, "unknown"), "neutral");
  }
  assert.equal(licenseDecisionTone("osi_status", "approved"), "favorable");
  for (const status of ["not-approved", "not-applicable", "unknown"]) {
    assert.equal(licenseDecisionTone("osi_status", status), "neutral");
  }
  for (const model of [
    "open-source",
    "source-available",
    "public-domain-like",
    "license-transition",
  ]) {
    assert.equal(licenseDecisionTone("model", model), "neutral");
  }
});

test("unrecognized values cannot acquire a favorable tone", () => {
  for (const value of ["unknown", "__proto__", "constructor", "not-a-band"]) {
    for (const metric of [
      "throughput_potential",
      "startup",
      "runtime_overhead",
      "maturity",
      "breadth",
      "tooling",
    ] as const) {
      assert.equal(languageDecisionTone(metric, value), "neutral");
    }
    assert.equal(licenseDecisionTone("commercial_use", value), "neutral");
    assert.equal(licenseDecisionTone("osi_status", value), "neutral");
  }
});
