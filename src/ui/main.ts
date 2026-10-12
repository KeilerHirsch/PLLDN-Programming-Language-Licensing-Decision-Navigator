// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

import { PRODUCT_MODEL } from "../product/catalog.ts";
import {
  compareLanguageNames,
  languageMatchesDiscovery,
} from "../product/language-information.ts";
import { exportUnassessedCandidateCsv } from "../product/unassessed-export.ts";
import { analyzeText } from "../text/analyze.ts";
import type { TextAnalysis, TextRuleSet } from "../text/types.ts";
import {
  catalogNavigationHref,
  compareCatalogNames,
  readCatalogNavigation,
} from "./catalog-navigation.ts";
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
  discovery: { ...DEFAULT_PRODUCT_UI_STATE.discovery },
};
const initialNavigation = readCatalogNavigation(window.location.search);
productState = {
  ...productState,
  mode: initialNavigation.mode,
  status: initialNavigation.status,
  order: initialNavigation.order,
  view: initialNavigation.view,
  filters: initialNavigation.filters,
  discovery: initialNavigation.discovery,
};
let catalogQuery = initialNavigation.query;
const identityPageSize = 60;
let identityLimit = identityPageSize;
let identityOsiFilter = initialNavigation.spdx;

function diagnostic(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unexpected browser action failure";
}

function normalizedSearch(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase("en-US").trim();
}

function navigationState() {
  return {
    mode: productState.mode,
    query: catalogQuery,
    status: productState.status,
    order: productState.order,
    view: productState.view,
    spdx: identityOsiFilter,
    filters: productState.filters,
    discovery: productState.discovery,
  };
}
function saveNavigation(push = false): void {
  window.history[push ? "pushState" : "replaceState"](
    null,
    "",
    catalogNavigationHref(navigationState()),
  );
}
function applyCatalogFilter(): void {
  const query = normalizedSearch(catalogQuery);
  let visible = 0;
  let editorial = 0;
  let unassessed = 0;
  const entries = [
    ...root.querySelectorAll<HTMLElement>("[data-catalog-entry]"),
  ];
  entries.sort((a, b) =>
    productState.mode === "languages"
      ? compareLanguageNames(
          a.dataset.catalogName ?? "",
          b.dataset.catalogName ?? "",
          productState.order,
        )
      : compareCatalogNames(
          a.dataset.catalogName ?? "",
          b.dataset.catalogName ?? "",
          productState.order === "desc" ? "desc" : "asc",
        ),
  );
  const grid = root.querySelector<HTMLElement>("[data-catalog-grid]");
  if (grid) for (const entry of entries) grid.append(entry);
  for (const entry of entries) {
    const matches =
      (productState.mode !== "languages" ||
        languageMatchesDiscovery(
          entry.dataset.catalogName ?? "",
          productState.discovery,
        )) &&
      (!query || (entry.dataset.catalogSearchText ?? "").includes(query)) &&
      (identityOsiFilter === "any" ||
        entry.dataset.identityOsiApproved ===
          String(identityOsiFilter === "yes"));
    if (matches) {
      visible += 1;
      if (entry.dataset.catalogStatus === "editorial") editorial += 1;
      else unassessed += 1;
    }
    entry.hidden = !matches || visible > identityLimit;
  }
  const input = root.querySelector<HTMLInputElement>(
    '[data-action="catalog-search"]',
  );
  if (input && input.value !== catalogQuery) input.value = catalogQuery;
  const count = root.querySelector<HTMLElement>("[data-catalog-visible-count]");
  if (count) {
    const noun =
      productState.mode === "languages"
        ? visible === 1
          ? "language"
          : "languages"
        : visible === 1
          ? "license"
          : "licenses";
    count.textContent = `${visible} ${noun} found · ${Math.min(visible, identityLimit)} shown · ${editorial} editorial · ${unassessed} unassessed.`;
  }
  const more = root.querySelector<HTMLButtonElement>("[data-identity-more]");
  if (more) {
    const remaining = Math.max(0, visible - identityLimit);
    more.hidden = remaining === 0;
    more.textContent = `Show ${Math.min(identityPageSize, remaining)} more (${remaining} remaining)`;
  }
  const osi = root.querySelector<HTMLSelectElement>(
    '[data-action="identity-osi"]',
  );
  if (osi) osi.value = identityOsiFilter;
  const empty = root.querySelector<HTMLElement>("[data-catalog-search-empty]");
  if (empty) empty.hidden = visible > 0;
  const share = root.querySelector<HTMLAnchorElement>(".catalog-share");
  if (share) share.href = catalogNavigationHref(navigationState());
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

function focusScope(element: HTMLElement): string {
  const scope = element.closest(
    "#catalog, .use-case-result, .use-case-section, .decision-lab",
  );
  return scope?.id || scope?.className || "";
}

async function publish(action: () => Promise<UiViewModel>): Promise<void> {
  try {
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focus = active?.dataset.action
      ? { data: { ...active.dataset }, scope: focusScope(active) }
      : null;
    const model = await action();
    renderApp(root, model, textState, catalogState);
    installProductExperience(model);
    applyCatalogFilter();
    if (focus) {
      const replacement = [
        ...root.querySelectorAll<HTMLElement>("[data-action]"),
      ].find(
        (el) =>
          focusScope(el) === focus.scope &&
          Object.entries(focus.data).every(
            ([key, value]) => el.dataset[key] === value,
          ),
      );
      replacement?.focus({ preventScroll: true });
    }
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
      productState = {
        ...productState,
        mode,
        status: "all",
        order: "asc",
        discovery: { ...DEFAULT_PRODUCT_UI_STATE.discovery },
      };
      catalogQuery = "";
      identityLimit = identityPageSize;
      identityOsiFilter = "any";
      saveNavigation(true);
      void publish(() => current.view());
    }
  }
  if (action === "identity-more") {
    const before = identityLimit;
    identityLimit += identityPageSize;
    applyCatalogFilter();
    const firstNew = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-catalog-entry]:not([hidden])",
      ),
    ][before];
    const link = firstNew?.querySelector<HTMLAnchorElement>(
      ".catalog-profile-link",
    );
    link?.focus({ preventScroll: true });
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
      status: "all",
      order: "asc",
      discovery: { ...DEFAULT_PRODUCT_UI_STATE.discovery },
    };
    catalogQuery = "";
    identityLimit = identityPageSize;
    identityOsiFilter = "any";
    saveNavigation(true);
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
    catalogQuery = element.value.slice(0, 200);
    identityLimit = identityPageSize;
    applyCatalogFilter();
    saveNavigation();
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
  if (
    element instanceof HTMLSelectElement &&
    ["catalog-status", "catalog-order", "catalog-view"].includes(action ?? "")
  ) {
    if (
      action === "catalog-status" &&
      ["all", "editorial", "unassessed"].includes(element.value)
    )
      productState.status = element.value as ProductUiState["status"];
    if (action === "catalog-order")
      productState.order = readCatalogNavigation(
        "?catalog=" +
          productState.mode +
          "&order=" +
          encodeURIComponent(element.value),
      ).order;
    if (action === "catalog-view" && ["cards", "list"].includes(element.value))
      productState.view = element.value as ProductUiState["view"];
    identityLimit = identityPageSize;
    saveNavigation(true);
    void publish(() => current.view());
  }
  if (
    action === "language-discovery" &&
    productState.mode === "languages" &&
    element instanceof HTMLSelectElement
  ) {
    const key = element.dataset.discoveryKey;
    if (key && Object.hasOwn(productState.discovery, key)) {
      const params = new URLSearchParams(
        catalogNavigationHref(navigationState()).split("#")[0],
      );
      params.set(key, element.value);
      productState.discovery = readCatalogNavigation(
        params.toString(),
      ).discovery;
      identityLimit = identityPageSize;
      saveNavigation(true);
      void publish(() => current.view());
    }
  }
  if (action === "identity-osi" && element instanceof HTMLSelectElement) {
    if (["any", "yes", "no"].includes(element.value)) {
      identityOsiFilter = element.value as typeof identityOsiFilter;
      identityLimit = identityPageSize;
      applyCatalogFilter();
      saveNavigation(true);
    }
  }
  if (action === "product-filter" && element instanceof HTMLSelectElement) {
    const filterKey = element.dataset.filterKey;
    if (filterKey && Object.hasOwn(productState.filters, filterKey)) {
      productState = {
        ...productState,
        filters: {
          ...productState.filters,
          [filterKey]: element.value,
        },
      };
      identityLimit = identityPageSize;
      saveNavigation(true);
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
  await restoreCatalogLocation(runtime.controller);
}

async function restoreCatalogLocation(current: UiController): Promise<void> {
  const nav = readCatalogNavigation(window.location.search);
  productState = {
    ...productState,
    mode: nav.mode,
    status: nav.status,
    order: nav.order,
    view: nav.view,
    filters: nav.filters,
    discovery: nav.discovery,
  };
  catalogQuery = nav.query;
  identityOsiFilter = nav.spdx;
  identityLimit = identityPageSize;
  const candidate = pinnedCandidateById(
    new URLSearchParams(window.location.search).get("candidate"),
  );
  if (candidate) {
    productState = {
      ...productState,
      mode: candidate.kind === "language" ? "languages" : "licenses",
      status: "all",
      view: "cards",
      order: "asc",
      filters: { ...DEFAULT_PRODUCT_UI_STATE.filters },
      discovery: { ...DEFAULT_PRODUCT_UI_STATE.discovery },
    };
    catalogQuery =
      candidate.kind === "language"
        ? candidate.name
        : (candidate.spdx_id ?? candidate.name);
  }
  const profileId = new URLSearchParams(window.location.search).get("profile");
  const editorial = [
    ...PRODUCT_MODEL.languages,
    ...PRODUCT_MODEL.licenses,
  ].find((p) => p.entity_id === profileId);
  if (!candidate && editorial) {
    productState = {
      ...productState,
      mode: PRODUCT_MODEL.languages.some(
        (p) => p.entity_id === editorial.entity_id,
      )
        ? "languages"
        : "licenses",
      status: "editorial",
      view: "cards",
      order: "asc",
      filters: { ...DEFAULT_PRODUCT_UI_STATE.filters },
      discovery: { ...DEFAULT_PRODUCT_UI_STATE.discovery },
    };
    catalogQuery = editorial.label;
  }
  if (candidate || editorial) identityOsiFilter = "any";
  await publish(() => current.view());
  if (candidate) {
    const profile = [
      ...root.querySelectorAll<HTMLDetailsElement>(".identity-profile"),
    ].find((entry) => entry.dataset.candidateId === candidate.id);
    if (
      profile &&
      !profile.closest<HTMLElement>("[data-catalog-entry]")?.hidden
    ) {
      profile.open = true;
      profile.scrollIntoView({ block: "nearest" });
    }
  }
  if (editorial) {
    const card = [
      ...root.querySelectorAll<HTMLElement>("[data-catalog-entry]"),
    ].find((el) => el.dataset.entityId === editorial.entity_id);
    card?.scrollIntoView({ block: "nearest" });
  }
  if (window.location.hash === "#catalog" && !candidate && !editorial)
    root
      .querySelector<HTMLElement>("#catalog")
      ?.scrollIntoView({ block: "start" });
}
window.addEventListener("popstate", () => {
  const current = controller;
  if (current)
    void restoreCatalogLocation(current).catch((error) => {
      renderDiagnostic(root, diagnostic(error));
    });
});

void start().catch((error) => {
  renderDiagnostic(root, diagnostic(error));
});
