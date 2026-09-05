// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { validateReferences } from "../src/validation/references.ts";
import { bundle, now, project } from "./fixtures.ts";

test("synthetic graph resolves", () => validateReferences(bundle(), now));
test("duplicate ID", () => {
  const b = bundle();
  b.push(b[0]!);
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
    Object.assign(b[3]!.record, change);
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
  p.facts[0]!.scope.component_id = "component.missing";
  assert.throws(() =>
    validateReferences(
      [...bundle(), { kind: "project-facts", record: p }],
      now,
    ),
  );
});
