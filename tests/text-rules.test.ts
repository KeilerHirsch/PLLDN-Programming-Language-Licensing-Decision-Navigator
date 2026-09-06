// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadStage4Rules, loadTextRuleSet } from "../src/text/rules.ts";
import { PRODUCT_FACETS } from "../src/ui/product-facets.ts";
import { parseStrictJson } from "../src/validation/json.ts";

const raw = readFileSync(
  new URL("../text-rules/stage4-core.json", import.meta.url),
  "utf8",
);

function cloneRaw(): Record<string, unknown> {
  return structuredClone(parseStrictJson(raw)) as Record<string, unknown>;
}

test("checked-in Stage 4 rule set is strict and targets product facets", () => {
  const rules = loadStage4Rules(PRODUCT_FACETS);
  assert.equal(rules.rule_set_id, "text-rules.stage4-core");
  assert(rules.rules.length >= 12);
  for (const rule of rules.rules) {
    if (rule.kind === "ambiguity") {
      assert.equal("target" in rule, false);
      continue;
    }
    const facet = PRODUCT_FACETS.find(
      (item) => item.facet_id === rule.target.facet_id,
    );
    assert(facet);
    assert(
      facet.options.some(
        (option) => option.option_id === rule.target.option_id,
      ),
    );
  }
});

test("rule loader rejects unknown targets and executable pattern surface", () => {
  const unknown = cloneRaw();
  const rules = unknown.rules as Record<string, unknown>[];
  const first = structuredClone(rules[0] ?? {});
  first.target = { facet_id: "not-a-product-facet", option_id: "true" };
  rules[0] = first;
  assert.throws(() => loadTextRuleSet(unknown, PRODUCT_FACETS), /facet/i);

  const executable = cloneRaw();
  const executableRules = executable.rules as Record<string, unknown>[];
  executableRules[0] = { ...executableRules[0], regex: ".*" };
  assert.throws(
    () => loadTextRuleSet(executable, PRODUCT_FACETS),
    /schema|invalid/i,
  );
});

test("rule loader rejects duplicate IDs and unknown aliases", () => {
  const duplicate = cloneRaw();
  const rules = duplicate.rules as Record<string, unknown>[];
  const first = rules[0];
  assert(first);
  rules.push(structuredClone(first));
  assert.throws(() => loadTextRuleSet(duplicate, PRODUCT_FACETS), /duplicate/i);

  const badAlias = cloneRaw();
  const badRules = badAlias.rules as Record<string, unknown>[];
  badRules[0] = {
    ...badRules[0],
    pattern: [{ alias: "missing-alias" }],
  };
  assert.throws(() => loadTextRuleSet(badAlias, PRODUCT_FACETS), /alias/i);
});
