// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
export const now = "2026-09-05T12:00:00Z";
export const scope = { versions: ["1.0"], targets: ["fixture.platform"] };
export function entity(id = "language.fixture"): Record<string, unknown> {
  return {
    schema_version: "0.1",
    entity_id: id,
    entity_type: "language",
    canonical_name: "Fixture language",
    aliases: [],
    version_scope: ["1.0"],
    target_scope: ["fixture.platform"],
  };
}
export function claim(): Record<string, unknown> {
  return {
    schema_version: "0.1",
    claim_id: "claim.fixture",
    entity_id: "language.fixture",
    dimension_id: "dimension.capability",
    value: { type: "boolean", value: true },
    state: "TRUE",
    conditions: [],
    scope,
    source_ids: ["source.fixture"],
    verified_at: "2026-09-01T00:00:00Z",
    world_freshness_class: "version-bound",
    review_status: "Reviewed",
    test_refs: ["test.fixture"],
    supersedes: [],
  };
}
export function project() {
  return {
    schema_version: "0.1",
    project_id: "project.fixture",
    components: [{ component_id: "component.ui", form: "browser-ui" }],
    facts: [
      {
        fact_id: "fact.platform",
        dimension_id: "dimension.capability",
        scope: { kind: "component", component_id: "component.ui" },
        kind: "fact",
        lifecycle: "target",
        state: "TRUE",
        value: { type: "boolean", value: true },
      },
    ],
    boundaries: [],
  };
}
export function bundle(): { kind: string; record: Record<string, unknown> }[] {
  return [
    { kind: "entity", record: entity() },
    {
      kind: "dimension",
      record: {
        schema_version: "0.1",
        dimension_id: "dimension.capability",
        canonical_name: "Fixture capability",
        value_type: "boolean",
        category: "integration",
        unit: null,
        allowed_values: [],
      },
    },
    {
      kind: "source",
      record: {
        schema_version: "0.1",
        source_id: "source.fixture",
        source_class: "reproducible-test",
        reference: "urn:plldn:fixture",
        title: "Synthetic fixture only",
        retrieved_at: "2026-09-01T00:00:00Z",
        content_sha256: "a".repeat(64),
      },
    },
    { kind: "claim", record: claim() },
  ];
}
