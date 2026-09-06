// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import claim from "../../schemas/claim.schema.json" with { type: "json" };
import common from "../../schemas/common.schema.json" with { type: "json" };
import decisionTrace from "../../schemas/decision-trace.schema.json" with {
  type: "json",
};
import dimension from "../../schemas/dimension.schema.json" with {
  type: "json",
};
import entity from "../../schemas/entity.schema.json" with { type: "json" };
import projectFacts from "../../schemas/project-facts.schema.json" with {
  type: "json",
};
import relation from "../../schemas/relation.schema.json" with { type: "json" };
import review from "../../schemas/review.schema.json" with { type: "json" };
import rule from "../../schemas/rule.schema.json" with { type: "json" };
import snapshot from "../../schemas/snapshot.schema.json" with { type: "json" };
import source from "../../schemas/source.schema.json" with { type: "json" };

export const schemaDocuments = Object.freeze({
  claim,
  common,
  "decision-trace": decisionTrace,
  dimension,
  entity,
  "project-facts": projectFacts,
  relation,
  review,
  rule,
  snapshot,
  source,
});

export const schemaBytes: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(schemaDocuments).map(([name, document]) => [
      name,
      `${JSON.stringify(document)}\n`,
    ]),
  ),
);
