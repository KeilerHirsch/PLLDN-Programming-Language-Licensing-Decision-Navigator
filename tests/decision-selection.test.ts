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

test("MUST excludes disproved candidates and quarantines UNKNOWN", async () => {
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
  const result = await evaluateDecision(
    request(
      project([
        { dimension_id: "dimension.safe", value: yes, strength: "MUST" },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "RECOMMEND");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["language.alpha"]);
  assert.equal(byId(result, "language.alpha").status, "ELIGIBLE");
  assert.equal(byId(result, "language.beta").status, "EXCLUDED");
  assert.equal(byId(result, "language.gamma").status, "UNRESOLVED");
});

test("PREFER selects a unique Pareto winner without a scalar score", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.simple",
      "language.alpha",
      "dimension.simple",
      "TRUE",
      yes,
    ),
    assertion(
      "claim.beta.simple",
      "language.beta",
      "dimension.simple",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.gamma.simple",
      "language.gamma",
      "dimension.simple",
      "FALSE",
      yes,
    ),
  ]);
  const result = await evaluateDecision(
    request(
      project([
        { dimension_id: "dimension.simple", value: yes, strength: "PREFER" },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "RECOMMEND");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["language.alpha"]);
  assert.equal(
    byId(result, "language.alpha").preferences["fact.0"],
    "SATISFIED",
  );
  assert.equal(
    byId(result, "language.beta").preferences["fact.0"],
    "UNSATISFIED",
  );
});

test("missing preference evidence cannot be used to dominate a candidate", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.simple",
      "language.alpha",
      "dimension.simple",
      "TRUE",
      yes,
    ),
    assertion(
      "claim.beta.simple",
      "language.beta",
      "dimension.simple",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.gamma.simple",
      "language.gamma",
      "dimension.simple",
      "UNKNOWN",
    ),
  ]);
  const result = await evaluateDecision(
    request(
      project([
        { dimension_id: "dimension.simple", value: yes, strength: "PREFER" },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "ALTERNATIVES");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, [
    "language.alpha",
    "language.gamma",
  ]);
});

test("opposed preferences remain alternatives", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.simple",
      "language.alpha",
      "dimension.simple",
      "TRUE",
      yes,
    ),
    assertion(
      "claim.alpha.fast",
      "language.alpha",
      "dimension.fast",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.beta.simple",
      "language.beta",
      "dimension.simple",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.beta.fast",
      "language.beta",
      "dimension.fast",
      "TRUE",
      yes,
    ),
    assertion(
      "claim.gamma.simple",
      "language.gamma",
      "dimension.simple",
      "FALSE",
      yes,
    ),
    assertion(
      "claim.gamma.fast",
      "language.gamma",
      "dimension.fast",
      "FALSE",
      yes,
    ),
  ]);
  const result = await evaluateDecision(
    request(
      project([
        { dimension_id: "dimension.simple", value: yes, strength: "PREFER" },
        { dimension_id: "dimension.fast", value: yes, strength: "PREFER" },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "ALTERNATIVES");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, [
    "language.alpha",
    "language.beta",
  ]);
});
test("contradictory hard constraints fail as project CONFLICT", async () => {
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
  const result = await evaluateDecision(
    request(
      project([
        { dimension_id: "dimension.safe", value: yes, strength: "MUST" },
        { dimension_id: "dimension.safe", value: yes, strength: "FORBIDDEN" },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "CONFLICT");
  assert.deepEqual(result.trace.results, []);
});

test("hard EXCLUDE rule applies only when its project condition is proven", async () => {
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
        "rule.exclude-alpha",
        "EXCLUDE",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(byId(result, "language.alpha").status, "EXCLUDED");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, [
    "language.beta",
    "language.gamma",
  ]);
});

test("unknown hard-rule condition quarantines only targeted candidates", async () => {
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
        "rule.exclude-alpha",
        "EXCLUDE",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const result = await evaluateDecision(request(project([]), docs));
  assert.equal(byId(result, "language.alpha").status, "UNRESOLVED");
  assert.equal(byId(result, "language.beta").status, "ELIGIBLE");
});

test("conditional claims are resolved from explicit project facts", async () => {
  const conditional = assertion(
    "claim.alpha.safe",
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
      "UNKNOWN",
    ),
  ]);
  const p = project([
    { dimension_id: "dimension.safe", value: yes, strength: "MUST" },
  ]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(byId(result, "language.alpha").status, "ELIGIBLE");
  assert.equal(result.trace.state, "RECOMMEND");
});

test("candidate ordering and trace identity are input-order invariant", async () => {
  const claims = [
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
  ];
  const p = project([
    { dimension_id: "dimension.safe", value: yes, strength: "MUST" },
  ]);
  const a = await evaluateDecision(request(p, knowledge(claims)));
  const b = await evaluateDecision(
    request(p, knowledge([...claims].reverse())),
  );
  assert.deepEqual(a.trace, b.trace);
  assert.deepEqual(a.candidates, b.candidates);
});

test("GTE constraints use ordered numeric capability evidence", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.score",
      "language.alpha",
      "dimension.score",
      "TRUE",
      { type: "integer", value: 10 },
    ),
    assertion("claim.beta.score", "language.beta", "dimension.score", "TRUE", {
      type: "integer",
      value: 5,
    }),
    assertion(
      "claim.gamma.score",
      "language.gamma",
      "dimension.score",
      "UNKNOWN",
    ),
  ]);
  const result = await evaluateDecision(
    request(
      project([
        {
          dimension_id: "dimension.score",
          value: { type: "integer", value: 8 },
          strength: "MUST",
          operator: "GTE",
        },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "RECOMMEND");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["language.alpha"]);
});

test("IN set constraints require every selected capability", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.targets",
      "language.alpha",
      "dimension.targets",
      "TRUE",
      { type: "set", value: ["linux", "windows"] },
    ),
    assertion(
      "claim.beta.targets",
      "language.beta",
      "dimension.targets",
      "TRUE",
      { type: "set", value: ["linux"] },
    ),
    assertion(
      "claim.gamma.targets",
      "language.gamma",
      "dimension.targets",
      "UNKNOWN",
    ),
  ]);
  const result = await evaluateDecision(
    request(
      project([
        {
          dimension_id: "dimension.targets",
          value: { type: "set", value: ["linux", "windows"] },
          strength: "MUST",
          operator: "IN",
        },
      ]),
      docs,
    ),
  );
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["language.alpha"]);
});
