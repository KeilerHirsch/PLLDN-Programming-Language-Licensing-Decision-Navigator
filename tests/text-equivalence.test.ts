// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { encodeCanonical } from "../src/snapshots/manifest.ts";
import type { TextProposal } from "../src/text/types.ts";
import { createUiController } from "../src/ui/controller.ts";
import {
  confirmProposal,
  confirmProposals,
} from "../src/ui/text-assistance.ts";
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

function proposed(facetId: string, optionId: string): TextProposal {
  return {
    proposal_id: `proposal.${facetId}.${optionId}`,
    state: "PROPOSED",
    spans: [{ start: 0, end: 4, text: "test" }],
    rule_ids: [`rule.${facetId}.${optionId}`],
    reason_key: "text.test",
    facet_id: facetId,
    option_id: optionId,
  };
}

test("confirmed text proposal is materially identical to manual facet selection", async () => {
  const manualController = createUiController(config());
  const textController = createUiController(config());

  const manual = await manualController.selectFacet("safe", "yes");
  const assisted = await confirmProposal(
    textController,
    proposed("safe", "yes"),
  );

  assert.equal(
    encodeCanonical(assisted.project),
    encodeCanonical(manual.project),
  );
  assert.equal(assisted.state.state, manual.state.state);
  assert.deepEqual(assisted.trace, manual.trace);
  assert.deepEqual(
    assisted.candidates.map((candidate) => ({
      id: candidate.candidate_id,
      status: candidate.status,
      material: candidate.material_class,
    })),
    manual.candidates.map((candidate) => ({
      id: candidate.candidate_id,
      status: candidate.status,
      material: candidate.material_class,
    })),
  );
  assert.deepEqual(
    assisted.state.unresolved_dimension_ids,
    manual.state.unresolved_dimension_ids,
  );
});

test("confirmation writes only the existing ui.facet canonical namespace", async () => {
  const controller = createUiController(config());
  const model = await confirmProposal(controller, proposed("safe", "yes"));
  const ids = (model.project.facts as Record<string, unknown>[]).map((fact) =>
    String(fact.fact_id),
  );
  assert(ids.includes("ui.facet.safe"));
  assert.equal(
    ids.some((id) => id.startsWith("ui.text.")),
    false,
  );
});

test("ambiguous and conflicting proposals are never confirmable", async () => {
  const controller = createUiController(config());
  const ambiguous: TextProposal = {
    proposal_id: "proposal.ambiguous",
    state: "AMBIGUOUS",
    spans: [{ start: 0, end: 4, text: "test" }],
    rule_ids: ["rule.ambiguous"],
    reason_key: "text.ambiguous",
  };
  const conflicting: TextProposal = {
    proposal_id: "proposal.conflicting",
    state: "CONFLICTING",
    spans: [{ start: 0, end: 4, text: "test" }],
    rule_ids: ["rule.conflicting"],
    reason_key: "text.conflicting",
    facet_id: "safe",
  };

  await assert.rejects(
    () => confirmProposal(controller, ambiguous),
    /proposed/i,
  );
  await assert.rejects(
    () => confirmProposal(controller, conflicting),
    /proposed/i,
  );
  assert.deepEqual((await controller.view()).project, uiProject());
});

test("confirmation is idempotent and preserves foreign constraints", async () => {
  const base = uiProject();
  (base.facts as Record<string, unknown>[]).push({
    fact_id: "constraint.user.simple",
    dimension_id: "dimension.simple",
    scope: { kind: "component", component_id: "component.ui" },
    kind: "constraint",
    lifecycle: "target",
    state: "TRUE",
    strength: "MUST",
    operator: "EQ",
    value: { type: "boolean", value: true },
  });
  const controller = createUiController(config(base));
  const first = await confirmProposal(controller, proposed("safe", "yes"));
  const second = await confirmProposal(controller, proposed("safe", "yes"));
  assert.equal(encodeCanonical(second.project), encodeCanonical(first.project));
  assert(
    (second.project.facts as Record<string, unknown>[]).some(
      (fact) => fact.fact_id === "constraint.user.simple",
    ),
  );
});

test("confirm all is order-independent for distinct facets", async () => {
  const firstController = createUiController(config());
  const secondController = createUiController(config());
  const safe = proposed("safe", "yes");
  const simple = proposed("simple", "no");

  const first = await confirmProposals(firstController, [safe, simple]);
  const second = await confirmProposals(secondController, [simple, safe]);

  assert.equal(encodeCanonical(first.project), encodeCanonical(second.project));
  assert.deepEqual(first.trace, second.trace);
});

test("batch validation fails before mutation and opposing proposed options reject", async () => {
  const controller = createUiController(config());
  const invalid: TextProposal = {
    proposal_id: "proposal.invalid",
    state: "AMBIGUOUS",
    spans: [],
    rule_ids: ["rule.invalid"],
    reason_key: "text.invalid",
  };
  await assert.rejects(
    () => confirmProposals(controller, [proposed("safe", "yes"), invalid]),
    /proposed/i,
  );
  assert.deepEqual((await controller.view()).project, uiProject());

  await assert.rejects(
    () =>
      confirmProposals(controller, [
        proposed("safe", "yes"),
        proposed("safe", "no"),
      ]),
    /conflicting|facet/i,
  );
  assert.deepEqual((await controller.view()).project, uiProject());
});
