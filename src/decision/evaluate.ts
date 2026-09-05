// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { encodeCanonical, sha256 } from "../snapshots/manifest.ts";
import { validateDocument } from "../validation/documents.ts";
import { validateReferences } from "../validation/references.ts";
import {
  freezeAssessment,
  type MutableAssessment,
  mutableCandidate,
  sortedStrings,
} from "./assessment.ts";
import {
  applyConstraints,
  componentForm,
  constraintsForDecision,
  hasHardConstraintConflict,
} from "./constraints.ts";
import { KnowledgeIndex } from "./knowledge.ts";
import { nonDominated } from "./ranking.ts";
import { applyRules } from "./rules.ts";
import type {
  DecisionEvaluation,
  DecisionRequest,
  DecisionResultTrace,
  DecisionState,
} from "./types.ts";

function resultTrace(
  selected: readonly MutableAssessment[],
  componentId: string | null,
  state: DecisionState,
): DecisionResultTrace[] {
  if (selected.length === 0) return [];
  const reason =
    state === "RECOMMEND"
      ? "One non-dominated candidate satisfies all resolved hard constraints."
      : "Multiple non-dominated candidates remain; no unsupported tie-break was invented.";
  return [
    {
      component_id: componentId,
      candidate_ids: selected.map((item) => item.candidate_id).sort(),
      rule_ids: sortedStrings(selected.flatMap((item) => [...item.rule_ids])),
      claim_ids: sortedStrings(selected.flatMap((item) => [...item.claim_ids])),
      relation_ids: sortedStrings(
        selected.flatMap((item) => [...item.relation_ids]),
      ),
      source_ids: sortedStrings(
        selected.flatMap((item) => [...item.source_ids]),
      ),
      reason,
    },
  ];
}

export async function evaluateDecision(
  request: DecisionRequest,
): Promise<DecisionEvaluation> {
  validateDocument("project-facts", request.project);
  validateReferences(
    [...request.knowledge, { kind: "project-facts", record: request.project }],
    request.evaluatedAt,
  );
  const form = componentForm(request.project, request.componentId);
  const index = new KnowledgeIndex(request.knowledge);
  const candidateIds = index.candidateIds(request.candidateType);
  const assessments = new Map(
    candidateIds.map((id) => [id, mutableCandidate(id)]),
  );
  const constraints = constraintsForDecision(
    request.project,
    request.componentId,
  );
  const projectConflict = hasHardConstraintConflict(
    request.project,
    request.componentId,
    constraints,
  );
  if (!projectConflict) {
    applyConstraints(
      index,
      request.project,
      request.componentId,
      constraints,
      assessments,
    );
  }
  const rules = projectConflict
    ? {
        conflict: false,
        unresolvedFactIds: [] as string[],
        askDimensionIds: [] as string[],
      }
    : applyRules(
        index,
        request.project,
        request.componentId,
        form,
        request.candidateType,
        assessments,
      );
  let state: DecisionState;
  let selected: MutableAssessment[] = [];
  if (projectConflict || rules.conflict) {
    state = "CONFLICT";
  } else if (candidateIds.length === 0) {
    state = "UNSUPPORTED";
  } else if (rules.askDimensionIds.length === 1) {
    state = "NEEDS_ONE_FACT";
  } else if (rules.askDimensionIds.length > 1) {
    state = "INSUFFICIENT_INFORMATION";
  } else {
    const eligible = [...assessments.values()].filter(
      (item) => item.status === "ELIGIBLE",
    );
    const unresolved = [...assessments.values()].filter(
      (item) => item.status === "UNRESOLVED",
    );
    if (eligible.length === 0) {
      state =
        unresolved.length > 0 ? "INSUFFICIENT_INFORMATION" : "UNSUPPORTED";
    } else {
      selected = nonDominated(eligible);
      state = selected.length === 1 ? "RECOMMEND" : "ALTERNATIVES";
    }
  }

  const projectHash = await sha256(encodeCanonical(request.project));
  const analysisHash = await sha256(
    encodeCanonical({
      candidate_type: request.candidateType,
      component_id: request.componentId,
      evaluated_at: request.evaluatedAt,
      knowledge_snapshot: request.knowledgeSnapshot,
      project_facts_sha256: projectHash,
      rules_snapshot: request.rulesSnapshot,
      snapshot_sha256: request.snapshotSha256,
    }),
  );
  const projectFactIds = new Set(
    (request.project.facts as Record<string, unknown>[]).map(
      (fact) => fact.fact_id as string,
    ),
  );
  const unresolvedFactIds = sortedStrings([
    ...rules.unresolvedFactIds,
    ...[...assessments.values()].flatMap((assessment) =>
      [...assessment.unresolved].filter((id) => projectFactIds.has(id)),
    ),
  ]);
  const trace = {
    schema_version: "0.1" as const,
    analysis_id: `analysis.${analysisHash.slice(0, 32)}`,
    evaluated_at: request.evaluatedAt,
    project_facts_sha256: projectHash,
    snapshot_sha256: request.snapshotSha256,
    knowledge_snapshot: request.knowledgeSnapshot,
    rules_snapshot: request.rulesSnapshot,
    state,
    results: resultTrace(selected, request.componentId, state),
    unresolved_fact_ids: unresolvedFactIds,
    unresolved_dimension_ids: rules.askDimensionIds,
    tie_breaker_ids: [],
  };
  validateDocument("decision-trace", trace);
  return {
    trace,
    candidates: [...assessments.values()]
      .sort((a, b) => a.candidate_id.localeCompare(b.candidate_id))
      .map(freezeAssessment),
  };
}

export type {
  CandidateAssessment,
  DecisionEvaluation,
  DecisionRequest,
} from "./types.ts";
