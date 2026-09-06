// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const formPath = new URL(
  "../.github/ISSUE_TEMPLATE/dictionary.yml",
  import.meta.url,
);

function form(): string {
  return readFileSync(formPath, "utf8");
}

test("dictionary intake requires every material candidate field", () => {
  const yaml = form();
  for (const id of [
    "phrase",
    "locale",
    "target_facet",
    "target_option",
    "positive",
    "negative",
    "provenance",
    "ai_assistance",
  ]) {
    assert.match(yaml, new RegExp(`id: ${id}\\b`));
  }
  assert.equal((yaml.match(/required:\s*true/g) ?? []).length >= 8, true);
  assert.equal(yaml.includes("required: true  - type"), false);
});
test("dictionary intake exposes only approved Stage 4 facet targets", () => {
  const yaml = form();
  for (const option of [
    "runtime-garbage-collection",
    "memory-safety-without-gc",
    "static-type-checker",
    "emits-javascript",
    "ambiguity-only",
  ]) {
    assert.match(yaml, new RegExp(`-\\s*["']?${option}["']?(?:\\s|$)`));
  }
  for (const option of ["true", "false", "ambiguity-only"]) {
    assert.match(yaml, new RegExp(`-\\s*["']?${option}["']?(?:\\s|$)`));
  }
});

test("dictionary intake states candidate-only authority and regression burden", () => {
  const yaml = form();
  assert.match(yaml, /untrusted candidate/i);
  assert.match(yaml, /does not become (?:a )?rule/i);
  assert.match(yaml, /schema validation/i);
  assert.match(yaml, /positive.*negative|negative.*positive/is);
  assert.match(yaml, /ambiguity.*conflict|conflict.*ambiguity/is);
  assert.match(yaml, /manual.*text equivalence|text.*manual equivalence/is);
  assert.equal(yaml.includes("text-rules/stage4-core.json"), false);
});
