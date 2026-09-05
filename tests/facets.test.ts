// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { facetCounts } from "../src/decision/facets.ts";
import type { Document } from "../src/validation/documents.ts";

const yes = { type: "boolean" as const, value: true };
const no = { type: "boolean" as const, value: false };
const source = {
  schema_version: "0.1",
  source_id: "source.facets",
  source_class: "reproducible-test",
  reference: "urn:plldn:facets",
  title: "Facet fixture",
  retrieved_at: "2026-09-01T00:00:00Z",
  content_sha256: "d".repeat(64),
};
function entity(id: string): Document {
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
function claim(id: string, entityId: string, state: string): Document {
  const record: Record<string, unknown> = {
    schema_version: "0.1",
    claim_id: id,
    entity_id: entityId,
    dimension_id: "dimension.safe",
    state,
    conditions: [],
    scope: { versions: ["1.0"], targets: ["target.generic"] },
    source_ids: [source.source_id],
    verified_at: "2026-09-01T00:00:00Z",
    world_freshness_class: "version-bound",
    review_status: "Reviewed",
    test_refs: [`test.${id}`],
    supersedes: [],
  };
  if (state !== "UNKNOWN") record.value = yes;
  return { kind: "claim", record };
}
function knowledge(): Document[] {
  return [
    { kind: "source", record: source },
    {
      kind: "dimension",
      record: {
        schema_version: "0.1",
        dimension_id: "dimension.safe",
        canonical_name: "Safe",
        value_type: "boolean",
        category: "assurance",
        unit: null,
        allowed_values: [],
      },
    },
    entity("language.alpha"),
    entity("language.beta"),
    entity("language.gamma"),
    claim("claim.alpha.safe", "language.alpha", "TRUE"),
    claim("claim.beta.safe", "language.beta", "FALSE"),
    claim("claim.gamma.safe", "language.gamma", "UNKNOWN"),
  ];
}
function project(): Record<string, unknown> & {
  facts: Record<string, unknown>[];
} {
  return {
    schema_version: "0.1",
    project_id: "project.facets",
    components: [{ component_id: "component.api", form: "backend-api" }],
    facts: [],
    boundaries: [],
  };
}
function request(projectFacts: Record<string, unknown>) {
  return {
    project: projectFacts,
    knowledge: knowledge(),
    candidateType: "language" as const,
    componentId: "component.api",
    evaluatedAt: "2026-09-05T12:00:00Z",
    knowledgeSnapshot: "knowledge.facets",
    rulesSnapshot: "rules.facets",
    snapshotSha256: "e".repeat(64),
  };
}

test("facet counts preview hard constraints without mutating the project", async () => {
  const p = project();
  const before = JSON.stringify(p);
  const counts = await facetCounts(request(p), "dimension.safe", [yes, no]);
  assert.equal(JSON.stringify(p), before);
  assert.deepEqual(counts, [
    {
      value: yes,
      eligible: 1,
      excluded: 1,
      unresolved: 1,
      decision_state: "RECOMMEND",
    },
    {
      value: no,
      eligible: 1,
      excluded: 1,
      unresolved: 1,
      decision_state: "RECOMMEND",
    },
  ]);
});

test("facet preview does not collide with an existing synthetic-style fact id", async () => {
  const p = project();
  p.facts.push({
    fact_id: "facet.preview",
    dimension_id: "dimension.safe",
    scope: { kind: "component", component_id: "component.api" },
    kind: "constraint",
    lifecycle: "target",
    state: "TRUE",
    strength: "NEUTRAL",
    operator: "EQ",
    value: yes,
  });
  const counts = await facetCounts(request(p), "dimension.safe", [yes]);
  assert.equal(counts[0]?.eligible, 1);
});
