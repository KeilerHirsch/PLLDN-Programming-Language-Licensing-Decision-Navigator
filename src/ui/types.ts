// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type {
  CandidateStatus,
  ConditionRecord,
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

export type KnowledgeClaimState =
  | "TRUE"
  | "FALSE"
  | "CONDITIONAL"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export interface UiEvidenceSource {
  source_id: string;
  title: string;
  reference: string;
}

export interface UiCandidateFactView {
  claim_id: string;
  dimension_id: string;
  label: string;
  state: KnowledgeClaimState;
  value: TypedValue | null;
  conditions: readonly ConditionRecord[];
  sources: readonly UiEvidenceSource[];
}

export interface UiCandidateView {
  candidate_id: string;
  label: string;
  status: CandidateStatus;
  material_class: CandidateMaterialClass;
  version_scope: readonly string[];
  target_scope: readonly string[];
  facts: readonly UiCandidateFactView[];
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


export type CatalogEntityType = "language" | "license";

export interface CatalogPreviewFactView extends UiCandidateFactView {
  review_status: string;
}

export interface CatalogPreviewEntryView {
  entity_id: string;
  label: string;
  entity_type: CatalogEntityType;
  version_scope: readonly string[];
  target_scope: readonly string[];
  facts: readonly CatalogPreviewFactView[];
}

export interface CatalogPreviewView {
  knowledge_snapshot: string;
  status: "Preview";
  languages: readonly CatalogPreviewEntryView[];
  licenses: readonly CatalogPreviewEntryView[];
}
