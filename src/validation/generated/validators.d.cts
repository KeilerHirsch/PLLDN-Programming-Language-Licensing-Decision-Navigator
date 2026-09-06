// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
export interface StandaloneValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

export interface StandaloneValidator {
  (data: unknown): boolean;
  errors?: StandaloneValidationError[] | null;
}

export const project_facts: StandaloneValidator;
export const entity: StandaloneValidator;
export const dimension: StandaloneValidator;
export const source: StandaloneValidator;
export const claim: StandaloneValidator;
export const relation: StandaloneValidator;
export const rule: StandaloneValidator;
export const review: StandaloneValidator;
export const snapshot: StandaloneValidator;
export const decision_trace: StandaloneValidator;
export const text_rule_set: StandaloneValidator;
export const evaluation_time: StandaloneValidator;
