// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { validateDocument } from "../src/validation/documents.ts";
import { parseStrictJson } from "../src/validation/json.ts";
import { claim, entity, project } from "./fixtures.ts";

for (const raw of [
  '{"a":1,"a":2}',
  '{"a":1,"\\u0061":2}',
  '{"x":{"a":1,"a":2}}',
  '{"a":1,}',
  '{"a":/*x*/1}',
  '{"n":1e400}',
  '{"n":9007199254740993}',
  '{"__proto__":{}}',
  '{"s":"\\ud800"}',
]) {
  test(`reject invalid JSON: ${raw}`, () =>
    assert.throws(() => parseStrictJson(raw)));
}
test("same keys in separate objects are valid", () =>
  assert.deepEqual(parseStrictJson('{"a":{"x":1},"b":{"x":2}}'), {
    a: { x: 1 },
    b: { x: 2 },
  }));
test("input limits", () => {
  assert.throws(() => parseStrictJson(`"${"x".repeat(1048577)}"`));
  assert.throws(() => parseStrictJson(`${"[".repeat(65)}0${"]".repeat(65)}`));
});
test("UNKNOWN survives and cannot carry a value", () => {
  const c = claim();
  c.state = "UNKNOWN";
  delete c.value;
  validateDocument("claim", c);
  assert.match(JSON.stringify(parseStrictJson(JSON.stringify(c))), /"UNKNOWN"/);
  assert.throws(() =>
    validateDocument("claim", {
      ...c,
      value: { type: "boolean", value: false },
    }),
  );
});
test("FALSE is explicit", () =>
  validateDocument("claim", { ...claim(), state: "FALSE" }));
test("conditional requires conditions", () =>
  assert.throws(() =>
    validateDocument("claim", { ...claim(), state: "CONDITIONAL" }),
  ));
test("reject unknown fields and coercion without mutation", () => {
  const c = { ...claim(), unexpected: true };
  const before = JSON.stringify(c);
  assert.throws(() => validateDocument("claim", c));
  assert.equal(JSON.stringify(c), before);
  assert.throws(() =>
    validateDocument("claim", {
      ...claim(),
      value: { type: "boolean", value: "false" },
    }),
  );
});
test("facts need no strength; constraints do", () => {
  validateDocument("project-facts", project());
  const p = project();
  const fact = p.facts[0];
  assert(fact);
  fact.kind = "constraint";
  assert.throws(() => validateDocument("project-facts", p));
});
test("license identity retains only/or-later", () => {
  const only = {
    ...entity("license.gpl-3.0-only"),
    entity_type: "license",
    license_id: "GPL-3.0-only",
  };
  const later = {
    ...only,
    entity_id: "license.gpl-3.0-or-later",
    license_id: "GPL-3.0-or-later",
  };
  validateDocument("entity", only);
  validateDocument("entity", later);
  assert.notEqual(only.license_id, later.license_id);
  assert.throws(() =>
    validateDocument("entity", { ...only, license_id: "GPL" }),
  );
});
test("unknown schema kind", () =>
  assert.throws(() => validateDocument("alien", {})));
