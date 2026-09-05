// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { Operator, TypedValue } from "../decision/types.ts";

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
