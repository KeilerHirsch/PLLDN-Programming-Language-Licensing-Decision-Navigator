// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { TypedValue } from "../decision/types.ts";
import {
  PRODUCT_COMPARE_DIMENSIONS,
  PRODUCT_MODEL,
} from "../product/catalog.ts";
import { LANGUAGE_DECISION_PROFILES } from "../product/language-decision-profiles.ts";
import { LICENSE_DECISION_PROFILES } from "../product/license-decision-profiles.ts";
import type {
  LanguageProductProfile,
  LicenseProductProfile,
  UseCaseGuide,
} from "../product/types.ts";
import type {
  CatalogPreviewEntryView,
  CatalogPreviewFactView,
  CatalogPreviewView,
} from "./types.ts";

export type ProductCatalogMode = "languages" | "licenses";

export interface ProductUiState {
  mode: ProductCatalogMode;
  selectedUseCaseId: string | null;
  compareLanguageIds: readonly string[];
}

export const DEFAULT_PRODUCT_UI_STATE: ProductUiState = {
  mode: "languages",
  selectedUseCaseId: null,
  compareLanguageIds: [],
};

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

function badge(text: string, className = "product-badge"): HTMLSpanElement {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = text;
  return node;
}

function button(
  label: string,
  action: string,
  className?: string,
): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = label;
  node.dataset.action = action;
  if (className) node.className = className;
  return node;
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

function factValue(fact: CatalogPreviewFactView | undefined): string {
  if (!fact || fact.state === "UNKNOWN") return "Unknown";
  if (fact.state === "NOT_APPLICABLE") return "Not applicable";
  if (fact.value === null) return fact.state;
  const value = formatTypedValue(fact.value);
  return fact.state === "CONDITIONAL" ? `${value} (conditional)` : value;
}

function factsByDimension(
  entry: CatalogPreviewEntryView | undefined,
): ReadonlyMap<string, CatalogPreviewFactView> {
  return new Map(
    (entry?.facts ?? []).map((fact) => [fact.dimension_id, fact] as const),
  );
}

function safeHttps(reference: string): string | null {
  try {
    const url = new URL(reference);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function productSearchText(
  profile: LanguageProductProfile | LicenseProductProfile,
  entry: CatalogPreviewEntryView | undefined,
): string {
  const base =
    "build_path" in profile
      ? [
          profile.label,
          profile.tagline,
          profile.build_path,
          ...profile.categories,
          ...profile.good_for,
          ...profile.watch_for,
          ...Object.values(
            LANGUAGE_DECISION_PROFILES[profile.entity_id] ?? {},
          ).flatMap((group) =>
            typeof group === "object" && group ? Object.values(group) : [],
          ),
        ]
      : [
          profile.label,
          profile.tagline,
          profile.family,
          profile.good_when,
          profile.watch_for,
          ...Object.values(
            LICENSE_DECISION_PROFILES[profile.entity_id] ?? {},
          ).flatMap((group) =>
            typeof group === "object" && group ? Object.values(group) : [group],
          ),
        ];
  return [
    ...base,
    ...(entry?.facts ?? []).flatMap((fact) => [fact.label, factValue(fact)]),
  ]
    .join(" ")
    .normalize("NFKD")
    .toLocaleLowerCase("en-US");
}

function renderHero(catalog: CatalogPreviewView): HTMLElement {
  const hero = document.createElement("header");
  hero.className = "product-hero";

  const eyebrow = paragraph("PROGRAMMING LANGUAGES · LICENSING · EVIDENCE");
  eyebrow.className = "product-eyebrow";
  hero.append(eyebrow);

  hero.append(
    heading(1, "Choose the foundation before the first commit."),
    paragraph(
      "Explore the landscape, compare real trade-offs, then open the Reviewed decision lab when you need a defensible recommendation.",
    ),
  );

  const stats = document.createElement("div");
  stats.className = "product-stats";
  stats.append(
    badge(`${catalog.languages.length} languages`),
    badge(`${PRODUCT_MODEL.licenses.length} licenses`),
    badge("345 Preview facts"),
    badge("Reviewed decision path", "product-badge product-badge-trusted"),
  );
  hero.append(stats);

  const notice = paragraph(
    "Editorial profiles and broad catalogue facts are Preview guidance. They never self-promote into the Reviewed recommendation path.",
  );
  notice.className = "product-notice";
  hero.append(notice);
  return hero;
}

function useCaseById(id: string | null): UseCaseGuide | null {
  return (
    PRODUCT_MODEL.use_cases.find((item) => item.use_case_id === id) ?? null
  );
}

function renderUseCases(state: ProductUiState): HTMLElement {
  const section = document.createElement("section");
  section.className = "use-case-section";
  section.id = "explore";
  section.append(
    heading(2, "What are you building?"),
    paragraph(
      "Pick the job first. PLLDN gives you a short list before you drown in language trivia.",
    ),
  );

  const grid = document.createElement("div");
  grid.className = "use-case-grid";
  for (const guide of PRODUCT_MODEL.use_cases) {
    const control = button(guide.label, "select-use-case", "use-case-card");
    control.dataset.useCaseId = guide.use_case_id;
    control.setAttribute(
      "aria-pressed",
      String(state.selectedUseCaseId === guide.use_case_id),
    );
    const question = document.createElement("span");
    question.className = "use-case-question";
    question.textContent = guide.question;
    control.append(question);
    grid.append(control);
  }
  section.append(grid);

  const selected = useCaseById(state.selectedUseCaseId);
  if (!selected) return section;

  const result = document.createElement("aside");
  result.className = "use-case-result";
  const head = document.createElement("div");
  head.className = "section-heading-row";
  const copy = document.createElement("div");
  copy.append(heading(3, selected.label), paragraph(selected.rationale));
  const clear = button("Clear", "clear-use-case");
  head.append(copy, clear);
  result.append(head);

  const shortlist = document.createElement("div");
  shortlist.className = "shortlist-grid";
  for (const id of selected.language_ids) {
    const profile = PRODUCT_MODEL.languages.find(
      (item) => item.entity_id === id,
    );
    if (!profile) continue;
    const card = document.createElement("article");
    card.className = "shortlist-card";
    card.append(heading(3, profile.label), paragraph(profile.tagline));
    const add = button(
      state.compareLanguageIds.includes(id)
        ? "Remove from compare"
        : "Add to compare",
      "toggle-compare",
      "secondary-action",
    );
    add.dataset.entityId = id;
    card.append(add);
    shortlist.append(card);
  }
  result.append(shortlist);
  section.append(result);
  return section;
}

function renderListBlock(
  title: string,
  values: readonly string[],
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "profile-list-block";
  const label = document.createElement("strong");
  label.textContent = title;
  const list = document.createElement("ul");
  for (const value of values) {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  }
  wrapper.append(label, list);
  return wrapper;
}

function humanizeDecisionValue(value: string): string {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderDecisionProfile(profile: LanguageProductProfile): HTMLElement {
  const decision = LANGUAGE_DECISION_PROFILES[profile.entity_id];
  const details = document.createElement("details");
  details.className = "decision-profile";
  const summary = document.createElement("summary");
  summary.textContent = "Performance & complexity";
  details.append(summary);

  if (!decision) {
    details.append(paragraph("Editorial decision profile unavailable."));
    return details;
  }

  const grid = document.createElement("div");
  grid.className = "decision-profile-grid";
  const groups = [
    [
      "Performance",
      [
        ["Throughput potential", decision.performance.throughput_potential],
        ["Startup", decision.performance.startup],
        ["Runtime overhead", decision.performance.runtime_overhead],
        ["Latency predictability", decision.performance.latency_predictability],
        ["Build speed", decision.performance.build_speed],
      ],
    ],
    [
      "Complexity",
      [
        ["Learning curve", decision.complexity.learning_curve],
        ["Language surface", decision.complexity.language_surface],
        ["Memory reasoning", decision.complexity.memory_reasoning],
        ["Toolchain", decision.complexity.toolchain],
        ["Dependencies", decision.complexity.dependency_management],
        ["Deployment", decision.complexity.deployment],
      ],
    ],
    [
      "Ecosystem",
      [
        ["Maturity", decision.ecosystem.maturity],
        ["Breadth", decision.ecosystem.breadth],
        ["Tooling", decision.ecosystem.tooling],
        ["Hiring pool", decision.ecosystem.hiring_pool],
      ],
    ],
  ] as const;

  for (const [title, rows] of groups) {
    const group = document.createElement("section");
    group.className = "decision-profile-group";
    group.append(heading(3, title));
    const list = document.createElement("dl");
    for (const [label, value] of rows) {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = humanizeDecisionValue(value);
      list.append(term, description);
    }
    group.append(list);
    grid.append(group);
  }

  const note = paragraph(
    "Editorial Preview: workload, runtime, compiler, team and deployment context can move these bands.",
  );
  note.className = "decision-profile-note";
  details.append(grid, note);
  return details;
}

function renderPreviewFacts(
  entry: CatalogPreviewEntryView | undefined,
): HTMLElement {
  const details = document.createElement("details");
  details.className = "profile-facts";
  const summary = document.createElement("summary");
  summary.textContent = `Preview facts (${entry?.facts.length ?? 0})`;
  details.append(summary);

  if (!entry || entry.facts.length === 0) {
    details.append(paragraph("No Preview facts recorded."));
    return details;
  }

  const list = document.createElement("dl");
  for (const fact of entry.facts) {
    const term = document.createElement("dt");
    term.textContent = fact.label;
    const value = document.createElement("dd");
    value.textContent = factValue(fact);
    if (fact.sources.length > 0) {
      const sources = document.createElement("span");
      sources.className = "profile-source-links";
      sources.append(document.createTextNode(" · "));
      fact.sources.forEach((source, index) => {
        if (index > 0) sources.append(document.createTextNode(", "));
        const href = safeHttps(source.reference);
        if (!href) {
          sources.append(document.createTextNode(source.title));
          return;
        }
        const link = document.createElement("a");
        link.href = href;
        link.rel = "noopener noreferrer";
        link.textContent = source.title;
        sources.append(link);
      });
      value.append(sources);
    }
    list.append(term, value);
  }
  details.append(list);
  return details;
}

function renderLanguageCard(
  profile: LanguageProductProfile,
  entry: CatalogPreviewEntryView | undefined,
  state: ProductUiState,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "product-card language-profile-card";
  card.dataset.catalogEntry = "true";
  card.dataset.catalogSearchText = productSearchText(profile, entry);

  const head = document.createElement("div");
  head.className = "product-card-head";
  head.append(heading(3, profile.label), badge("Editorial Preview"));
  card.append(head, paragraph(profile.tagline));

  const tags = document.createElement("div");
  tags.className = "profile-tags";
  for (const category of profile.categories) tags.append(badge(category));
  card.append(tags);

  const build = document.createElement("div");
  build.className = "build-path";
  const buildLabel = document.createElement("strong");
  buildLabel.textContent = "Build";
  const buildValue = document.createElement("code");
  buildValue.textContent = profile.build_path;
  build.append(buildLabel, buildValue);
  card.append(build);

  const columns = document.createElement("div");
  columns.className = "profile-columns";
  columns.append(
    renderListBlock("Good for", profile.good_for),
    renderListBlock("Watch for", profile.watch_for),
  );
  card.append(columns);

  const actions = document.createElement("div");
  actions.className = "profile-actions";
  const compare = button(
    state.compareLanguageIds.includes(profile.entity_id)
      ? "Remove from compare"
      : "Add to compare",
    "toggle-compare",
  );
  compare.dataset.entityId = profile.entity_id;
  actions.append(compare);
  card.append(
    actions,
    renderDecisionProfile(profile),
    renderPreviewFacts(entry),
  );
  return card;
}

function renderLanguageCatalog(
  catalog: CatalogPreviewView,
  state: ProductUiState,
): HTMLElement {
  const byId = new Map(
    catalog.languages.map((entry) => [entry.entity_id, entry]),
  );
  const grid = document.createElement("div");
  grid.className = "product-card-grid";
  for (const profile of PRODUCT_MODEL.languages) {
    grid.append(
      renderLanguageCard(profile, byId.get(profile.entity_id), state),
    );
  }
  return grid;
}

const LICENSE_FAMILY_LABELS: Readonly<Record<string, string>> = {
  "license-transition": "License transition",
  "network-copyleft": "Network copyleft",
  permissive: "Permissive",
  "public-domain-like": "Public-domain-like",
  "source-available": "Source available",
  "strong-copyleft": "Strong copyleft",
  "weak-copyleft": "Weak copyleft",
};

function renderLicenseAxis(): HTMLElement {
  const axis = document.createElement("div");
  axis.className = "license-axis";
  const models = [
    [
      "Open Source",
      "OSI-style freedom to use, modify and redistribute; obligations differ by license.",
    ],
    [
      "Source available",
      "Source is visible, but business-purpose, hosting, competition or eligibility restrictions may apply.",
    ],
    [
      "Public-domain-like",
      "Designed to minimize copyright control and downstream obligations.",
    ],
    [
      "License transition",
      "Mechanisms such as change dates schedule different terms rather than defining one static permission set.",
    ],
  ] as const;
  for (const [label, copy] of models) {
    const step = document.createElement("div");
    step.className = "license-axis-step";
    step.append(badge(label), paragraph(copy));
    axis.append(step);
  }
  const note = paragraph(
    "These are different legal models, not one linear scale from permissive to restrictive.",
  );
  note.className = "license-axis-note";
  axis.append(note);
  return axis;
}

function renderLicenseDecisionProfile(
  profile: LicenseProductProfile,
): HTMLElement {
  const decision = LICENSE_DECISION_PROFILES[profile.entity_id];
  const details = document.createElement("details");
  details.className = "license-decision-profile";
  const summary = document.createElement("summary");
  summary.textContent = "Rights, restrictions & compliance";
  details.append(summary);

  if (!decision) {
    details.append(
      paragraph("Editorial license decision profile unavailable."),
    );
    return details;
  }

  const metadata = document.createElement("div");
  metadata.className = "license-metadata";
  metadata.append(
    badge(humanizeDecisionValue(decision.model)),
    badge(`OSI: ${humanizeDecisionValue(decision.osi_status)}`),
  );
  if (decision.spdx_id) metadata.append(badge(`SPDX: ${decision.spdx_id}`));

  const sourceHref = safeHttps(decision.canonical_source);
  if (sourceHref) {
    const source = document.createElement("a");
    source.href = sourceHref;
    source.rel = "noopener noreferrer";
    source.textContent = "Canonical terms";
    source.className = "canonical-license-link";
    metadata.append(source);
  }

  const grid = document.createElement("div");
  grid.className = "license-decision-grid";
  const groups = [
    [
      "Rights",
      [
        ["Use", decision.rights.use],
        ["Modify", decision.rights.modify],
        ["Redistribute", decision.rights.redistribute],
        ["Commercial use", decision.rights.commercial_use],
        ["Internal business", decision.rights.internal_business_use],
        ["SaaS / hosting", decision.rights.saas_hosting],
        ["Competitive use", decision.rights.competitive_use],
      ],
    ],
    [
      "Obligations",
      [
        ["Source disclosure", decision.obligations.source_disclosure],
        ["Notice", decision.obligations.notice],
        ["Patent grant", decision.obligations.patent_grant],
        ["Time rule", decision.obligations.time_rule],
      ],
    ],
    [
      "Decision cost",
      [
        ["Compliance complexity", decision.compliance_complexity],
        ["Business-model friction", decision.business_model_friction],
      ],
    ],
  ] as const;

  for (const [title, rows] of groups) {
    const group = document.createElement("section");
    group.className = "license-decision-group";
    group.append(heading(3, title));
    const list = document.createElement("dl");
    for (const [label, value] of rows) {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = humanizeDecisionValue(value);
      list.append(term, description);
    }
    group.append(list);
    grid.append(group);
  }

  const note = paragraph(
    "Editorial Preview only. Read the canonical terms for legal interpretation and project-specific compliance.",
  );
  note.className = "decision-profile-note";
  details.append(metadata, grid, note);
  return details;
}

function renderLicenseCard(
  profile: LicenseProductProfile,
  entry: CatalogPreviewEntryView | undefined,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "product-card license-profile-card";
  card.dataset.catalogEntry = "true";
  card.dataset.catalogSearchText = productSearchText(profile, entry);

  const head = document.createElement("div");
  head.className = "product-card-head";
  head.append(
    heading(3, profile.label),
    badge(LICENSE_FAMILY_LABELS[profile.family] ?? profile.family),
  );
  card.append(head, paragraph(profile.tagline));

  const good = paragraph(`Good when: ${profile.good_when}`);
  good.className = "license-good";
  const watch = paragraph(`Watch for: ${profile.watch_for}`);
  watch.className = "license-watch";
  card.append(
    good,
    watch,
    renderLicenseDecisionProfile(profile),
    renderPreviewFacts(entry),
  );
  return card;
}

function renderLicenseCatalog(catalog: CatalogPreviewView): HTMLElement {
  const byId = new Map(
    catalog.licenses.map((entry) => [entry.entity_id, entry]),
  );
  const wrapper = document.createElement("div");
  wrapper.append(renderLicenseAxis());

  const grid = document.createElement("div");
  grid.className = "product-card-grid";
  for (const profile of PRODUCT_MODEL.licenses) {
    grid.append(renderLicenseCard(profile, byId.get(profile.entity_id)));
  }
  wrapper.append(grid);
  return wrapper;
}

function renderCatalog(
  catalog: CatalogPreviewView,
  state: ProductUiState,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "product-catalog";
  section.id = "catalog";

  const title =
    state.mode === "languages" ? "Language catalogue" : "License navigator";
  const intro =
    state.mode === "languages"
      ? "Read the card first; open the Preview facts only when you need the mechanics."
      : "Start with the licensing intent, then inspect the Preview facts. This is navigation help, not legal advice.";
  section.append(heading(2, title), paragraph(intro));

  const controls = document.createElement("div");
  controls.className = "catalog-controls";
  for (const [mode, label] of [
    ["languages", "Languages"],
    ["licenses", "Licenses"],
  ] as const) {
    const control = button(label, "catalog-mode", "catalog-mode-button");
    control.dataset.mode = mode;
    control.setAttribute("aria-pressed", String(state.mode === mode));
    controls.append(control);
  }

  const searchLabel = document.createElement("label");
  searchLabel.className = "catalog-search";
  const searchTitle = document.createElement("span");
  searchTitle.textContent = "Search";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder =
    state.mode === "languages"
      ? "Rust, Windows, embedded, Cargo…"
      : "PolyForm, source available, SaaS, patent, copyleft…";
  search.dataset.action = "catalog-search";
  searchLabel.append(searchTitle, search);
  controls.append(searchLabel);
  section.append(controls);

  section.append(
    state.mode === "languages"
      ? renderLanguageCatalog(catalog, state)
      : renderLicenseCatalog(catalog),
  );
  return section;
}

function compareFact(
  entry: CatalogPreviewEntryView | undefined,
  dimensionId: string,
): string {
  return factValue(factsByDimension(entry).get(dimensionId));
}

function renderCompare(
  catalog: CatalogPreviewView,
  state: ProductUiState,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "compare-section";
  section.id = "compare";

  const headingRow = document.createElement("div");
  headingRow.className = "section-heading-row";
  const copy = document.createElement("div");
  copy.append(
    heading(2, `Compare languages (${state.compareLanguageIds.length}/4)`),
    paragraph(
      "Pick up to four languages. Editorial summaries sit beside the same Preview facts used by the catalogue.",
    ),
  );
  headingRow.append(copy);
  if (state.compareLanguageIds.length > 0) {
    headingRow.append(button("Clear comparison", "clear-compare"));
  }
  section.append(headingRow);

  if (state.compareLanguageIds.length === 0) {
    const empty = paragraph(
      "Add languages from a use-case shortlist or catalogue card to build a side-by-side matrix.",
    );
    empty.className = "compare-empty";
    section.append(empty);
    return section;
  }

  const profileMap = new Map(
    PRODUCT_MODEL.languages.map((profile) => [profile.entity_id, profile]),
  );
  const entryMap = new Map(
    catalog.languages.map((entry) => [entry.entity_id, entry]),
  );
  const selected = state.compareLanguageIds
    .map((id) => profileMap.get(id))
    .filter((profile): profile is LanguageProductProfile => Boolean(profile));

  const wrapper = document.createElement("div");
  wrapper.className = "compare-table-wrap";
  const table = document.createElement("table");
  table.className = "compare-table";

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  const blank = document.createElement("th");
  blank.scope = "col";
  blank.textContent = "Attribute";
  headRow.append(blank);
  for (const profile of selected) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = profile.label;
    headRow.append(cell);
  }
  head.append(headRow);
  table.append(head);

  const body = document.createElement("tbody");
  const rows: Array<{
    label: string;
    value: (profile: LanguageProductProfile) => string;
  }> = [
    { label: "Character", value: (profile) => profile.tagline },
    { label: "Build", value: (profile) => profile.build_path },
    { label: "Good for", value: (profile) => profile.good_for.join(", ") },
    { label: "Watch for", value: (profile) => profile.watch_for.join(", ") },
    {
      label: "Throughput potential",
      value: (profile) =>
        humanizeDecisionValue(
          LANGUAGE_DECISION_PROFILES[profile.entity_id]?.performance
            .throughput_potential ?? "unknown",
        ),
    },
    {
      label: "Startup",
      value: (profile) =>
        humanizeDecisionValue(
          LANGUAGE_DECISION_PROFILES[profile.entity_id]?.performance.startup ??
            "unknown",
        ),
    },
    {
      label: "Learning curve",
      value: (profile) =>
        humanizeDecisionValue(
          LANGUAGE_DECISION_PROFILES[profile.entity_id]?.complexity
            .learning_curve ?? "unknown",
        ),
    },
    {
      label: "Language complexity",
      value: (profile) =>
        humanizeDecisionValue(
          LANGUAGE_DECISION_PROFILES[profile.entity_id]?.complexity
            .language_surface ?? "unknown",
        ),
    },
    {
      label: "Deployment complexity",
      value: (profile) =>
        humanizeDecisionValue(
          LANGUAGE_DECISION_PROFILES[profile.entity_id]?.complexity
            .deployment ?? "unknown",
        ),
    },
    {
      label: "Ecosystem breadth",
      value: (profile) =>
        humanizeDecisionValue(
          LANGUAGE_DECISION_PROFILES[profile.entity_id]?.ecosystem.breadth ??
            "unknown",
        ),
    },
  ];
  for (const dimensionId of PRODUCT_COMPARE_DIMENSIONS) {
    const label =
      catalog.languages
        .flatMap((entry) => entry.facts)
        .find((fact) => fact.dimension_id === dimensionId)?.label ??
      dimensionId;
    rows.push({
      label,
      value: (profile) =>
        compareFact(entryMap.get(profile.entity_id), dimensionId),
    });
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = row.label;
    tr.append(label);
    for (const profile of selected) {
      const cell = document.createElement("td");
      cell.textContent = row.value(profile);
      tr.append(cell);
    }
    body.append(tr);
  }
  table.append(body);
  wrapper.append(table);
  section.append(wrapper);
  return section;
}

export function renderProductExperience(
  catalog: CatalogPreviewView,
  state: ProductUiState,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "product-experience";
  wrapper.append(
    renderHero(catalog),
    renderUseCases(state),
    renderCompare(catalog, state),
    renderCatalog(catalog, state),
  );
  return wrapper;
}
