// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { validateReferences } from "../src/validation/references.ts";
import { bundle, claim, now, scope } from "./fixtures.ts";

const provenance = () => {
  const c = claim();
  return Object.fromEntries(
    [
      "source_ids",
      "verified_at",
      "world_freshness_class",
      "review_status",
      "test_refs",
      "supersedes",
    ].map((k) => [k, c[k]]),
  );
};
function relation() {
  return {
    schema_version: "0.1",
    relation_id: "relation.fixture",
    relation_type: "interaction",
    from_entity: "language.fixture",
    to_entity: "language.fixture",
    direction: "from-to",
    scenario: "Synthetic same-version API exchange",
    artifact_class: "incoming-code",
    state: "TRUE",
    value: { type: "boolean", value: true },
    conditions: [],
    from_scope: scope,
    to_scope: scope,
    ...provenance(),
  };
}
test("project conditions resolve dimensions and types", () => {
  for (const condition of [
    {
      dimension_id: "dimension.missing",
      operator: "EQ",
      value: { type: "boolean", value: true },
    },
    {
      dimension_id: "dimension.capability",
      operator: "EQ",
      value: { type: "string", value: "yes" },
    },
  ]) {
    const record = {
      schema_version: "0.1",
      project_id: "project.fixture",
      components: [],
      facts: [
        {
          fact_id: "fact.fixture",
          dimension_id: "dimension.capability",
          scope: { kind: "global" },
          kind: "fact",
          lifecycle: "target",
          state: "CONDITIONAL",
          value: { type: "boolean", value: true },
          conditions: [condition],
        },
      ],
      boundaries: [],
    };
    assert.throws(
      () =>
        validateReferences(
          [...bundle(), { kind: "project-facts", record }],
          now,
        ),
      /reference|type/,
    );
  }
});
test("relation endpoints have independent valid scopes", () =>
  validateReferences(
    [...bundle(), { kind: "relation", record: relation() }],
    now,
  ));
test("relation scope cannot exceed either endpoint", () => {
  for (const side of ["from_scope", "to_scope"])
    assert.throws(
      () =>
        validateReferences(
          [
            ...bundle(),
            {
              kind: "relation",
              record: {
                ...relation(),
                [side]: { versions: ["99"], targets: ["missing.platform"] },
              },
            },
          ],
          now,
        ),
      /scope/,
    );
});
test("analysis traces are not knowledge records", () =>
  assert.throws(
    () =>
      validateReferences(
        [
          ...bundle(),
          {
            kind: "decision-trace",
            record: {
              schema_version: "0.1",
              analysis_id: "analysis.fixture",
              evaluated_at: "2099-01-01T00:00:00Z",
              project_facts_sha256: "a".repeat(64),
              snapshot_sha256: "a".repeat(64),
              knowledge_snapshot: "fixture.knowledge",
              rules_snapshot: "fixture.rules",
              state: "RECOMMEND",
              results: [],
              unresolved_fact_ids: [],
              tie_breaker_ids: [],
            },
          },
        ],
        now,
      ),
    /Non-knowledge/,
  ));
test("supersession cycles fail", () => {
  const b = bundle();
  const c = b.at(3);
  assert(c);
  c.record.supersedes = ["claim.next"];
  b.push({
    kind: "claim",
    record: {
      ...claim(),
      claim_id: "claim.next",
      supersedes: ["claim.fixture"],
    },
  });
  assert.throws(() => validateReferences(b, now), /cycle/);
});
test("volatile evidence requires expiration", () => {
  const b = bundle();
  const c = b.at(3);
  assert(c);
  c.record.world_freshness_class = "volatile";
  assert.throws(() => validateReferences(b, now), /expiry/);
});
test("claim scope cannot exceed entity", () => {
  const b = bundle();
  const c = b.at(3);
  assert(c);
  c.record.scope = { versions: ["99"], targets: ["fixture.platform"] };
  assert.throws(() => validateReferences(b, now), /scope/);
});
