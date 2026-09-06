// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveProject,
  projectWithoutFacet,
  resetProject,
} from "../src/ui/facts.ts";
import type { FacetDefinition } from "../src/ui/types.ts";
import { project } from "./fixtures.ts";

const facets: FacetDefinition[] = [
  {
    facet_id: "capability",
    label: "Capability",
    group: "Runtime",
    dimension_id: "dimension.capability",
    operator: "EQ",
    strength: "MUST",
    options: [
      {
        option_id: "yes",
        label: "Yes",
        value: { type: "boolean", value: true },
      },
      {
        option_id: "no",
        label: "No",
        value: { type: "boolean", value: false },
      },
    ],
  },
];

function uiFacts(doc: Record<string, unknown>): Record<string, unknown>[] {
  return (doc.facts as Record<string, unknown>[]).filter((fact) =>
    String(fact.fact_id).startsWith("ui.facet."),
  );
}
test("selecting a facet creates one deterministic UI-owned constraint", () => {
  const base = project();
  const original = structuredClone(base);
  const derived = deriveProject(
    base,
    facets,
    { capability: "yes" },
    "component.ui",
  );
  assert.deepEqual(base, original);
  assert.deepEqual(uiFacts(derived), [
    {
      fact_id: "ui.facet.capability",
      dimension_id: "dimension.capability",
      scope: { kind: "component", component_id: "component.ui" },
      kind: "constraint",
      lifecycle: "target",
      state: "TRUE",
      strength: "MUST",
      operator: "EQ",
      value: { type: "boolean", value: true },
    },
  ]);
});

test("changing a facet replaces only its own derived constraint", () => {
  const base = project();
  const yes = deriveProject(
    base,
    facets,
    { capability: "yes" },
    "component.ui",
  );
  const no = deriveProject(base, facets, { capability: "no" }, "component.ui");
  assert.equal(uiFacts(yes).length, 1);
  assert.equal(uiFacts(no).length, 1);
  assert.deepEqual(uiFacts(no)[0]?.value as object, {
    type: "boolean",
    value: false,
  });
});
test("clearing or previewing a facet preserves foreign constraints", () => {
  const base = project();
  base.facts.push({
    fact_id: "constraint.user",
    dimension_id: "dimension.capability",
    scope: { kind: "component", component_id: "component.ui" },
    kind: "constraint",
    lifecycle: "target",
    state: "TRUE",
    strength: "MUST",
    operator: "EQ",
    value: { type: "boolean", value: true },
  });
  const cleared = deriveProject(base, facets, {}, "component.ui");
  const preview = projectWithoutFacet(
    base,
    facets,
    { capability: "no" },
    "capability",
    "component.ui",
  );
  for (const doc of [cleared, preview]) {
    const ids = (doc.facts as Record<string, unknown>[]).map(
      (fact) => fact.fact_id,
    );
    assert(ids.includes("constraint.user"));
    assert.equal(ids.includes("ui.facet.capability"), false);
  }
});

test("reset reproduces the exact canonical base project", () => {
  const base = project();
  assert.deepEqual(resetProject(base), base);
  assert.notEqual(resetProject(base), base);
});
test("reserved UI fact IDs in imported base projects fail closed", () => {
  const base = project();
  base.facts.push({
    fact_id: "ui.facet.foreign",
    dimension_id: "dimension.capability",
    scope: { kind: "component", component_id: "component.ui" },
    kind: "constraint",
    lifecycle: "target",
    state: "TRUE",
    strength: "MUST",
    operator: "EQ",
    value: { type: "boolean", value: true },
  });
  assert.throws(
    () => deriveProject(base, facets, {}, "component.ui"),
    /reserved UI facet namespace/i,
  );
});

test("unknown facet and option selections fail closed", () => {
  const base = project();
  assert.throws(
    () => deriveProject(base, facets, { missing: "yes" }, "component.ui"),
    /unknown facet/i,
  );
  assert.throws(
    () => deriveProject(base, facets, { capability: "maybe" }, "component.ui"),
    /unknown facet option/i,
  );
});
