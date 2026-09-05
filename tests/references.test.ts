// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { validateReferences } from "../src/validation/references.ts";
import { bundle, entity, now, project } from "./fixtures.ts";

test("synthetic graph resolves", () => validateReferences(bundle(), now));
test("duplicate ID", () => {
  const b = bundle();
  const first = b[0];
  assert(first);
  b.push(first);
  assert.throws(() => validateReferences(b, now));
});
for (const [name, change] of Object.entries({
  source: { source_ids: ["source.missing"] },
  type: { value: { type: "string", value: "yes" } },
  tests: { test_refs: [] },
  future: { verified_at: "2030-01-01T00:00:00Z" },
  expired: { valid_until: "2026-09-04T00:00:00Z" },
})) {
  test(`reject graph: ${name}`, () => {
    const b = bundle();
    const record = b[3];
    assert(record);
    Object.assign(record.record, change);
    assert.throws(() => validateReferences(b, now));
  });
}
test("component facts resolve", () =>
  validateReferences(
    [...bundle(), { kind: "project-facts", record: project() }],
    now,
  ));
test("component cannot escape project", () => {
  const p = project();
  const fact = p.facts[0];
  assert(fact);
  fact.scope.component_id = "component.missing";
  assert.throws(() =>
    validateReferences(
      [...bundle(), { kind: "project-facts", record: p }],
      now,
    ),
  );
});

test("constraint operators must match the dimension value type", () => {
  for (const operator of ["GTE", "LTE", "IN"]) {
    const p = project();
    const fact = p.facts[0];
    assert(fact);
    fact.kind = "constraint";
    fact.strength = "MUST";
    fact.operator = operator;
    assert.throws(() =>
      validateReferences(
        [...bundle(), { kind: "project-facts", record: p }],
        now,
      ),
    );
  }
});

test("claim supersession cannot erase a different entity or dimension", () => {
  const b = bundle();
  b.push({ kind: "entity", record: entity("language.other") });
  const original = b[3];
  assert(original);
  const replacement = structuredClone(original);
  replacement.record.claim_id = "claim.other";
  replacement.record.entity_id = "language.other";
  replacement.record.supersedes = ["claim.fixture"];
  b.push(replacement);
  assert.throws(() => validateReferences(b, now), /supersession/i);
});
