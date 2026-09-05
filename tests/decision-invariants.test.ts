// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDecision } from "../src/decision/evaluate.ts";
import type { Document } from "../src/validation/documents.ts";

const at = "2026-09-05T12:00:00Z";
const source = {
  schema_version: "0.1",
  source_id: "source.decision-fixture",
  source_class: "reproducible-test",
  reference: "urn:plldn:decision-fixture",
  title: "Decision fixture",
  retrieved_at: "2026-09-01T00:00:00Z",
  content_sha256: "b".repeat(64),
};
function dimension(
  id: string,
  valueType: string,
  allowedValues: string[] = [],
): Document {
  return {
    kind: "dimension",
    record: {
      schema_version: "0.1",
      dimension_id: id,
      canonical_name: id,
      value_type: valueType,
      category: "assurance",
      unit: null,
      allowed_values: allowedValues,
    },
  };
}
function language(id: string): Document {
  return {
    kind: "entity",
    record: {
      schema_version: "0.1",
      entity_id: id,
      entity_type: "language",
      canonical_name: id,
      aliases: [],
      version_scope: ["1.0"],
      target_scope: ["target.generic"],
    },
  };
}
function assertion(
  id: string,
  entityId: string,
  dimensionId: string,
  state: string,
  value?: Record<string, unknown>,
  conditions: Record<string, unknown>[] = [],
): Document {
  const record: Record<string, unknown> = {
    schema_version: "0.1",
    claim_id: id,
    entity_id: entityId,
    dimension_id: dimensionId,
    state,
    conditions,
    scope: { versions: ["1.0"], targets: ["target.generic"] },
    source_ids: [source.source_id],
    verified_at: "2026-09-01T00:00:00Z",
    world_freshness_class: "version-bound",
    review_status: "Reviewed",
    test_refs: [`test.${id}`],
    supersedes: [],
  };
  if (value !== undefined) record.value = value;
  return { kind: "claim", record };
}
const yes = { type: "boolean", value: true };
function project(constraints: Record<string, unknown>[]): Record<
  string,
  unknown
> & {
  facts: Record<string, unknown>[];
} {
  return {
    schema_version: "0.1",
    project_id: "project.decision",
    components: [{ component_id: "component.api", form: "backend-api" }],
    facts: constraints.map((x, i) => ({
      fact_id: `fact.${i}`,
      dimension_id: x.dimension_id,
      scope: { kind: "component", component_id: "component.api" },
      kind: "constraint",
      lifecycle: "target",
      state: "TRUE",
      strength: x.strength ?? "MUST",
      operator: x.operator ?? "EQ",
      value: x.value,
    })),
    boundaries: [],
  };
}
function knowledge(claims: Document[], extra: Document[] = []): Document[] {
  return [
    { kind: "source", record: source },
    dimension("dimension.safe", "boolean"),
    dimension("dimension.simple", "boolean"),
    dimension("dimension.fast", "boolean"),
    dimension("dimension.score", "integer"),
    dimension("dimension.targets", "set", ["linux", "windows", "browser"]),
    language("language.alpha"),
    language("language.beta"),
    language("language.gamma"),
    ...claims,
    ...extra,
  ];
}
function request(projectFacts: Record<string, unknown>, docs: Document[]) {
  return {
    project: projectFacts,
    knowledge: docs,
    candidateType: "language" as const,
    componentId: "component.api",
    evaluatedAt: at,
    knowledgeSnapshot: "knowledge.fixture",
    rulesSnapshot: "rules.fixture",
    snapshotSha256: "c".repeat(64),
  };
}
function byId(
  result: Awaited<ReturnType<typeof evaluateDecision>>,
  id: string,
) {
  const candidate = result.candidates.find((x) => x.candidate_id === id);
  assert(candidate);
  return candidate;
}

function rule(
  id: string,
  effect: string,
  claimIds: string[],
  conditions: Record<string, unknown>[],
  appliesTo = ["backend-api"],
): Document {
  return {
    kind: "rule",
    record: {
      schema_version: "0.1",
      rule_id: id,
      effect,
      applies_to: appliesTo,
      conditions,
      claim_ids: claimIds,
      relation_ids: [],
      risk: ["EXCLUDE", "REQUIRE"].includes(effect) ? "very-high" : "medium",
      source_ids: [source.source_id],
      verified_at: "2026-09-01T00:00:00Z",
      world_freshness_class: "version-bound",
      review_status: "Reviewed",
      test_refs: [`test.${id}`],
      supersedes: [],
    },
  };
}
function contextFact(
  id: string,
  dimensionId: string,
  value: Record<string, unknown>,
) {
  return {
    fact_id: id,
    dimension_id: dimensionId,
    scope: { kind: "component", component_id: "component.api" },
    kind: "fact",
    lifecycle: "target",
    state: "TRUE",
    value,
  };
}

test("inapplicable conditional claims remain unknown, not negative evidence", async () => {
  const conditional = assertion(
    "claim.alpha.safe.conditional",
    "language.alpha",
    "dimension.safe",
    "CONDITIONAL",
    yes,
    [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
  );
  const docs = knowledge([
    conditional,
    assertion(
      "claim.beta.safe",
      "language.beta",
      "dimension.safe",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.gamma.safe",
      "language.gamma",
      "dimension.safe",
      "FALSE",
      yes,
    ),
  ]);
  const p = project([
    { dimension_id: "dimension.safe", value: yes, strength: "MUST" },
  ]);
  p.facts.push(
    contextFact("fact.fast", "dimension.fast", {
      type: "boolean",
      value: false,
    }),
  );
  const result = await evaluateDecision(request(p, docs));
  assert.equal(byId(result, "language.alpha").status, "UNRESOLVED");
  assert.deepEqual(byId(result, "language.alpha").claim_ids, []);
  assert.equal(result.trace.state, "INSUFFICIENT_INFORMATION");
});

test("inapplicable conditional project facts do not become false facts", async () => {
  const docs = knowledge(
    [
      assertion(
        "claim.alpha.safe",
        "language.alpha",
        "dimension.safe",
        "TRUE",
        yes,
      ),
      assertion(
        "claim.beta.safe",
        "language.beta",
        "dimension.safe",
        "TRUE",
        yes,
      ),
      assertion(
        "claim.gamma.safe",
        "language.gamma",
        "dimension.safe",
        "TRUE",
        yes,
      ),
    ],
    [
      rule(
        "rule.ask-simple",
        "ASK",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.simple", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(
    contextFact("fact.fast", "dimension.fast", {
      type: "boolean",
      value: false,
    }),
  );
  p.facts.push({
    fact_id: "fact.simple.conditional",
    dimension_id: "dimension.simple",
    scope: { kind: "component", component_id: "component.api" },
    kind: "fact",
    lifecycle: "target",
    state: "CONDITIONAL",
    value: yes,
    conditions: [
      { dimension_id: "dimension.fast", operator: "EQ", value: yes },
    ],
  });
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "NEEDS_ONE_FACT");
  assert.deepEqual(result.trace.unresolved_dimension_ids, ["dimension.simple"]);
});

test("conditional contradictory hard constraints become CONFLICT when activated", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.safe",
      "language.alpha",
      "dimension.safe",
      "TRUE",
      yes,
    ),
    assertion(
      "claim.beta.safe",
      "language.beta",
      "dimension.safe",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.gamma.safe",
      "language.gamma",
      "dimension.safe",
      "UNKNOWN",
    ),
  ]);
  const p = project([
    { dimension_id: "dimension.safe", value: yes, strength: "MUST" },
    {
      dimension_id: "dimension.safe",
      value: { type: "boolean", value: false },
      strength: "MUST",
    },
  ]);
  for (const fact of p.facts) {
    fact.state = "CONDITIONAL";
    fact.conditions = [
      { dimension_id: "dimension.fast", operator: "EQ", value: yes },
    ];
  }
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "CONFLICT");
});
test("inactive preference rules do not leak evidence into candidate traces", async () => {
  const alpha = assertion(
    "claim.alpha.safe",
    "language.alpha",
    "dimension.safe",
    "TRUE",
    yes,
  );
  const docs = knowledge(
    [
      alpha,
      assertion(
        "claim.beta.safe",
        "language.beta",
        "dimension.safe",
        "TRUE",
        yes,
      ),
      assertion(
        "claim.gamma.safe",
        "language.gamma",
        "dimension.safe",
        "TRUE",
        yes,
      ),
    ],
    [
      rule(
        "rule.prefer-alpha",
        "PREFER",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(
    contextFact("fact.fast", "dimension.fast", {
      type: "boolean",
      value: false,
    }),
  );
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "ALTERNATIVES");
  for (const candidate of result.candidates) {
    assert.deepEqual(candidate.rule_ids, []);
    assert.deepEqual(candidate.preferences, {});
  }
  assert.deepEqual(result.trace.results[0]?.rule_ids, []);
});

test("project constraints never masquerade as factual rule conditions", async () => {
  const alpha = assertion(
    "claim.alpha.safe",
    "language.alpha",
    "dimension.safe",
    "TRUE",
    yes,
  );
  const docs = knowledge(
    [
      alpha,
      assertion(
        "claim.beta.safe",
        "language.beta",
        "dimension.safe",
        "TRUE",
        yes,
      ),
      assertion(
        "claim.gamma.safe",
        "language.gamma",
        "dimension.safe",
        "TRUE",
        yes,
      ),
    ],
    [
      rule(
        "rule.exclude-alpha-when-fast",
        "EXCLUDE",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([
    { dimension_id: "dimension.fast", value: yes, strength: "PREFER" },
  ]);
  const result = await evaluateDecision(request(p, docs));
  assert.equal(byId(result, "language.alpha").status, "UNRESOLVED");
  assert.deepEqual(byId(result, "language.alpha").exclusions, []);
  assert.deepEqual(byId(result, "language.alpha").unresolved, [
    "rule.exclude-alpha-when-fast",
  ]);
});

test("active rules cannot silently target superseded claims", async () => {
  const oldClaim = assertion(
    "claim.alpha.safe.old",
    "language.alpha",
    "dimension.safe",
    "TRUE",
    yes,
  );
  const newClaim = assertion(
    "claim.alpha.safe.new",
    "language.alpha",
    "dimension.safe",
    "TRUE",
    yes,
  );
  newClaim.record.supersedes = ["claim.alpha.safe.old"];
  const docs = knowledge(
    [
      oldClaim,
      newClaim,
      assertion(
        "claim.beta.safe",
        "language.beta",
        "dimension.safe",
        "TRUE",
        yes,
      ),
      assertion(
        "claim.gamma.safe",
        "language.gamma",
        "dimension.safe",
        "TRUE",
        yes,
      ),
    ],
    [
      rule(
        "rule.exclude-alpha",
        "EXCLUDE",
        ["claim.alpha.safe.old"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  await assert.rejects(() => evaluateDecision(request(p, docs)), /superseded/i);
});
