// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { evaluateDecision } from "../decision/evaluate.ts";
import { type FacetCount, facetCounts } from "../decision/facets.ts";
import type { DecisionEvaluation, DecisionRequest } from "../decision/types.ts";
import type { Document } from "../validation/documents.ts";
import { deriveProject, projectWithoutFacet } from "./facts.ts";
import { buildUiViewModel } from "./model.ts";
import type {
  FacetDefinition,
  FacetSelections,
  SortMode,
  UiViewModel,
} from "./types.ts";

export interface UiControllerConfig {
  baseProject: Record<string, unknown>;
  knowledge: readonly Document[];
  facets: readonly FacetDefinition[];
  candidateType: string;
  componentId: string | null;
  evaluatedAt: string;
  knowledgeSnapshot: string;
  rulesSnapshot: string;
  snapshotSha256: string;
}

export interface UiController {
  view(): Promise<UiViewModel>;
  selectFacet(facetId: string, optionId: string): Promise<UiViewModel>;
  clearFacet(facetId: string): Promise<UiViewModel>;
  reset(): Promise<UiViewModel>;
  setSort(sort: SortMode): Promise<UiViewModel>;
}
interface MaterialState {
  project: Record<string, unknown>;
  evaluation: DecisionEvaluation;
  counts: Readonly<Record<string, readonly FacetCount[]>>;
}

function decisionRequest(
  config: UiControllerConfig,
  project: Record<string, unknown>,
): DecisionRequest {
  return {
    project,
    knowledge: config.knowledge,
    candidateType: config.candidateType,
    componentId: config.componentId,
    evaluatedAt: config.evaluatedAt,
    knowledgeSnapshot: config.knowledgeSnapshot,
    rulesSnapshot: config.rulesSnapshot,
    snapshotSha256: config.snapshotSha256,
  };
}

export function createUiController(input: UiControllerConfig): UiController {
  const config: UiControllerConfig = {
    ...input,
    baseProject: structuredClone(input.baseProject),
    knowledge: structuredClone(input.knowledge),
    facets: structuredClone(input.facets),
  };
  deriveProject(config.baseProject, config.facets, {}, config.componentId);

  let selections: Record<string, string> = {};
  let sort: SortMode = "recommended";
  let material: MaterialState | null = null;
  async function compute(
    nextSelections: FacetSelections,
  ): Promise<MaterialState> {
    const project = deriveProject(
      config.baseProject,
      config.facets,
      nextSelections,
      config.componentId,
    );
    const evaluation = await evaluateDecision(decisionRequest(config, project));
    const counts: Record<string, readonly FacetCount[]> = {};
    for (const facet of config.facets) {
      const preview = projectWithoutFacet(
        config.baseProject,
        config.facets,
        nextSelections,
        facet.facet_id,
        config.componentId,
      );
      counts[facet.facet_id] = await facetCounts(
        decisionRequest(config, preview),
        facet.dimension_id,
        facet.options.map((option) => option.value),
        { strength: facet.strength, operator: facet.operator },
      );
    }
    return { project, evaluation, counts };
  }

  function projectView(state: MaterialState): UiViewModel {
    return buildUiViewModel({
      project: state.project,
      evaluation: state.evaluation,
      knowledge: config.knowledge,
      candidateType: config.candidateType,
      facets: config.facets,
      counts: state.counts,
      selections,
      sort,
    });
  }
  return {
    async view() {
      material ??= await compute(selections);
      return projectView(material);
    },
    async selectFacet(facetId, optionId) {
      const nextSelections = { ...selections, [facetId]: optionId };
      const nextMaterial = await compute(nextSelections);
      selections = nextSelections;
      material = nextMaterial;
      return projectView(material);
    },
    async clearFacet(facetId) {
      if (!config.facets.some((facet) => facet.facet_id === facetId)) {
        throw new Error(`Unknown facet: ${facetId}`);
      }
      const nextSelections = Object.fromEntries(
        Object.entries(selections).filter(([id]) => id !== facetId),
      );
      const nextMaterial = await compute(nextSelections);
      selections = nextSelections;
      material = nextMaterial;
      return projectView(material);
    },
    async reset() {
      const nextSelections: Record<string, string> = {};
      const nextMaterial = await compute(nextSelections);
      selections = nextSelections;
      material = nextMaterial;
      return projectView(material);
    },
    async setSort(nextSort) {
      if (nextSort !== "recommended" && nextSort !== "name") {
        throw new Error(`Unknown sort mode: ${String(nextSort)}`);
      }
      material ??= await compute(selections);
      sort = nextSort;
      return projectView(material);
    },
  };
}
