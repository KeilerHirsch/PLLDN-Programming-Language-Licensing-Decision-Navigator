// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import {
  type Document,
  evaluationTime,
  validateDocument,
} from "./documents.ts";
import { asObject } from "./json.ts";

const idFields: Record<string, string> = {
  entity: "entity_id",
  dimension: "dimension_id",
  source: "source_id",
  claim: "claim_id",
  relation: "relation_id",
  rule: "rule_id",
  review: "review_id",
  "project-facts": "project_id",
};
function list(value: unknown): string[] {
  return value as string[];
}
function fail(message: string): never {
  throw new Error(message);
}
function checkTime(value: unknown, now: number, expiry = false): void {
  if (value === undefined) return;
  const time = Date.parse(value as string);
  if (!Number.isFinite(time) || (expiry ? time <= now : time > now))
    fail("Evidence time is invalid, future or expired");
}
/** Resolve record identities and scoped assertions; never infer missing facts. */
export function validateReferences(
  documents: readonly Document[],
  at: string,
): void {
  const now = evaluationTime(at);
  const index = new Map<string, Document>();
  for (const doc of documents) {
    validateDocument(doc.kind, doc.record);
    const field = idFields[doc.kind];
    if (!field) fail("Non-knowledge record in graph");
    const id = doc.record[field] as string;
    if (index.has(id)) fail("Duplicate stable ID");
    index.set(id, doc);
  }
  const requireRef = (id: unknown, kind: string) => {
    const doc = index.get(id as string);
    if (!doc || doc.kind !== kind) fail(`Missing ${kind} reference`);
    return doc.record;
  };
  const typed = (r: Record<string, unknown>) => {
    const d = requireRef(r.dimension_id, "dimension");
    const operator = r.operator as string | undefined;
    if (
      ["GTE", "LTE"].includes(operator ?? "") &&
      !["integer", "quantity"].includes(d.value_type as string)
    )
      fail("Ordered operator requires an integer or quantity dimension");
    if (operator === "IN" && d.value_type !== "set")
      fail("IN operator requires a set dimension");
    if (r.value === undefined) return;
    const v = asObject(r.value);
    if (v.type !== d.value_type) fail("Dimension value type mismatch");
    if (v.type === "quantity" && v.unit !== d.unit)
      fail("Dimension unit mismatch");
    if (["enum", "set"].includes(v.type as string)) {
      const values = v.type === "set" ? list(v.value) : [v.value as string];
      if (!values.every((x) => list(d.allowed_values).includes(x)))
        fail("Value outside dimension vocabulary");
    }
  };
  for (const { kind, record: r } of documents) {
    checkTime(r.verified_at, now);
    checkTime(r.retrieved_at, now);
    checkTime(r.reviewed_at, now);
    checkTime(r.valid_until, now, true);
    for (const source of list(r.source_ids ?? [])) requireRef(source, "source");
    for (const condition of (r.conditions ?? []) as Record<string, unknown>[])
      typed(condition);
    for (const old of list(r.supersedes ?? [])) {
      const prior = requireRef(old, kind);
      if (prior === r) fail("Self supersession");
      if (
        kind === "claim" &&
        (prior.entity_id !== r.entity_id ||
          prior.dimension_id !== r.dimension_id)
      )
        fail("Claim supersession must preserve entity and dimension");
    }
    if (r.review_status === "Reviewed" && list(r.test_refs).length === 0)
      fail("Reviewed assertion requires tests");
    if (r.world_freshness_class === "volatile" && r.valid_until === undefined)
      fail("Volatile assertion requires expiry");
    if (kind === "review") {
      const assertions = r.assertions as Record<string, unknown>[];
      const seen = new Set<string>();
      for (const item of assertions) {
        const id = item.assertion_id as string;
        if (seen.has(id)) fail("Duplicate reviewed assertion");
        seen.add(id);
        const target = index.get(id);
        if (!target || !["claim", "relation", "rule"].includes(target.kind))
          fail("Missing reviewed assertion reference");
      }
    }
    if (kind === "claim") {
      const entity = requireRef(r.entity_id, "entity");
      typed(r);
      const scope = asObject(r.scope);
      if (
        !list(scope.versions).every((x) =>
          list(entity.version_scope).includes(x),
        ) ||
        !list(scope.targets).every((x) => list(entity.target_scope).includes(x))
      )
        fail("Claim scope exceeds entity scope");
    }
    if (kind === "relation") {
      for (const side of ["from", "to"]) {
        const entity = requireRef(r[`${side}_entity`], "entity");
        const scope = asObject(r[`${side}_scope`]);
        if (
          !list(scope.versions).every((x) =>
            list(entity.version_scope).includes(x),
          ) ||
          !list(scope.targets).every((x) =>
            list(entity.target_scope).includes(x),
          )
        )
          fail("Relation scope exceeds endpoint scope");
      }
      if (r.relation_type === "license-combination") {
        for (const id of [r.from_entity, r.to_entity])
          if (requireRef(id, "entity").entity_type !== "license")
            fail("License relation requires license endpoints");
      }
    }
    if (kind === "rule") {
      for (const id of list(r.claim_ids)) requireRef(id, "claim");
      for (const id of list(r.relation_ids)) requireRef(id, "relation");
      if (
        ["EXCLUDE", "REQUIRE"].includes(r.effect as string) &&
        r.risk !== "very-high"
      )
        fail("Hard rules require very-high review tier");
    }
    if (kind === "project-facts") checkProject(r, typed);
  }
  checkSupersession(index);
  checkActiveRuleReferences(index);
}
function checkProject(
  r: Record<string, unknown>,
  typed: (r: Record<string, unknown>) => void,
): void {
  const components = r.components as Record<string, unknown>[];
  const ids = new Set(components.map((c) => c.component_id));
  if (ids.size !== components.length) fail("Duplicate component ID");
  const seen = new Set<unknown>();
  for (const fact of r.facts as Record<string, unknown>[]) {
    if (seen.has(fact.fact_id)) fail("Duplicate fact ID");
    seen.add(fact.fact_id);
    typed(fact);
    for (const condition of (fact.conditions ?? []) as Record<
      string,
      unknown
    >[])
      typed(condition);
    const scope = asObject(fact.scope);
    if (scope.kind === "component" && !ids.has(scope.component_id))
      fail("Unknown component scope");
  }
  for (const b of r.boundaries as Record<string, unknown>[]) {
    if (
      seen.has(b.boundary_id) ||
      !ids.has(b.from_component) ||
      !ids.has(b.to_component) ||
      b.from_component === b.to_component
    )
      fail("Invalid boundary");
    seen.add(b.boundary_id);
  }
}
function checkSupersession(index: Map<string, Document>): void {
  const complete = new Set<string>();
  const visit = (id: string, path: Set<string>) => {
    if (path.has(id)) fail("Supersession cycle");
    if (complete.has(id)) return;
    path.add(id);
    for (const prior of list(index.get(id)?.record.supersedes ?? []))
      visit(prior, path);
    path.delete(id);
    complete.add(id);
  };
  for (const id of index.keys()) visit(id, new Set());
}

function checkActiveRuleReferences(index: Map<string, Document>): void {
  const superseded = new Set<string>();
  for (const doc of index.values())
    for (const id of list(doc.record.supersedes ?? [])) superseded.add(id);
  for (const [id, doc] of index) {
    if (doc.kind !== "rule" || superseded.has(id)) continue;
    for (const ref of [
      ...list(doc.record.claim_ids ?? []),
      ...list(doc.record.relation_ids ?? []),
    ])
      if (superseded.has(ref))
        fail("Active rule references superseded assertion");
  }
}
