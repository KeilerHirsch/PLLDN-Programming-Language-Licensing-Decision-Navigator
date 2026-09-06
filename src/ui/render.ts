// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { UiViewModel } from "./types.ts";

function heading(level: 1 | 2 | 3, text: string): HTMLHeadingElement {
  const node = document.createElement(`h${level}`) as HTMLHeadingElement;
  node.textContent = text;
  return node;
}

function paragraph(text: string): HTMLParagraphElement {
  const node = document.createElement("p");
  node.textContent = text;
  return node;
}

export function renderUnavailable(root: HTMLElement, message: string): void {
  root.removeAttribute("aria-busy");
  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.append(heading(1, "PLLDN"));
  const status = paragraph(message);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  shell.append(status);
  root.replaceChildren(shell);
}

export function renderDiagnostic(root: HTMLElement, message: string): void {
  renderUnavailable(root, `Action stopped: ${message}`);
}
function renderChips(model: UiViewModel): HTMLElement {
  const section = document.createElement("section");
  section.className = "active-filters";
  section.append(heading(2, "Active filters"));
  const row = document.createElement("div");
  row.className = "chip-row";
  for (const chip of model.chips) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.action = "clear-facet";
    button.dataset.facetId = chip.facet_id;
    button.textContent = `${chip.label} ×`;
    row.append(button);
  }
  const reset = document.createElement("button");
  reset.type = "button";
  reset.dataset.action = "reset";
  reset.textContent = "Reset all";
  reset.disabled = model.chips.length === 0;
  row.append(reset);
  section.append(row);
  return section;
}

function optionCount(
  option: UiViewModel["facets"][number]["options"][number],
): string {
  return `${option.eligible} eligible · ${option.unresolved} unresolved`;
}
function renderFacets(model: UiViewModel): HTMLElement {
  const section = document.createElement("section");
  section.className = "facets";
  section.append(heading(2, "Filters"));
  for (const facet of model.facets) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = facet.label;
    fieldset.append(legend);
    for (const option of facet.options) {
      const label = document.createElement("label");
      label.className = "facet-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `facet-${facet.facet_id}`;
      input.value = option.option_id;
      input.checked = option.selected;
      input.dataset.action = "select-facet";
      input.dataset.facetId = facet.facet_id;
      input.dataset.optionId = option.option_id;
      const text = document.createElement("span");
      text.textContent = `${option.label} — ${optionCount(option)}`;
      label.append(input, text);
      fieldset.append(label);
    }
    section.append(fieldset);
  }
  return section;
}
function renderSort(model: UiViewModel): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "sort-control";
  const text = document.createElement("span");
  text.textContent = "Sort";
  const select = document.createElement("select");
  select.dataset.action = "sort";
  for (const [value, label] of [
    ["recommended", "Recommended first"],
    ["name", "Name A–Z"],
  ] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = model.sort === value;
    select.append(option);
  }
  wrapper.append(text, select);
  return wrapper;
}

function renderCandidates(model: UiViewModel): HTMLElement {
  const section = document.createElement("section");
  section.className = "results";
  section.append(heading(2, "Candidates"), renderSort(model));
  const list = document.createElement("ul");
  list.className = "candidate-list";
  for (const candidate of model.candidates) {
    const item = document.createElement("li");
    item.className = `candidate candidate-${candidate.material_class}`;
    const name = document.createElement("strong");
    name.textContent = candidate.label;
    const status = document.createElement("span");
    status.className = "candidate-status";
    status.textContent = candidate.material_class;
    item.append(name, status);
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Evidence details";
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(
      {
        candidate_id: candidate.candidate_id,
        exclusions: candidate.exclusions,
        unresolved: candidate.unresolved,
        source_ids: candidate.source_ids,
      },
      null,
      2,
    );
    details.append(summary, pre);
    item.append(details);
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderTrace(model: UiViewModel): HTMLElement {
  const details = document.createElement("details");
  details.className = "trace-details";
  const summary = document.createElement("summary");
  summary.textContent = "Decision trace";
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(model.trace, null, 2);
  details.append(summary, pre);
  return details;
}
export function renderApp(root: HTMLElement, model: UiViewModel): void {
  root.removeAttribute("aria-busy");
  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.append(
    heading(1, "PLLDN — Programming Language & Licensing Decision Navigator"),
  );
  shell.append(
    paragraph(
      "Deterministic software decision support with explicit evidence and uncertainty.",
    ),
  );

  const status = document.createElement("section");
  status.className = "decision-state";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.append(heading(2, model.state.state), paragraph(model.state.message));
  if (model.state.unresolved_dimension_ids.length > 0) {
    status.append(
      paragraph(
        `Unresolved: ${model.state.unresolved_dimension_ids.join(", ")}`,
      ),
    );
  }

  const grid = document.createElement("div");
  grid.className = "workspace-grid";
  grid.append(renderFacets(model), renderCandidates(model));
  shell.append(renderChips(model), status, grid, renderTrace(model));
  root.replaceChildren(shell);
}
