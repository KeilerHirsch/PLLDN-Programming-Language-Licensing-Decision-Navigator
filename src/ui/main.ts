// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { analyzeText } from "../text/analyze.ts";
import type { TextAnalysis, TextRuleSet } from "../text/types.ts";
import type { UiController } from "./controller.ts";
import {
  renderApp,
  renderDiagnostic,
  renderUnavailable,
  type TextAssistanceState,
} from "./render.ts";
import { type BrowserRuntimeInput, bootstrapUiRuntime } from "./runtime.ts";
import { confirmProposal, confirmProposals } from "./text-assistance.ts";
import type { FacetDefinition, SortMode, UiViewModel } from "./types.ts";

interface PllDnWindow extends Window {
  PLLDN_RUNTIME?: BrowserRuntimeInput;
}

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("PLLDN application root missing");
const root: HTMLElement = appRoot;

let controller: UiController | null = null;
let textRules: TextRuleSet | null = null;
let textFacets: readonly FacetDefinition[] = [];
let textState: TextAssistanceState = {
  source: "",
  analysis: null,
  diagnostic: null,
};

function diagnostic(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unexpected browser action failure";
}

async function publish(action: () => Promise<UiViewModel>): Promise<void> {
  try {
    renderApp(root, await action(), textState);
  } catch (error) {
    renderDiagnostic(root, diagnostic(error));
  }
}

function actionElement(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-action]")
    : null;
}

function currentTextSource(): string {
  return (
    root.querySelector<HTMLTextAreaElement>('[data-action="text-source"]')
      ?.value ?? textState.source
  );
}

async function analyzeCurrent(current: UiController): Promise<void> {
  const source = currentTextSource();
  try {
    const analysis: TextAnalysis = textRules
      ? analyzeText(source, textRules, textFacets)
      : { proposals: [] };
    textState = {
      source,
      analysis,
      diagnostic: textRules
        ? null
        : "Text assistance unavailable for this facet catalogue.",
    };
  } catch (error) {
    textState = { source, analysis: null, diagnostic: diagnostic(error) };
  }
  await publish(() => current.view());
}

root.addEventListener("click", (event) => {
  const element = actionElement(event.target);
  const current = controller;
  if (!element || !current) return;
  const action = element.dataset.action;
  if (action === "analyze-text") {
    void analyzeCurrent(current);
  }
  if (action === "clear-text-analysis") {
    textState = {
      source: currentTextSource(),
      analysis: null,
      diagnostic: null,
    };
    void publish(() => current.view());
  }
  if (action === "confirm-text") {
    const proposalId = element.dataset.proposalId;
    const proposal = textState.analysis?.proposals.find(
      (item) => item.proposal_id === proposalId,
    );
    if (proposal) void publish(() => confirmProposal(current, proposal));
  }
  if (action === "confirm-all-text") {
    const proposals =
      textState.analysis?.proposals.filter(
        (item) => item.state === "PROPOSED",
      ) ?? [];
    if (proposals.length > 0) {
      void publish(() => confirmProposals(current, proposals));
    }
  }
  if (action === "reset") {
    void publish(() => current.reset());
  }
  if (action === "clear-facet") {
    const facetId = element.dataset.facetId;
    if (!facetId) return;
    void publish(() => current.clearFacet(facetId));
  }
});

root.addEventListener("change", (event) => {
  const element = actionElement(event.target);
  const current = controller;
  if (!element || !current) return;
  const action = element.dataset.action;
  if (action === "select-facet") {
    const facetId = element.dataset.facetId;
    const optionId = element.dataset.optionId;
    if (!facetId || !optionId) return;
    void publish(() => current.selectFacet(facetId, optionId));
  }
  if (action === "sort" && element instanceof HTMLSelectElement) {
    const sort = element.value as SortMode;
    void publish(() => current.setSort(sort));
  }
});

async function start(): Promise<void> {
  const input = (window as PllDnWindow).PLLDN_RUNTIME;
  if (!input) {
    renderUnavailable(
      root,
      "Runtime snapshot not configured with a trusted approval digest.",
    );
    return;
  }
  const runtime = await bootstrapUiRuntime(input);
  if (runtime.status === "unavailable") {
    renderUnavailable(root, runtime.reason);
    return;
  }
  controller = runtime.controller;
  textRules = runtime.textRules;
  textFacets = runtime.facets;
  await publish(() => runtime.controller.view());
}

void start().catch((error) => {
  renderDiagnostic(root, diagnostic(error));
});
