// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type {
  CandidateStatus,
  DecisionEvaluation,
  DecisionState,
  DecisionTrace,
  Operator,
  TypedValue,
} from "../decision/types.ts";

export type ConstraintStrength =
  | "MUST"
  | "PREFER"
  | "NEUTRAL"
  | "AVOID"
  | "FORBIDDEN";

export interface FacetOption {
  option_id: string;
  label: string;
  value: TypedValue;
}

export interface FacetDefinition {
  facet_id: string;
  label: string;
  group: string;
  dimension_id: string;
  operator: Operator;
  strength: ConstraintStrength;
  options: readonly FacetOption[];
}

export type FacetSelections = Readonly<Record<string, string>>;
export type SortMode = "recommended" | "name";
export type CandidateMaterialClass =
  | "selected"
  | "eligible"
  | "unresolved"
  | "excluded";

export interface UiCandidateView {
  candidate_id: string;
  label: string;
  status: CandidateStatus;
  material_class: CandidateMaterialClass;
  exclusions: readonly string[];
  unresolved: readonly string[];
  source_ids: readonly string[];
}

export interface UiFacetOptionView {
  option_id: string;
  label: string;
  value: TypedValue;
  selected: boolean;
  eligible: number;
  excluded: number;
  unresolved: number;
  decision_state: string;
}
export interface UiFacetView {
  facet_id: string;
  label: string;
  group: string;
  options: readonly UiFacetOptionView[];
}

export interface UiChip {
  facet_id: string;
  option_id: string;
  label: string;
}

export interface UiStateView {
  state: DecisionState;
  message: string;
  unresolved_dimension_ids: readonly string[];
}

export interface UiViewModel {
  project: Record<string, unknown>;
  engine: DecisionEvaluation;
  trace: DecisionTrace;
  state: UiStateView;
  facets: readonly UiFacetView[];
  chips: readonly UiChip[];
  candidates: readonly UiCandidateView[];
  sort: SortMode;
}
