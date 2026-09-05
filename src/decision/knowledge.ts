// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { Document } from "../validation/documents.ts";
import { evaluateConditions } from "./facts.ts";
import type { ConditionRecord, Operator, Truth, TypedValue } from "./types.ts";
import { assertionTruth, typedValue } from "./value.ts";

const idFields: Record<string, string> = {
  entity: "entity_id",
  dimension: "dimension_id",
  source: "source_id",
  claim: "claim_id",
  relation: "relation_id",
  rule: "rule_id",
};
function recordId(doc: Document): string | undefined {
  const field = idFields[doc.kind];
  return field === undefined ? undefined : (doc.record[field] as string);
}
function activeDocuments(documents: readonly Document[]): Document[] {
  const superseded = new Set<string>();
  for (const doc of documents)
    for (const id of (doc.record.supersedes ?? []) as string[])
      superseded.add(id);
  return [...documents]
    .filter((doc) => {
      const id = recordId(doc);
      return id === undefined || !superseded.has(id);
    })
    .sort((a, b) =>
      `${a.kind}:${recordId(a) ?? ""}`.localeCompare(
        `${b.kind}:${recordId(b) ?? ""}`,
      ),
    );
}
export class KnowledgeIndex {
  readonly entities = new Map<string, Record<string, unknown>>();
  readonly claims = new Map<string, Record<string, unknown>>();
  readonly relations = new Map<string, Record<string, unknown>>();
  readonly rules = new Map<string, Record<string, unknown>>();
  readonly sources = new Map<string, Record<string, unknown>>();
  private readonly claimsByEntityDimension = new Map<
    string,
    Record<string, unknown>[]
  >();

  constructor(documents: readonly Document[]) {
    for (const doc of activeDocuments(documents)) {
      const id = recordId(doc);
      if (id === undefined) continue;
      if (doc.kind === "entity") this.entities.set(id, doc.record);
      if (doc.kind === "claim") this.claims.set(id, doc.record);
      if (doc.kind === "relation") this.relations.set(id, doc.record);
      if (doc.kind === "rule") this.rules.set(id, doc.record);
      if (doc.kind === "source") this.sources.set(id, doc.record);
    }
    for (const claim of this.claims.values()) {
      const key = `${claim.entity_id}\u0000${claim.dimension_id}`;
      const list = this.claimsByEntityDimension.get(key) ?? [];
      list.push(claim);
      list.sort((a, b) => String(a.claim_id).localeCompare(String(b.claim_id)));
      this.claimsByEntityDimension.set(key, list);
    }
  }
  candidateIds(entityType: string): string[] {
    return [...this.entities.entries()]
      .filter(([, entity]) => entity.entity_type === entityType)
      .map(([id]) => id)
      .sort();
  }
  claimsFor(
    entityId: string,
    dimensionId: string,
  ): readonly Record<string, unknown>[] {
    return (
      this.claimsByEntityDimension.get(`${entityId}\u0000${dimensionId}`) ?? []
    );
  }
  ruleTargets(rule: Record<string, unknown>, candidateType: string): string[] {
    const targets = new Set<string>();
    for (const claimId of rule.claim_ids as string[]) {
      const claim = this.claims.get(claimId);
      if (!claim) continue;
      const entity = this.entities.get(claim.entity_id as string);
      if (entity?.entity_type === candidateType)
        targets.add(claim.entity_id as string);
    }
    return [...targets].sort();
  }
  evidenceForRule(rule: Record<string, unknown>): {
    claim_ids: string[];
    relation_ids: string[];
    source_ids: string[];
  } {
    const claimIds = [...(rule.claim_ids as string[])].sort();
    const relationIds = [...(rule.relation_ids as string[])].sort();
    const sources = new Set<string>(rule.source_ids as string[]);
    for (const id of claimIds)
      for (const source of (this.claims.get(id)?.source_ids ?? []) as string[])
        sources.add(source);
    for (const id of relationIds)
      for (const source of (this.relations.get(id)?.source_ids ??
        []) as string[])
        sources.add(source);
    return {
      claim_ids: claimIds,
      relation_ids: relationIds,
      source_ids: [...sources].sort(),
    };
  }
}
export interface ClaimEvaluation {
  truth: Truth;
  claimIds: string[];
  sourceIds: string[];
  unresolvedFactIds: string[];
}
export function evaluateCandidateClaim(
  index: KnowledgeIndex,
  project: Record<string, unknown>,
  componentId: string | null,
  entityId: string,
  dimensionId: string,
  operator: Operator,
  expected: TypedValue,
): ClaimEvaluation {
  const claims = index.claimsFor(entityId, dimensionId);
  if (claims.length === 0)
    return {
      truth: "UNKNOWN",
      claimIds: [],
      sourceIds: [],
      unresolvedFactIds: [],
    };
  const truths: Truth[] = [];
  const usedClaims = new Set<string>();
  const sources = new Set<string>();
  const unresolved = new Set<string>();
  for (const claim of claims) {
    let state = claim.state as string;
    if (state === "CONDITIONAL") {
      const conditions = evaluateConditions(
        project,
        componentId,
        claim.conditions as ConditionRecord[],
      );
      for (const id of conditions.unresolvedFactIds) unresolved.add(id);
      if (conditions.truth === "FALSE") continue;
      usedClaims.add(claim.claim_id as string);
      for (const id of claim.source_ids as string[]) sources.add(id);
      if (conditions.truth === "UNKNOWN") {
        truths.push("UNKNOWN");
        continue;
      }
      state = "TRUE";
    } else {
      usedClaims.add(claim.claim_id as string);
      for (const id of claim.source_ids as string[]) sources.add(id);
    }
    truths.push(
      assertionTruth(
        state,
        claim.value === undefined ? undefined : typedValue(claim.value),
        operator,
        expected,
      ),
    );
  }
  const distinct = new Set(truths);
  let truth: Truth;
  if (distinct.size === 1) truth = truths[0] ?? "UNKNOWN";
  else truth = "UNKNOWN";
  return {
    truth,
    claimIds: [...usedClaims].sort(),
    sourceIds: [...sources].sort(),
    unresolvedFactIds: [...unresolved].sort(),
  };
}
