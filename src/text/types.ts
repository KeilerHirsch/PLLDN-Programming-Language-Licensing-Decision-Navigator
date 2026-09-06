// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { TypedValue } from "../decision/types.ts";

export interface TextAlias {
  alias_id: string;
  phrases: readonly (readonly string[])[];
}

export type PatternAtom = string | { alias: string };

export interface TextRuleTarget {
  facet_id: string;
  option_id: string;
}

interface TextRuleBase {
  rule_id: string;
  pattern: readonly PatternAtom[];
  reason_key: string;
}

export interface ActionableTextRule extends TextRuleBase {
  kind: "actionable";
  target: TextRuleTarget;
}

export interface AmbiguityTextRule extends TextRuleBase {
  kind: "ambiguity";
}

export type TextRule = ActionableTextRule | AmbiguityTextRule;

export interface TextRuleSet {
  schema_version: "0.1";
  rule_set_id: string;
  aliases: readonly TextAlias[];
  rules: readonly TextRule[];
}

export interface NormalizedToken {
  value: string;
  start: number;
  end: number;
}

export interface NormalizedText {
  original: string;
  tokens: readonly NormalizedToken[];
}

export interface SourceSpan {
  start: number;
  end: number;
  text: string;
}

export type ProposalState = "PROPOSED" | "AMBIGUOUS" | "CONFLICTING";

export interface TextProposal {
  proposal_id: string;
  state: ProposalState;
  spans: readonly SourceSpan[];
  rule_ids: readonly string[];
  reason_key: string;
  facet_id?: string;
  option_id?: string;
  facet_label?: string;
  option_label?: string;
  dimension_id?: string;
  value?: TypedValue;
}

export interface TextAnalysis {
  proposals: readonly TextProposal[];
}
