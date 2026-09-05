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

test("PREFER rules influence Pareto selection without excluding candidates", async () => {
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
        "rule.prefer-alpha",
        "PREFER",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "RECOMMEND");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["language.alpha"]);
  assert(
    result.candidates.every((candidate) => candidate.exclusions.length === 0),
  );
});

test("PENALIZE rules demote targeted candidates without hard exclusion", async () => {
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
        "rule.penalize-alpha",
        "PENALIZE",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "ALTERNATIVES");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, [
    "language.beta",
    "language.gamma",
  ]);
  assert.equal(byId(result, "language.alpha").status, "ELIGIBLE");
});
test("WARN rules attach evidence without changing eligibility or ranking", async () => {
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
        "rule.warn-alpha",
        "WARN",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "ALTERNATIVES");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, [
    "language.alpha",
    "language.beta",
    "language.gamma",
  ]);
  assert.deepEqual(byId(result, "language.alpha").rule_ids, [
    "rule.warn-alpha",
  ]);
  assert.deepEqual(byId(result, "language.beta").rule_ids, []);
  assert.deepEqual(byId(result, "language.alpha").preferences, {});
});

test("NO_EFFECT rules are trace-neutral", async () => {
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
        "rule.no-effect",
        "NO_EFFECT",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "ALTERNATIVES");
  assert(
    result.candidates.every((candidate) => candidate.rule_ids.length === 0),
  );
  assert.deepEqual(result.trace.results[0]?.rule_ids, []);
});

test("component-scoped facts never leak into sibling decisions", async () => {
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
        ["backend-api", "worker"],
      ),
    ],
  );
  const p = project([]);
  (p.components as Record<string, unknown>[]).push({
    component_id: "component.worker",
    form: "worker",
  });
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const api = await evaluateDecision(request(p, docs));
  const worker = await evaluateDecision({
    ...request(p, docs),
    componentId: "component.worker",
  });
  assert.equal(byId(api, "language.alpha").status, "EXCLUDED");
  assert.equal(byId(worker, "language.alpha").status, "UNRESOLVED");
  assert.deepEqual(byId(worker, "language.alpha").exclusions, []);
});
