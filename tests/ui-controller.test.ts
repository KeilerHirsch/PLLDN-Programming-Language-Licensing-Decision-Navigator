// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDecision } from "../src/decision/evaluate.ts";
import { facetCounts } from "../src/decision/facets.ts";
import { createUiController } from "../src/ui/controller.ts";
import { projectWithoutFacet } from "../src/ui/facts.ts";
import { uiAt, uiFacets, uiKnowledge, uiProject } from "./ui-fixtures.ts";

function config(project = uiProject()) {
  return {
    baseProject: project,
    knowledge: uiKnowledge(),
    facets: uiFacets,
    candidateType: "language",
    componentId: "component.ui",
    evaluatedAt: uiAt,
    knowledgeSnapshot: "knowledge.ui",
    rulesSnapshot: "rules.ui",
    snapshotSha256: "e".repeat(64),
  };
}

function request(project: Record<string, unknown>) {
  return {
    project,
    knowledge: uiKnowledge(),
    candidateType: "language",
    componentId: "component.ui",
    evaluatedAt: uiAt,
    knowledgeSnapshot: "knowledge.ui",
    rulesSnapshot: "rules.ui",
    snapshotSha256: "e".repeat(64),
  };
}
test("controller result and counts are produced by the authoritative engine", async () => {
  const controller = createUiController(config());
  const model = await controller.selectFacet("safe", "yes");
  const direct = await evaluateDecision(request(model.project));
  assert.deepEqual(model.trace, direct.trace);
  assert.deepEqual(
    model.engine.candidates.map((x) => [x.candidate_id, x.status]),
    direct.candidates.map((x) => [x.candidate_id, x.status]),
  );

  const preview = projectWithoutFacet(
    uiProject(),
    uiFacets,
    { safe: "yes" },
    "safe",
    "component.ui",
  );
  const safeFacet = uiFacets.find((facet) => facet.facet_id === "safe");
  assert(safeFacet);
  const expected = await facetCounts(
    request(preview),
    "dimension.safe",
    safeFacet.options.map((option) => option.value),
    { strength: "MUST", operator: "EQ" },
  );
  const actual = model.facets.find((facet) => facet.facet_id === "safe");
  assert(actual);
  assert.deepEqual(
    actual.options.map(
      ({ value, eligible, excluded, unresolved, decision_state }) => ({
        value,
        eligible,
        excluded,
        unresolved,
        decision_state,
      }),
    ),
    expected,
  );
});
test("same-dimension user constraints remain authoritative and may conflict", async () => {
  const base = uiProject();
  (base.facts as Record<string, unknown>[]).push({
    fact_id: "constraint.user.safe",
    dimension_id: "dimension.safe",
    scope: { kind: "component", component_id: "component.ui" },
    kind: "constraint",
    lifecycle: "target",
    state: "TRUE",
    strength: "MUST",
    operator: "EQ",
    value: { type: "boolean", value: true },
  });
  const controller = createUiController(config(base));
  const model = await controller.selectFacet("safe", "no");
  assert.equal(model.state.state, "CONFLICT");
  assert(
    (model.project.facts as Record<string, unknown>[]).some(
      (fact) => fact.fact_id === "constraint.user.safe",
    ),
  );
});

test("reset returns to the exact base project and clears chips", async () => {
  const base = uiProject();
  const controller = createUiController(config(base));
  await controller.selectFacet("safe", "yes");
  const reset = await controller.reset();
  assert.deepEqual(reset.project, base);
  assert.deepEqual(reset.chips, []);
});
test("sort changes presentation only", async () => {
  const controller = createUiController(config());
  const recommended = await controller.selectFacet("safe", "yes");
  const named = await controller.setSort("name");
  assert.deepEqual(named.project, recommended.project);
  assert.deepEqual(named.trace, recommended.trace);
  assert.deepEqual(named.facets, recommended.facets);
  assert.notDeepEqual(
    named.candidates.map((x) => x.candidate_id),
    recommended.candidates.map((x) => x.candidate_id),
  );
});

test("invalid UI actions reject without replacing the last valid selection", async () => {
  const controller = createUiController(config());
  const valid = await controller.selectFacet("safe", "yes");
  await assert.rejects(
    () => controller.selectFacet("safe", "missing"),
    /unknown facet option/i,
  );
  const after = await controller.view();
  assert.deepEqual(after.project, valid.project);
  assert.deepEqual(after.trace, valid.trace);
});
