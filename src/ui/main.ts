// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { exportUnassessedCandidateCsv } from "../product/unassessed-export.ts";
import { analyzeText } from "../text/analyze.ts";
import type { TextAnalysis, TextRuleSet } from "../text/types.ts";
import type { UiController } from "./controller.ts";
import { exportEditorialLanguageCompareCsv } from "./language-compare-export.ts";
import { exportEditorialLicenseCompareCsv } from "./license-compare-export.ts";
import {
  DEFAULT_PRODUCT_UI_STATE,
  type ProductUiState,
  pinnedCandidateById,
  renderProductExperience,
} from "./product.ts";
import {
  type CatalogPreviewState,
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
let catalogState: CatalogPreviewState = {
  view: null,
  diagnostic: null,
};
let productState: ProductUiState = {
  ...DEFAULT_PRODUCT_UI_STATE,
  compareLanguageIds: [],
  compareLicenseIds: [],
  filters: { ...DEFAULT_PRODUCT_UI_STATE.filters },
};
let catalogQuery = "";
const identityPageSize = 60;
let identityLimit = identityPageSize;
let identityOsiFilter = "any";

function diagnostic(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unexpected browser action failure";
}

function normalizedSearch(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase("en-US").trim();
}

function applyCatalogFilter(): void {
  const query = normalizedSearch(catalogQuery);
  let visible = 0;
  for (const entry of root.querySelectorAll<HTMLElement>(
    "[data-catalog-entry]",
  )) {
    const text = entry.dataset.catalogSearchText ?? "";
    entry.hidden = query.length > 0 && !text.includes(query);
    if (!entry.hidden) visible += 1;
  }

  const filterPrefix =
    productState.mode === "languages" ? "language" : "license";
  const filtered = Object.entries(productState.filters).some(
    ([key, value]) => key.startsWith(filterPrefix) && value !== "any",
  );
  let extra = 0;
  let extraShown = 0;
  for (const entry of root.querySelectorAll<HTMLElement>(
    "[data-identity-entry]",
  )) {
    const matches =
      !filtered &&
      (query.length === 0 ||
        entry.dataset.identitySearchText?.includes(query)) &&
      (productState.mode !== "licenses" ||
        identityOsiFilter === "any" ||
        entry.dataset.identityOsiApproved ===
          String(identityOsiFilter === "yes"));
    if (matches) {
      extra += 1;
      if (extraShown < identityLimit) extraShown += 1;
    }
    entry.hidden = !matches || extra > identityLimit;
  }

  const input = root.querySelector<HTMLInputElement>(
    '[data-action="catalog-search"]',
  );
  if (input && input.value !== catalogQuery) input.value = catalogQuery;
  const count = root.querySelector<HTMLElement>("[data-catalog-visible-count]");
  if (count) {
    const noun = productState.mode === "languages" ? "languages" : "licenses";
    count.textContent = `${visible} ${noun} shown. ${extra} additional identities in the unassessed index.`;
  }

  const index = root.querySelector<HTMLDetailsElement>("[data-identity-index]");
  const indexCount = root.querySelector<HTMLElement>("[data-identity-count]");
  if (indexCount) {
    indexCount.textContent = filtered
      ? "Clear structured filters to browse identity-only entries."
      : `${extraShown} of ${extra} additional identities shown.`;
  }
  const osi = root.querySelector<HTMLSelectElement>(
    '[data-action="identity-osi"]',
  );
  if (osi) osi.value = identityOsiFilter;
  const more = root.querySelector<HTMLButtonElement>("[data-identity-more]");
  if (more) {
    const remaining = extra - extraShown;
    more.hidden = filtered || remaining <= 0;
    more.textContent = `Show ${Math.min(identityPageSize, remaining)} more (${remaining} remaining)`;
  }
  if (index && (query.length > 0 || filtered || identityOsiFilter !== "any")) {
    index.open = !filtered && extra > 0;
  }

  const empty = root.querySelector<HTMLElement>("[data-catalog-search-empty]");
  if (empty) empty.hidden = query.length === 0 || visible + extra > 0;
}

function installProductExperience(model: UiViewModel): void {
  const catalog = catalogState.view;
  const shell = root.querySelector<HTMLElement>("main.app-shell");
  if (!catalog || !shell) return;

  const existing = [...shell.children];
  const decision = document.createElement("details");
  decision.className = "decision-lab";
  const summary = document.createElement("summary");
  summary.textContent = `Reviewed decision lab · ${model.state.state}`;
  const body = document.createElement("div");
  body.className = "decision-lab-body";

  existing.forEach((child, index) => {
    if (index < 2 || child.classList.contains("catalog-preview")) return;
    body.append(child);
  });
  decision.append(summary, body);
  shell.replaceChildren(
    renderProductExperience(catalog, productState),
    decision,
  );
}

async function publish(action: () => Promise<UiViewModel>): Promise<void> {
  try {
    const model = await action();
    renderApp(root, model, textState, catalogState);
    installProductExperience(model);
    applyCatalogFilter();
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

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

root.addEventListener("click", (event) => {
  const element = actionElement(event.target);
  const current = controller;
  if (!element || !current) return;
  const action = element.dataset.action;
  if (action === "export-unassessed-csv") {
    downloadCsv(
      exportUnassessedCandidateCsv(),
      "plldn-unassessed-candidates-v0.2.csv",
    );
    return;
  }
  if (action === "export-language-compare") {
    if (!catalogState.view) throw new Error("Preview catalogue not loaded");
    downloadCsv(
      exportEditorialLanguageCompareCsv(
        productState.compareLanguageIds,
        catalogState.view,
      ),
      "plldn-editorial-language-comparison.csv",
    );
    return;
  }
  if (action === "export-license-compare") {
    if (!catalogState.view) throw new Error("Preview catalogue not loaded");
    downloadCsv(
      exportEditorialLicenseCompareCsv(
        productState.compareLicenseIds,
        catalogState.view,
      ),
      "plldn-editorial-license-comparison.csv",
    );
    return;
  }
  if (action === "select-use-case") {
    productState = {
      ...productState,
      selectedUseCaseId: element.dataset.useCaseId ?? null,
    };
    void publish(() => current.view());
  }
  if (action === "clear-use-case") {
    productState = { ...productState, selectedUseCaseId: null };
    void publish(() => current.view());
  }
  if (action === "catalog-mode") {
    const mode = element.dataset.mode;
    if (mode === "languages" || mode === "licenses") {
      productState = { ...productState, mode };
      catalogQuery = "";
      identityLimit = identityPageSize;
      identityOsiFilter = "any";
      void publish(() => current.view());
    }
  }
  if (action === "identity-more") {
    identityLimit += identityPageSize;
    applyCatalogFilter();
  }
  if (action === "toggle-compare") {
    const entityId = element.dataset.entityId;
    if (entityId) {
      const selected = new Set(productState.compareLanguageIds);
      if (selected.has(entityId)) {
        selected.delete(entityId);
      } else if (selected.size < 4) {
        selected.add(entityId);
      }
      productState = {
        ...productState,
        compareLanguageIds: [...selected],
      };
      void publish(() => current.view());
    }
  }
  if (action === "clear-compare") {
    productState = { ...productState, compareLanguageIds: [] };
    void publish(() => current.view());
  }
  if (action === "toggle-license-compare") {
    const entityId = element.dataset.entityId;
    if (entityId) {
      const selected = new Set(productState.compareLicenseIds);
      if (selected.has(entityId)) {
        selected.delete(entityId);
      } else if (selected.size < 4) {
        selected.add(entityId);
      }
      productState = {
        ...productState,
        compareLicenseIds: [...selected],
      };
      void publish(() => current.view());
    }
  }
  if (action === "clear-license-compare") {
    productState = { ...productState, compareLicenseIds: [] };
    void publish(() => current.view());
  }
  if (action === "reset-product-filters") {
    productState = {
      ...productState,
      filters: { ...DEFAULT_PRODUCT_UI_STATE.filters },
    };
    catalogQuery = "";
    identityLimit = identityPageSize;
    identityOsiFilter = "any";
    void publish(() => current.view());
  }
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

root.addEventListener("input", (event) => {
  const element = actionElement(event.target);
  if (
    element?.dataset.action === "catalog-search" &&
    element instanceof HTMLInputElement
  ) {
    catalogQuery = element.value;
    identityLimit = identityPageSize;
    applyCatalogFilter();
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
  if (action === "identity-osi" && element instanceof HTMLSelectElement) {
    if (["any", "yes", "no"].includes(element.value)) {
      identityOsiFilter = element.value;
      identityLimit = identityPageSize;
      applyCatalogFilter();
    }
  }
  if (action === "product-filter" && element instanceof HTMLSelectElement) {
    const filterKey = element.dataset.filterKey;
    if (filterKey && filterKey in productState.filters) {
      productState = {
        ...productState,
        filters: {
          ...productState.filters,
          [filterKey]: element.value,
        },
      };
      catalogQuery = "";
      void publish(() => current.view());
    }
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
  catalogState = {
    view: runtime.catalogPreview,
    diagnostic: runtime.catalogPreviewDiagnostic,
  };
  const candidate = pinnedCandidateById(
    new URLSearchParams(window.location.search).get("candidate"),
  );
  if (candidate) {
    productState = {
      ...productState,
      mode: candidate.kind === "language" ? "languages" : "licenses",
    };
    catalogQuery =
      candidate.kind === "language"
        ? candidate.name
        : (candidate.spdx_id ?? candidate.name);
  }
  await publish(() => runtime.controller.view());
  if (candidate) {
    const profile = [
      ...root.querySelectorAll<HTMLDetailsElement>(".identity-profile"),
    ].find((entry) => entry.dataset.candidateId === candidate.id);
    if (profile && !profile.closest("li")?.hidden) {
      const index = root.querySelector<HTMLDetailsElement>(
        "[data-identity-index]",
      );
      if (index) index.open = true;
      profile.open = true;
      profile.scrollIntoView({ block: "nearest" });
    }
  }
}

void start().catch((error) => {
  renderDiagnostic(root, diagnostic(error));
});
