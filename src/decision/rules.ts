// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import {
  type MutableAssessment,
  markExcluded,
  markUnresolved,
  sortedStrings,
} from "./assessment.ts";
import { evaluateCondition, evaluateConditions } from "./facts.ts";
import type { KnowledgeIndex } from "./knowledge.ts";
import type { ConditionRecord } from "./types.ts";

export interface RuleApplication {
  conflict: boolean;
  unresolvedFactIds: string[];
  askDimensionIds: string[];
}
function ruleAppliesToForm(
  rule: Record<string, unknown>,
  form: string,
): boolean {
  return (rule.applies_to as string[]).includes(form);
}

function addRuleEvidence(
  assessment: MutableAssessment,
  index: KnowledgeIndex,
  rule: Record<string, unknown>,
): void {
  assessment.rule_ids.add(rule.rule_id as string);
  const evidence = index.evidenceForRule(rule);
  for (const id of evidence.claim_ids) assessment.claim_ids.add(id);
  for (const id of evidence.relation_ids) assessment.relation_ids.add(id);
  for (const id of evidence.source_ids) assessment.source_ids.add(id);
}
export function applyRules(
  index: KnowledgeIndex,
  project: Record<string, unknown>,
  componentId: string | null,
  form: string,
  candidateType: string,
  assessments: Map<string, MutableAssessment>,
): RuleApplication {
  let required: Set<string> | null = null;
  const unresolvedFacts = new Set<string>();
  const askDimensions = new Set<string>();
  const rules = [...index.rules.values()].sort((a, b) =>
    String(a.rule_id).localeCompare(String(b.rule_id)),
  );

  for (const rule of rules) {
    if (!ruleAppliesToForm(rule, form)) continue;
    const targets = new Set(index.ruleTargets(rule, candidateType));
    if (targets.size === 0) continue;
    const condition = evaluateConditions(
      project,
      componentId,
      rule.conditions as ConditionRecord[],
    );
    for (const id of condition.unresolvedFactIds) unresolvedFacts.add(id);
    const effect = rule.effect as string;
    const ruleId = rule.rule_id as string;
    if (effect === "ASK") {
      if (condition.truth === "UNKNOWN") {
        for (const item of rule.conditions as ConditionRecord[]) {
          const itemResult = evaluateCondition(project, componentId, item);
          if (itemResult.truth !== "UNKNOWN") continue;
          askDimensions.add(item.dimension_id);
          for (const id of itemResult.unresolvedFactIds)
            unresolvedFacts.add(id);
        }
      }
      continue;
    }

    if (effect === "REQUIRE" && condition.truth === "TRUE") {
      required =
        required === null
          ? new Set<string>(targets)
          : new Set<string>(
              [...required].filter((id: string) => targets.has(id)),
            );
    }

    for (const assessment of assessments.values()) {
      const targeted = targets.has(assessment.candidate_id);
      if (effect === "EXCLUDE") {
        if (condition.truth === "TRUE" && targeted) {
          addRuleEvidence(assessment, index, rule);
          markExcluded(assessment, ruleId);
        } else if (condition.truth === "UNKNOWN" && targeted) {
          addRuleEvidence(assessment, index, rule);
          markUnresolved(assessment, ruleId);
        }
      } else if (effect === "REQUIRE") {
        if (condition.truth === "TRUE" && !targeted) {
          addRuleEvidence(assessment, index, rule);
          markExcluded(assessment, ruleId);
        } else if (condition.truth === "UNKNOWN" && !targeted) {
          addRuleEvidence(assessment, index, rule);
          markUnresolved(assessment, ruleId);
        }
      } else if (effect === "PREFER" || effect === "PENALIZE") {
        if (condition.truth === "FALSE") continue;
        addRuleEvidence(assessment, index, rule);
        if (condition.truth === "UNKNOWN") {
          assessment.preferences.set(ruleId, "UNKNOWN");
        } else if (condition.truth === "TRUE") {
          const positive = effect === "PREFER" ? targeted : !targeted;
          assessment.preferences.set(
            ruleId,
            positive ? "SATISFIED" : "UNSATISFIED",
          );
        }
      } else if (effect === "WARN" && condition.truth === "TRUE" && targeted) {
        addRuleEvidence(assessment, index, rule);
      }
    }
  }

  return {
    conflict: required !== null && required.size === 0,
    unresolvedFactIds: sortedStrings(unresolvedFacts),
    askDimensionIds: sortedStrings(askDimensions),
  };
}
