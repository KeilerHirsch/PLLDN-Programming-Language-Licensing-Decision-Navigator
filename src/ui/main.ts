// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { UiController } from "./controller.ts";
import { renderApp, renderDiagnostic, renderUnavailable } from "./render.ts";
import { type BrowserRuntimeInput, bootstrapUiRuntime } from "./runtime.ts";
import type { SortMode, UiViewModel } from "./types.ts";

interface PllDnWindow extends Window {
  PLLDN_RUNTIME?: BrowserRuntimeInput;
}

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("PLLDN application root missing");
const root: HTMLElement = appRoot;

let controller: UiController | null = null;

function diagnostic(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unexpected browser action failure";
}
async function publish(action: () => Promise<UiViewModel>): Promise<void> {
  try {
    renderApp(root, await action());
  } catch (error) {
    renderDiagnostic(root, diagnostic(error));
  }
}

function actionElement(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-action]")
    : null;
}

root.addEventListener("click", (event) => {
  const element = actionElement(event.target);
  const current = controller;
  if (!element || !current) return;
  const action = element.dataset.action;
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
  await publish(() => runtime.controller.view());
}

void start().catch((error) => {
  renderDiagnostic(root, diagnostic(error));
});
