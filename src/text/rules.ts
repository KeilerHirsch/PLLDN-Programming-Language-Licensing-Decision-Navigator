// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { Ajv2020 } from "ajv/dist/2020.js";
import textRuleSetSchema from "../../schemas/text-rule-set.schema.json" with {
  type: "json",
};
import stage4Core from "../../text-rules/stage4-core.json" with {
  type: "json",
};
import type { FacetDefinition } from "../ui/types.ts";
import type { PatternAtom, TextRuleSet } from "./types.ts";

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
});
const validateRuleSet = ajv.compile(textRuleSetSchema);

function requireUniqueIds(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label} ID: ${value}`);
    seen.add(value);
  }
}

function aliasReferences(pattern: readonly PatternAtom[]): string[] {
  return pattern.flatMap((atom) =>
    typeof atom === "string" ? [] : [atom.alias],
  );
}

export function loadTextRuleSet(
  data: unknown,
  facets: readonly FacetDefinition[],
): TextRuleSet {
  if (!validateRuleSet(data)) {
    throw new Error(
      `Invalid text rule set schema: ${ajv.errorsText(validateRuleSet.errors)}`,
    );
  }
  const ruleSet = data as unknown as TextRuleSet;
  requireUniqueIds(
    ruleSet.aliases.map((alias) => alias.alias_id),
    "alias",
  );
  requireUniqueIds(
    ruleSet.rules.map((rule) => rule.rule_id),
    "rule",
  );

  const aliases = new Set(ruleSet.aliases.map((alias) => alias.alias_id));
  for (const rule of ruleSet.rules) {
    for (const alias of aliasReferences(rule.pattern)) {
      if (!aliases.has(alias))
        throw new Error(`Unknown alias reference: ${alias}`);
    }
  }

  requireUniqueIds(
    facets.map((facet) => facet.facet_id),
    "facet",
  );
  const facetById = new Map(facets.map((facet) => [facet.facet_id, facet]));
  for (const facet of facets) {
    requireUniqueIds(
      facet.options.map((option) => option.option_id),
      `option in facet ${facet.facet_id}`,
    );
  }

  for (const rule of ruleSet.rules) {
    if (rule.kind === "ambiguity") continue;
    const facet = facetById.get(rule.target.facet_id);
    if (!facet) {
      throw new Error(`Unknown facet target: ${rule.target.facet_id}`);
    }
    if (
      !facet.options.some(
        (option) => option.option_id === rule.target.option_id,
      )
    ) {
      throw new Error(
        `Unknown option target ${rule.target.option_id} for facet ${rule.target.facet_id}`,
      );
    }
  }

  return ruleSet;
}

export function loadStage4Rules(
  facets: readonly FacetDefinition[],
): TextRuleSet {
  return loadTextRuleSet(stage4Core, facets);
}
