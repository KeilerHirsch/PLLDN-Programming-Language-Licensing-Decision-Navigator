// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { FacetCount } from "../decision/facets.ts";
import type { DecisionEvaluation } from "../decision/types.ts";
import type { Document } from "../validation/documents.ts";
import type {
  FacetDefinition,
  FacetSelections,
  SortMode,
  UiCandidateView,
  UiViewModel,
} from "./types.ts";

const materialRank = {
  selected: 0,
  eligible: 1,
  unresolved: 2,
  excluded: 3,
} as const;

function stableLabelKey(label: string): string {
  return label.normalize("NFKD").toLocaleLowerCase("en-US");
}

function labelCompare(a: UiCandidateView, b: UiCandidateView): number {
  const ak = stableLabelKey(a.label);
  const bk = stableLabelKey(b.label);
  if (ak < bk) return -1;
  if (ak > bk) return 1;
  return a.candidate_id < b.candidate_id
    ? -1
    : a.candidate_id > b.candidate_id
      ? 1
      : 0;
}
export function sortCandidates(
  candidates: readonly UiCandidateView[],
  sort: SortMode,
): UiCandidateView[] {
  return [...candidates].sort((a, b) => {
    if (sort === "recommended") {
      const rank =
        materialRank[a.material_class] - materialRank[b.material_class];
      if (rank !== 0) return rank;
    }
    return labelCompare(a, b);
  });
}

function stateMessage(state: DecisionEvaluation["trace"]["state"]): string {
  switch (state) {
    case "RECOMMEND":
      return "One reviewed candidate is currently recommended.";
    case "ALTERNATIVES":
      return "Several defensible alternatives remain.";
    case "NEEDS_ONE_FACT":
      return "One decision-relevant fact is still needed.";
    case "INSUFFICIENT_INFORMATION":
      return "More than one material fact remains unresolved.";
    case "CONFLICT":
      return "Project constraints conflict; no recommendation is inferred.";
    case "UNSUPPORTED":
      return "The available reviewed knowledge does not support this decision surface.";
  }
}

function entityLabels(
  knowledge: readonly Document[],
  candidateType: string,
): ReadonlyMap<string, string> {
  return new Map(
    knowledge
      .filter(
        (doc) =>
          doc.kind === "entity" && doc.record.entity_type === candidateType,
      )
      .map((doc) => [
        String(doc.record.entity_id),
        String(doc.record.canonical_name),
      ]),
  );
}
export function buildUiViewModel(input: {
  project: Record<string, unknown>;
  evaluation: DecisionEvaluation;
  knowledge: readonly Document[];
  candidateType: string;
  facets: readonly FacetDefinition[];
  counts: Readonly<Record<string, readonly FacetCount[]>>;
  selections: FacetSelections;
  sort: SortMode;
}): UiViewModel {
  const labels = entityLabels(input.knowledge, input.candidateType);
  const selectedIds = new Set(
    input.evaluation.trace.results.flatMap((result) => result.candidate_ids),
  );
  const candidates = input.evaluation.candidates.map((candidate) => {
    const label = labels.get(candidate.candidate_id);
    if (!label)
      throw new Error(`Missing candidate label: ${candidate.candidate_id}`);
    const material_class = selectedIds.has(candidate.candidate_id)
      ? "selected"
      : candidate.status === "ELIGIBLE"
        ? "eligible"
        : candidate.status === "UNRESOLVED"
          ? "unresolved"
          : "excluded";
    return {
      candidate_id: candidate.candidate_id,
      label,
      status: candidate.status,
      material_class,
      exclusions: [...candidate.exclusions],
      unresolved: [...candidate.unresolved],
      source_ids: [...candidate.source_ids],
    } satisfies UiCandidateView;
  });
  const facets = input.facets.map((facet) => {
    const facetCounts = input.counts[facet.facet_id];
    if (!facetCounts || facetCounts.length !== facet.options.length) {
      throw new Error(`Missing facet counts: ${facet.facet_id}`);
    }
    return {
      facet_id: facet.facet_id,
      label: facet.label,
      group: facet.group,
      options: facet.options.map((option, index) => {
        const count = facetCounts[index];
        if (!count)
          throw new Error(
            `Missing facet count: ${facet.facet_id}/${option.option_id}`,
          );
        return {
          option_id: option.option_id,
          label: option.label,
          value: structuredClone(option.value),
          selected: input.selections[facet.facet_id] === option.option_id,
          eligible: count.eligible,
          excluded: count.excluded,
          unresolved: count.unresolved,
          decision_state: count.decision_state,
        };
      }),
    };
  });
  const chips = Object.entries(input.selections)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([facetId, optionId]) => {
      const facet = input.facets.find((item) => item.facet_id === facetId);
      const option = facet?.options.find((item) => item.option_id === optionId);
      if (!facet) throw new Error(`Unknown facet: ${facetId}`);
      if (!option)
        throw new Error(`Unknown facet option: ${facetId}/${optionId}`);
      return {
        facet_id: facetId,
        option_id: optionId,
        label: `${facet.label}: ${option.label}`,
      };
    });
  return {
    project: structuredClone(input.project),
    engine: input.evaluation,
    trace: input.evaluation.trace,
    state: {
      state: input.evaluation.trace.state,
      message: stateMessage(input.evaluation.trace.state),
      unresolved_dimension_ids: [
        ...input.evaluation.trace.unresolved_dimension_ids,
      ],
    },
    facets,
    chips,
    candidates: sortCandidates(candidates, input.sort),
    sort: input.sort,
  };
}
