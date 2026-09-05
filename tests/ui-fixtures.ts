// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

import type { FacetDefinition } from "../src/ui/types.ts";
import type { Document } from "../src/validation/documents.ts";

export const uiAt = "2026-09-05T12:00:00Z";
const source = {
  schema_version: "0.1",
  source_id: "source.ui-fixture",
  source_class: "reproducible-test",
  reference: "urn:plldn:ui-fixture",
  title: "Synthetic UI fixture",
  retrieved_at: "2026-09-01T00:00:00Z",
  content_sha256: "d".repeat(64),
};

function dimension(id: string): Document {
  return {
    kind: "dimension",
    record: {
      schema_version: "0.1",
      dimension_id: id,
      canonical_name: id,
      value_type: "boolean",
      category: "integration",
      unit: null,
      allowed_values: [],
    },
  };
}
function language(id: string, label: string): Document {
  return {
    kind: "entity",
    record: {
      schema_version: "0.1",
      entity_id: id,
      entity_type: "language",
      canonical_name: label,
      aliases: [],
      version_scope: ["1.0"],
      target_scope: ["target.ui"],
    },
  };
}

function claim(
  id: string,
  entityId: string,
  dimensionId: string,
  state: "TRUE" | "UNKNOWN",
  value?: boolean,
): Document {
  const record: Record<string, unknown> = {
    schema_version: "0.1",
    claim_id: id,
    entity_id: entityId,
    dimension_id: dimensionId,
    state,
    conditions: [],
    scope: { versions: ["1.0"], targets: ["target.ui"] },
    source_ids: [source.source_id],
    verified_at: "2026-09-01T00:00:00Z",
    world_freshness_class: "version-bound",
    review_status: "Reviewed",
    test_refs: [`test.${id}`],
    supersedes: [],
  };
  if (value !== undefined) record.value = { type: "boolean", value };
  return { kind: "claim", record };
}
export function uiKnowledge(): Document[] {
  return [
    { kind: "source", record: source },
    dimension("dimension.safe"),
    dimension("dimension.simple"),
    language("language.alpha", "Zeta"),
    language("language.beta", "Alpha"),
    language("language.gamma", "Gamma"),
    claim("claim.alpha.safe", "language.alpha", "dimension.safe", "TRUE", true),
    claim("claim.beta.safe", "language.beta", "dimension.safe", "TRUE", false),
    claim("claim.gamma.safe", "language.gamma", "dimension.safe", "UNKNOWN"),
    claim(
      "claim.alpha.simple",
      "language.alpha",
      "dimension.simple",
      "TRUE",
      true,
    ),
    claim(
      "claim.beta.simple",
      "language.beta",
      "dimension.simple",
      "TRUE",
      true,
    ),
    claim(
      "claim.gamma.simple",
      "language.gamma",
      "dimension.simple",
      "TRUE",
      false,
    ),
  ];
}

export function uiProject(): Record<string, unknown> {
  return {
    schema_version: "0.1",
    project_id: "project.ui",
    components: [{ component_id: "component.ui", form: "browser-ui" }],
    facts: [],
    boundaries: [],
  };
}
export const uiFacets: readonly FacetDefinition[] = [
  {
    facet_id: "safe",
    label: "Memory safe",
    group: "Runtime",
    dimension_id: "dimension.safe",
    operator: "EQ",
    strength: "MUST",
    options: [
      {
        option_id: "yes",
        label: "Yes",
        value: { type: "boolean", value: true },
      },
      {
        option_id: "no",
        label: "No",
        value: { type: "boolean", value: false },
      },
    ],
  },
  {
    facet_id: "simple",
    label: "Simple",
    group: "Ergonomics",
    dimension_id: "dimension.simple",
    operator: "EQ",
    strength: "PREFER",
    options: [
      {
        option_id: "yes",
        label: "Prefer",
        value: { type: "boolean", value: true },
      },
      {
        option_id: "no",
        label: "Avoid",
        value: { type: "boolean", value: false },
      },
    ],
  },
];
