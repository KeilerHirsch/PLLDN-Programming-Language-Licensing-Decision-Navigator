// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { ConditionRecord, TypedValue } from "../decision/types.ts";
import type { TextAnalysis, TextProposal } from "../text/types.ts";
import type {
  CatalogPreviewEntryView,
  CatalogPreviewFactView,
  CatalogPreviewView,
  UiCandidateFactView,
  UiViewModel,
} from "./types.ts";

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

export function safeEvidenceHref(reference: string): string | null {
  try {
    const url = new URL(reference);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatTypedValue(value: TypedValue): string {
  switch (value.type) {
    case "boolean":
      return value.value ? "Yes" : "No";
    case "integer":
    case "string":
    case "enum":
      return String(value.value);
    case "set":
      return value.value.join(", ");
    case "quantity":
      return `${value.value} ${value.unit}`;
  }
}

function formatCondition(condition: ConditionRecord): string {
  return `${condition.dimension_id} ${condition.operator} ${formatTypedValue(condition.value)}`;
}

function formatFactValue(fact: UiCandidateFactView): string {
  if (fact.state === "UNKNOWN") return "Unknown";
  if (fact.state === "NOT_APPLICABLE") return "Not applicable";
  if (fact.value === null) return fact.state;
  const value = formatTypedValue(fact.value);
  return fact.state === "CONDITIONAL" ? `${value} (conditional)` : value;
}

function renderFact(fact: UiCandidateFactView): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "candidate-fact";

  const label = document.createElement("span");
  label.className = "candidate-fact-label";
  label.textContent = fact.label;

  const value = document.createElement("strong");
  value.className = "candidate-fact-value";
  value.textContent = formatFactValue(fact);
  item.append(label, value);

  if (fact.conditions.length > 0) {
    const conditions = paragraph(
      `Conditions: ${fact.conditions.map(formatCondition).join(" · ")}`,
    );
    conditions.className = "candidate-conditions";
    item.append(conditions);
  }

  if (fact.sources.length > 0) {
    const evidence = document.createElement("div");
    evidence.className = "candidate-evidence";
    const prefix = document.createElement("span");
    prefix.textContent = "Evidence: ";
    evidence.append(prefix);
    fact.sources.forEach((source, index) => {
      if (index > 0) evidence.append(document.createTextNode(" · "));
      const href = safeEvidenceHref(source.reference);
      if (href === null) {
        const sourceLabel = document.createElement("span");
        sourceLabel.textContent = source.title;
        evidence.append(sourceLabel);
      } else {
        const link = document.createElement("a");
        link.href = href;
        link.rel = "noopener noreferrer";
        link.textContent = source.title;
        evidence.append(link);
      }
    });
    item.append(evidence);
  }
  return item;
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

    const scope = paragraph(
      `Snapshot scope: ${candidate.version_scope.join(", ")} · Targets: ${candidate.target_scope.join(", ")}`,
    );
    scope.className = "candidate-meta";
    item.append(scope);

    if (candidate.facts.length > 0) {
      const facts = document.createElement("ul");
      facts.className = "candidate-facts";
      for (const fact of candidate.facts) facts.append(renderFact(fact));
      item.append(facts);
    }

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Decision details";
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

export interface TextAssistanceState {
  source: string;
  analysis: TextAnalysis | null;
  diagnostic: string | null;
}

function proposalStateLabel(proposal: TextProposal): string {
  if (proposal.state === "PROPOSED") return "Detected";
  if (proposal.state === "AMBIGUOUS") return "Needs clarification";
  return "Conflicting statements";
}

function renderProposal(proposal: TextProposal): HTMLLIElement {
  const item = document.createElement("li");
  item.className = `text-proposal text-proposal-${proposal.state.toLowerCase()}`;
  const state = document.createElement("strong");
  state.textContent = proposalStateLabel(proposal);
  const detail = document.createElement("span");
  detail.textContent = proposal.spans.map((span) => span.text).join(" · ");
  item.append(state, detail);
  if (proposal.facet_label && proposal.option_label) {
    item.append(paragraph(`${proposal.facet_label}: ${proposal.option_label}`));
  }
  if (proposal.state === "PROPOSED") {
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.dataset.action = "confirm-text";
    confirm.dataset.proposalId = proposal.proposal_id;
    confirm.textContent = "Confirm";
    item.append(confirm);
  }
  return item;
}

function renderTextAssistance(state: TextAssistanceState): HTMLElement {
  const section = document.createElement("section");
  section.className = "text-assistance";
  section.append(heading(2, "Describe constraints"));
  section.append(
    paragraph(
      "Optional local analysis. Detected items change filters only after confirmation.",
    ),
  );
  const label = document.createElement("label");
  const labelText = document.createElement("span");
  labelText.textContent = "Project constraints";
  const textarea = document.createElement("textarea");
  textarea.dataset.action = "text-source";
  textarea.rows = 6;
  textarea.value = state.source;
  label.append(labelText, textarea);
  section.append(label);
  const actions = document.createElement("div");
  actions.className = "text-actions";
  const analyze = document.createElement("button");
  analyze.type = "button";
  analyze.dataset.action = "analyze-text";
  analyze.textContent = "Analyze text";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.dataset.action = "clear-text-analysis";
  clear.textContent = "Clear analysis";
  actions.append(analyze, clear);
  section.append(actions);
  if (state.diagnostic) section.append(paragraph(state.diagnostic));
  if (!state.analysis) return section;
  if (state.analysis.proposals.length === 0) {
    section.append(paragraph("No supported constraints detected"));
    return section;
  }
  const proposed = state.analysis.proposals.filter(
    (proposal) => proposal.state === "PROPOSED",
  );
  if (proposed.length > 0) {
    const confirmAll = document.createElement("button");
    confirmAll.type = "button";
    confirmAll.dataset.action = "confirm-all-text";
    confirmAll.textContent = "Confirm all detected";
    section.append(confirmAll);
  }
  const list = document.createElement("ul");
  list.className = "text-proposal-list";
  for (const proposal of state.analysis.proposals)
    list.append(renderProposal(proposal));
  section.append(list);
  return section;
}


export interface CatalogPreviewState {
  view: CatalogPreviewView | null;
  diagnostic: string | null;
}

function renderCatalogFact(fact: CatalogPreviewFactView): HTMLLIElement {
  const item = renderFact(fact);
  const status = paragraph(`Review status: ${fact.review_status}`);
  status.className = "catalog-review-status";
  item.append(status);
  return item;
}

function catalogSearchText(entry: CatalogPreviewEntryView): string {
  return [
    entry.label,
    entry.entity_id,
    entry.entity_type,
    ...entry.facts.flatMap((fact) => [
      fact.label,
      fact.value === null ? fact.state : formatFactValue(fact),
    ]),
  ]
    .join(" ")
    .normalize("NFKD")
    .toLocaleLowerCase("en-US");
}

function renderCatalogGroup(
  title: string,
  entries: readonly CatalogPreviewEntryView[],
): HTMLElement {
  const section = document.createElement("section");
  section.className = "catalog-group";
  section.append(heading(3, `${title} (${entries.length})`));
  const list = document.createElement("ul");
  list.className = "catalog-list";
  for (const entry of entries) {
    const item = document.createElement("li");
    item.className = "catalog-card";
    item.dataset.catalogEntry = "true";
    item.dataset.catalogSearchText = catalogSearchText(entry);

    const header = document.createElement("div");
    header.className = "catalog-card-header";
    const name = document.createElement("strong");
    name.textContent = entry.label;
    const badge = document.createElement("span");
    badge.className = "catalog-preview-badge";
    badge.textContent = "Preview";
    header.append(name, badge);
    item.append(header);

    const meta = paragraph(
      `${entry.entity_id} · Scope: ${entry.version_scope.join(", ")} · Targets: ${entry.target_scope.join(", ")}`,
    );
    meta.className = "candidate-meta";
    item.append(meta);

    if (entry.facts.length > 0) {
      const facts = document.createElement("ul");
      facts.className = "candidate-facts";
      for (const fact of entry.facts) facts.append(renderCatalogFact(fact));
      item.append(facts);
    } else {
      item.append(paragraph("No Preview facts recorded yet."));
    }
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderCatalogPreview(state: CatalogPreviewState): HTMLElement {
  const section = document.createElement("section");
  section.className = "catalog-preview";
  section.append(heading(2, "Catalog Preview"));
  section.append(
    paragraph(
      "Broad Candidate catalogue for exploration only. Preview facts never enter the Reviewed recommendation path.",
    ),
  );
  if (state.diagnostic) {
    const diagnostic = paragraph(`Preview unavailable: ${state.diagnostic}`);
    diagnostic.className = "catalog-diagnostic";
    section.append(diagnostic);
    return section;
  }
  if (!state.view) {
    section.append(paragraph("Preview catalogue is not configured."));
    return section;
  }

  const summary = paragraph(
    `${state.view.languages.length} languages · ${state.view.licenses.length} licenses · Snapshot: ${state.view.knowledge_snapshot}`,
  );
  summary.className = "catalog-summary";
  section.append(summary);

  const searchLabel = document.createElement("label");
  searchLabel.className = "catalog-search";
  const searchText = document.createElement("span");
  searchText.textContent = "Search catalogue";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Rust, WebAssembly, copyleft, Cargo…";
  search.dataset.action = "catalog-search";
  searchLabel.append(searchText, search);
  section.append(searchLabel);

  const groups = document.createElement("div");
  groups.className = "catalog-groups";
  groups.append(
    renderCatalogGroup("Languages", state.view.languages),
    renderCatalogGroup("Licenses", state.view.licenses),
  );
  section.append(groups);
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
export function renderApp(
  root: HTMLElement,
  model: UiViewModel,
  textState?: TextAssistanceState,
  catalogState?: CatalogPreviewState,
): void {
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
  if (textState) shell.append(renderTextAssistance(textState));
  shell.append(renderChips(model), status, grid, renderTrace(model));
  if (catalogState) shell.append(renderCatalogPreview(catalogState));
  root.replaceChildren(shell);
}
