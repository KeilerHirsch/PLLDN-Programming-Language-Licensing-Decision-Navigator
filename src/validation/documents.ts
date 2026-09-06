// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

import type {
  StandaloneValidationError,
  StandaloneValidator,
} from "./generated/validators.cjs";
import {
  claim,
  decision_trace,
  dimension,
  entity,
  evaluation_time,
  project_facts,
  relation,
  review,
  rule,
  snapshot,
  source,
} from "./generated/validators.cjs";
import { asObject, parseStrictJson } from "./json.ts";

export { schemaBytes } from "./schema-set.ts";
export const kinds = [
  "project-facts",
  "entity",
  "dimension",
  "source",
  "claim",
  "relation",
  "rule",
  "review",
  "snapshot",
  "decision-trace",
] as const;

type DocumentKind = (typeof kinds)[number];
const validators: Readonly<Record<DocumentKind, StandaloneValidator>> =
  Object.freeze({
    "project-facts": project_facts,
    entity,
    dimension,
    source,
    claim,
    relation,
    rule,
    review,
    snapshot,
    "decision-trace": decision_trace,
  });

function errorsText(
  errors: readonly StandaloneValidationError[] | null | undefined,
): string {
  return (errors ?? [])
    .map(
      (error) => `data${error.instancePath} ${error.message ?? "is invalid"}`,
    )
    .join(", ");
}
export function validateDocument(kind: string, data: unknown): void {
  if (!(kinds as readonly string[]).includes(kind))
    throw new Error("Unsupported document kind");
  const validate = validators[kind as DocumentKind];
  if (!validate(data))
    throw new Error(`Invalid ${kind}: ${errorsText(validate.errors)}`);
}

/** Require an offset-bearing RFC3339 instant before using the host clock parser. */
export function evaluationTime(at: string): number {
  if (!evaluation_time(at) || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(at))
    throw new Error("Explicit valid evaluation time required");
  const time = Date.parse(at);
  if (!Number.isFinite(time)) throw new Error("Unsupported evaluation time");
  return time;
}

export interface Document {
  kind: string;
  record: Record<string, unknown>;
}

/** Reject wrapper extensions so candidate input cannot carry trust metadata. */
export function parseDocument(raw: string): Document {
  const wrapper = asObject(parseStrictJson(raw));
  if (
    Object.keys(wrapper).sort().join(",") !== "kind,record" ||
    typeof wrapper.kind !== "string"
  )
    throw new Error("Invalid document envelope");
  validateDocument(wrapper.kind, wrapper.record);
  return { kind: wrapper.kind, record: asObject(wrapper.record) };
}
