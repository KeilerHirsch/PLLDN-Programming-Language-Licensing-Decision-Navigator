// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { Document } from "../validation/documents.ts";

export type ScalarValue = boolean | number | string;
export type TypedValue =
  | { type: "boolean"; value: boolean }
  | { type: "integer"; value: number }
  | { type: "string"; value: string }
  | { type: "enum"; value: string }
  | { type: "set"; value: string[] }
  | { type: "quantity"; value: number; unit: string };
export type Operator = "EQ" | "NEQ" | "IN" | "GTE" | "LTE";
export type Truth = "TRUE" | "FALSE" | "UNKNOWN";
export type PreferenceOutcome = "SATISFIED" | "UNSATISFIED" | "UNKNOWN";
export type CandidateStatus = "ELIGIBLE" | "EXCLUDED" | "UNRESOLVED";

export interface DecisionRequest {
  project: Record<string, unknown>;
  knowledge: readonly Document[];
  candidateType: string;
  componentId: string | null;
  evaluatedAt: string;
  knowledgeSnapshot: string;
  rulesSnapshot: string;
  snapshotSha256: string;
}
export interface CandidateAssessment {
  candidate_id: string;
  status: CandidateStatus;
  exclusions: string[];
  unresolved: string[];
  preferences: Record<string, PreferenceOutcome>;
  rule_ids: string[];
  claim_ids: string[];
  relation_ids: string[];
  source_ids: string[];
}
export interface DecisionResultTrace {
  component_id: string | null;
  candidate_ids: string[];
  rule_ids: string[];
  claim_ids: string[];
  relation_ids: string[];
  source_ids: string[];
  reason: string;
}
export type DecisionState =
  | "RECOMMEND"
  | "ALTERNATIVES"
  | "NEEDS_ONE_FACT"
  | "INSUFFICIENT_INFORMATION"
  | "CONFLICT"
  | "UNSUPPORTED";
export interface DecisionTrace {
  schema_version: "0.1";
  analysis_id: string;
  evaluated_at: string;
  project_facts_sha256: string;
  snapshot_sha256: string;
  knowledge_snapshot: string;
  rules_snapshot: string;
  state: DecisionState;
  results: DecisionResultTrace[];
  unresolved_fact_ids: string[];
  unresolved_dimension_ids: string[];
  tie_breaker_ids: string[];
}
export interface DecisionEvaluation {
  trace: DecisionTrace;
  candidates: CandidateAssessment[];
}

export interface ConditionRecord {
  dimension_id: string;
  operator: Operator;
  value: TypedValue;
}
