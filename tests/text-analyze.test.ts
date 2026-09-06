// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeText } from "../src/text/analyze.ts";
import { loadStage4Rules } from "../src/text/rules.ts";
import { PRODUCT_FACETS } from "../src/ui/product-facets.ts";
import gold from "./fixtures/stage4-text-gold.json" with { type: "json" };

const rules = loadStage4Rules(PRODUCT_FACETS);

function materialProposal(
  proposal: ReturnType<typeof analyzeText>["proposals"][number],
) {
  return {
    state: proposal.state,
    ...(proposal.facet_id ? { facet_id: proposal.facet_id } : {}),
    ...(proposal.option_id ? { option_id: proposal.option_id } : {}),
  };
}

for (const item of gold) {
  test(`gold corpus: ${item.id}`, () => {
    const analysis = analyzeText(item.input, rules, PRODUCT_FACETS);
    assert.deepEqual(analysis.proposals.map(materialProposal), item.expected);
  });
}

test("same-target matches dedupe while retaining all evidence", () => {
  const analysis = analyzeText(
    "GC required; must use garbage collection.",
    rules,
    PRODUCT_FACETS,
  );
  assert.equal(analysis.proposals.length, 1);
  const proposal = analysis.proposals[0];
  assert(proposal);
  assert.equal(proposal.state, "PROPOSED");
  assert.equal(proposal.rule_ids.length, 2);
  assert.equal(proposal.spans.length, 2);
});

test("source spans quote exact original input", () => {
  const input = "Prefix: GC required. Suffix.";
  const analysis = analyzeText(input, rules, PRODUCT_FACETS);
  const proposal = analysis.proposals[0];
  assert(proposal);
  assert.deepEqual(proposal.spans, [
    { start: 8, end: 19, text: "GC required" },
  ]);
});

test("opposing same-facet matches become one non-applicable conflict", () => {
  const analysis = analyzeText(
    "GC required, but must not use GC.",
    rules,
    PRODUCT_FACETS,
  );
  assert.equal(analysis.proposals.length, 1);
  const proposal = analysis.proposals[0];
  assert(proposal);
  assert.equal(proposal.state, "CONFLICTING");
  assert.equal(proposal.facet_id, "runtime-garbage-collection");
  assert.equal(proposal.option_id, undefined);
  assert.equal(proposal.value, undefined);
});

test("ambiguity has no canonical target", () => {
  const analysis = analyzeText("GC optional.", rules, PRODUCT_FACETS);
  const proposal = analysis.proposals[0];
  assert(proposal);
  assert.equal(proposal.state, "AMBIGUOUS");
  assert.equal(proposal.facet_id, undefined);
  assert.equal(proposal.option_id, undefined);
});

test("analysis is deterministic including ordering and proposal IDs", () => {
  const input = "Must emit JavaScript. GC required.";
  const first = analyzeText(input, rules, PRODUCT_FACETS);
  const second = analyzeText(input, rules, PRODUCT_FACETS);
  assert.deepEqual(first, second);
  assert.equal(first.proposals.length, 2);
  assert.equal(first.proposals[0]?.facet_id, "emits-javascript");
  assert.equal(first.proposals[1]?.facet_id, "runtime-garbage-collection");
});

test("zero matches and empty input are valid abstention", () => {
  assert.deepEqual(analyzeText("", rules, PRODUCT_FACETS), { proposals: [] });
  assert.deepEqual(
    analyzeText("Nothing relevant here.", rules, PRODUCT_FACETS),
    { proposals: [] },
  );
});

test("oversized input is rejected before matching", () => {
  assert.throws(
    () => analyzeText("a".repeat(16 * 1024 + 1), rules, PRODUCT_FACETS),
    /16 kib|limit|bytes/i,
  );
});
