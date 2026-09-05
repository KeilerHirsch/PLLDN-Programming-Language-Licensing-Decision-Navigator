// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDecision } from "../src/decision/evaluate.ts";
import { facetCounts } from "../src/decision/facets.ts";
import { deriveProject, projectWithoutFacet } from "../src/ui/facts.ts";
import { buildUiViewModel } from "../src/ui/model.ts";
import { uiAt, uiFacets, uiKnowledge, uiProject } from "./ui-fixtures.ts";

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

async function material(sort: "recommended" | "name") {
  const selections = { safe: "yes" };
  const project = deriveProject(
    uiProject(),
    uiFacets,
    selections,
    "component.ui",
  );
  const evaluation = await evaluateDecision(request(project));
  const counts: Record<string, Awaited<ReturnType<typeof facetCounts>>> = {};
  for (const facet of uiFacets) {
    const preview = projectWithoutFacet(
      uiProject(),
      uiFacets,
      selections,
      facet.facet_id,
      "component.ui",
    );
    counts[facet.facet_id] = await facetCounts(
      request(preview),
      facet.dimension_id,
      facet.options.map((option) => option.value),
      { strength: facet.strength, operator: facet.operator },
    );
  }
  return buildUiViewModel({
    project,
    evaluation,
    knowledge: uiKnowledge(),
    candidateType: "language",
    facets: uiFacets,
    counts,
    selections,
    sort,
  });
}

test("candidate labels and material classes come from engine/entity records", async () => {
  const model = await material("recommended");
  assert.equal(model.state.state, "RECOMMEND");
  assert.deepEqual(
    model.candidates.map((x) => [x.label, x.material_class]),
    [
      ["Zeta", "selected"],
      ["Gamma", "unresolved"],
      ["Alpha", "excluded"],
    ],
  );
});
test("name sorting is presentation-only and deterministic", async () => {
  const recommended = await material("recommended");
  const named = await material("name");
  assert.deepEqual(
    named.candidates.map((x) => x.label),
    ["Alpha", "Gamma", "Zeta"],
  );
  assert.deepEqual(named.project, recommended.project);
  assert.deepEqual(named.trace, recommended.trace);
  assert.deepEqual(named.facets, recommended.facets);
});

test("active selections become readable chips with engine counts", async () => {
  const model = await material("recommended");
  assert.deepEqual(model.chips, [
    { facet_id: "safe", option_id: "yes", label: "Memory safe: Yes" },
  ]);
  const safe = model.facets.find((facet) => facet.facet_id === "safe");
  assert(safe);
  assert.deepEqual(
    safe.options.map((option) => [
      option.option_id,
      option.eligible,
      option.excluded,
      option.unresolved,
    ]),
    [
      ["yes", 1, 1, 1],
      ["no", 1, 1, 1],
    ],
  );
});

test("typed decision states remain explicit in the view model", async () => {
  const model = await material("recommended");
  for (const state of [
    "RECOMMEND",
    "ALTERNATIVES",
    "NEEDS_ONE_FACT",
    "INSUFFICIENT_INFORMATION",
    "CONFLICT",
    "UNSUPPORTED",
  ] as const) {
    const projected = buildUiViewModel({
      project: model.project,
      evaluation: { ...model.engine, trace: { ...model.trace, state } },
      knowledge: uiKnowledge(),
      candidateType: "language",
      facets: uiFacets,
      counts: Object.fromEntries(
        model.facets.map((f) => [f.facet_id, f.options]),
      ),
      selections: { safe: "yes" },
      sort: "recommended",
    });
    assert.equal(projected.state.state, state);
    assert.notEqual(projected.state.message.length, 0);
  }
});
