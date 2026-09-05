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

function license(id: string, spdx: string): Document {
  return {
    kind: "entity",
    record: {
      schema_version: "0.1",
      entity_id: id,
      entity_type: "license",
      canonical_name: id,
      aliases: [],
      version_scope: ["1.0"],
      target_scope: ["target.generic"],
      license_id: spdx,
    },
  };
}

test("disjoint active REQUIRE rules are a hard rule CONFLICT", async () => {
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
  const condition = [
    { dimension_id: "dimension.fast", operator: "EQ", value: yes },
  ];
  const docs = knowledge(claims, [
    rule("rule.require-alpha", "REQUIRE", ["claim.alpha.safe"], condition),
    rule("rule.require-beta", "REQUIRE", ["claim.beta.safe"], condition),
  ]);
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "CONFLICT");
  assert.deepEqual(result.trace.results, []);
});

test("all hard evidence UNKNOWN yields INSUFFICIENT_INFORMATION", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.safe",
      "language.alpha",
      "dimension.safe",
      "UNKNOWN",
    ),
    assertion("claim.beta.safe", "language.beta", "dimension.safe", "UNKNOWN"),
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
  assert.equal(result.trace.state, "INSUFFICIENT_INFORMATION");
  assert.deepEqual(result.trace.results, []);
});

test("missing candidate entity type yields UNSUPPORTED rather than a guess", async () => {
  const docs = knowledge([]);
  const input = request(project([]), docs);
  const result = await evaluateDecision({ ...input, candidateType: "runtime" });
  assert.equal(result.trace.state, "UNSUPPORTED");
  assert.deepEqual(result.candidates, []);
});

test("superseded candidate claims cannot influence the current decision", async () => {
  const old = assertion(
    "claim.alpha.old",
    "language.alpha",
    "dimension.safe",
    "FALSE",
    yes,
  );
  const current = assertion(
    "claim.alpha.current",
    "language.alpha",
    "dimension.safe",
    "TRUE",
    yes,
  );
  current.record.supersedes = ["claim.alpha.old"];
  const docs = knowledge([
    old,
    current,
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
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["language.alpha"]);
  assert(!byId(result, "language.alpha").claim_ids.includes("claim.alpha.old"));
});

test("project-level rules support outgoing license decisions", async () => {
  const euplClaim = assertion(
    "claim.eupl.safe",
    "license.eupl",
    "dimension.safe",
    "TRUE",
    yes,
  );
  const mitClaim = assertion(
    "claim.mit.safe",
    "license.mit",
    "dimension.safe",
    "TRUE",
    yes,
  );
  const docs: Document[] = [
    { kind: "source", record: source },
    dimension("dimension.safe", "boolean"),
    dimension("dimension.fast", "boolean"),
    license("license.eupl", "EUPL-1.2"),
    license("license.mit", "MIT"),
    euplClaim,
    mitClaim,
    rule(
      "rule.prefer-eupl",
      "PREFER",
      ["claim.eupl.safe"],
      [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ["project"],
    ),
  ];
  const p = project([]);
  p.facts = [
    {
      fact_id: "fact.fast",
      dimension_id: "dimension.fast",
      scope: { kind: "global" },
      kind: "fact",
      lifecycle: "target",
      state: "TRUE",
      value: yes,
    },
  ];
  const base = request(p, docs);
  const result = await evaluateDecision({
    ...base,
    candidateType: "license",
    componentId: null,
  });
  assert.equal(result.trace.state, "RECOMMEND");
  assert.deepEqual(result.trace.results[0]?.candidate_ids, ["license.eupl"]);
});

test("one unresolved ASK dimension produces NEEDS_ONE_FACT", async () => {
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
        "rule.ask-fast",
        "ASK",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const result = await evaluateDecision(request(project([]), docs));
  assert.equal(result.trace.state, "NEEDS_ONE_FACT");
  assert.deepEqual(result.trace.unresolved_dimension_ids, ["dimension.fast"]);
});

test("multiple unresolved ASK dimensions abstain as INSUFFICIENT_INFORMATION", async () => {
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
  const docs = knowledge(claims, [
    rule(
      "rule.ask-fast",
      "ASK",
      ["claim.alpha.safe"],
      [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
    ),
    rule(
      "rule.ask-simple",
      "ASK",
      ["claim.alpha.safe"],
      [{ dimension_id: "dimension.simple", operator: "EQ", value: yes }],
    ),
  ]);
  const result = await evaluateDecision(request(project([]), docs));
  assert.equal(result.trace.state, "INSUFFICIENT_INFORMATION");
  assert.deepEqual(result.trace.unresolved_dimension_ids, [
    "dimension.fast",
    "dimension.simple",
  ]);
});

test("resolved ASK conditions do not force a question", async () => {
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
        "rule.ask-fast",
        "ASK",
        ["claim.alpha.safe"],
        [{ dimension_id: "dimension.fast", operator: "EQ", value: yes }],
      ),
    ],
  );
  const p = project([]);
  p.facts.push(contextFact("fact.fast", "dimension.fast", yes));
  const result = await evaluateDecision(request(p, docs));
  assert.equal(result.trace.state, "ALTERNATIVES");
  assert.deepEqual(result.trace.unresolved_dimension_ids, []);
});

test("contradictory ordered hard constraints are a project CONFLICT", async () => {
  const docs = knowledge([
    assertion(
      "claim.alpha.score",
      "language.alpha",
      "dimension.score",
      "TRUE",
      { type: "integer", value: 7 },
    ),
    assertion("claim.beta.score", "language.beta", "dimension.score", "TRUE", {
      type: "integer",
      value: 11,
    }),
    assertion(
      "claim.gamma.score",
      "language.gamma",
      "dimension.score",
      "TRUE",
      { type: "integer", value: 3 },
    ),
  ]);
  const result = await evaluateDecision(
    request(
      project([
        {
          dimension_id: "dimension.score",
          value: { type: "integer", value: 10 },
          strength: "MUST",
          operator: "GTE",
        },
        {
          dimension_id: "dimension.score",
          value: { type: "integer", value: 5 },
          strength: "MUST",
          operator: "LTE",
        },
      ]),
      docs,
    ),
  );
  assert.equal(result.trace.state, "CONFLICT");
  assert.deepEqual(result.trace.results, []);
});
