// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import candidates from "../../catalog/unassessed-candidates.v0.2.json" with {
  type: "json",
};
import type { TypedValue } from "../decision/types.ts";
import {
  PRODUCT_COMPARE_DIMENSIONS,
  PRODUCT_MODEL,
} from "../product/catalog.ts";
import {
  DEFAULT_PRODUCT_FILTERS,
  languageMatchesFilters,
  licenseMatchesFilters,
  type ProductFilterState,
} from "../product/catalog-filters.ts";
import {
  INDEX_ONLY_LANGUAGES,
  INDEX_ONLY_LICENSES,
  LICENSE_IDENTITIES,
} from "../product/identity-index.ts";
import { LANGUAGE_BAND_EVIDENCE_NOTICE } from "../product/language-band-provenance.ts";
import { LANGUAGE_DECISION_PROFILES } from "../product/language-decision-profiles.ts";
import {
  DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
  LANGUAGE_INFORMATION,
  type LanguageDiscoveryFilters,
  type LanguageInformation,
  type LanguageOrder,
  languageEra,
  languageInformationByName,
  languageRank,
} from "../product/language-information.ts";
import {
  licenseCatalogHref,
  readerExampleStatus,
  readerProfileByName,
  readerProfileTerms,
} from "../product/language-reader-profiles.ts";
import type { LanguageReaderProfile } from "../product/language-reader-validation.ts";
import { LICENSE_DECISION_PROFILES } from "../product/license-decision-profiles.ts";
import type {
  LanguageProductProfile,
  LicenseProductProfile,
  UseCaseGuide,
} from "../product/types.ts";
import {
  type CatalogStatus,
  candidateMatchesFilters,
} from "./catalog-navigation.ts";
import {
  type DecisionTone,
  languageDecisionTone,
  licenseDecisionTone,
} from "./decision-tones.ts";
import {
  type CatalogLanguageCompareRow,
  readerComparisonRows,
} from "./language-reader-comparison.ts";
import {
  renderLanguageReaderBrief,
  renderLanguageReaderProfile,
} from "./language-reader-profile.ts";
import { renderLicenseComparison } from "./license-comparison.ts";

export type { CatalogLanguageCompareRow } from "./language-reader-comparison.ts";

import {
  licenseDisclosureScopeQualifier,
  networkSourceOfferQualifier,
} from "./license-qualifications.ts";
import { renderPreviewEvidenceInventory } from "./preview-evidence-inventory.ts";
import { factProvenanceDisclosure } from "./source-provenance.ts";
import type {
  CatalogPreviewEntryView,
  CatalogPreviewFactView,
  CatalogPreviewView,
} from "./types.ts";
import { renderWorkloadEvidence } from "./workload-evidence.ts";

export type ProductCatalogMode = "languages" | "licenses";

export interface ProductUiState {
  mode: ProductCatalogMode;
  status: CatalogStatus;
  order: LanguageOrder;
  discovery: LanguageDiscoveryFilters;
  view: "cards" | "list";
  selectedUseCaseId: string | null;
  compareLanguageIds: readonly string[];
  compareLicenseIds: readonly string[];
  filters: ProductFilterState;
}

export const DEFAULT_PRODUCT_UI_STATE: ProductUiState = {
  mode: "languages",
  status: "all",
  order: "asc",
  discovery: { ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS },
  view: "list",
  selectedUseCaseId: null,
  compareLanguageIds: [],
  compareLicenseIds: [],
  filters: { ...DEFAULT_PRODUCT_FILTERS },
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

function requireReaderProfile(name: string): LanguageReaderProfile {
  const reader = readerProfileByName(name);
  if (!reader) throw new Error(`Reader profile missing for ${name}`);
  return reader;
}
function languageReaderDisclosure(
  name: string,
  id: string,
): HTMLDetailsElement {
  const reader = requireReaderProfile(name);
  const details = renderLanguageReaderProfile(reader, {
    licenseHref: licenseCatalogHref,
    exampleStatus: readerExampleStatus(reader),
  });
  details.dataset.readerEntityId = id;
  return details;
}

function compareButton(
  entityId: string,
  state: ProductUiState,
  className?: string,
): HTMLButtonElement {
  const selected = state.compareLanguageIds.includes(entityId);
  const control = button(
    selected ? "Remove from compare" : "Add to compare",
    "toggle-compare",
    className,
  );
  control.dataset.entityId = entityId;
  if (!selected && state.compareLanguageIds.length >= 4) {
    control.disabled = true;
    control.title = "Four languages selected. Remove one to add another.";
  }
  return control;
}

function licenseCompareButton(
  entityId: string,
  state: ProductUiState,
): HTMLButtonElement {
  const selected = state.compareLicenseIds.includes(entityId);
  const control = button(
    selected ? "Remove from compare" : "Add to compare",
    "toggle-license-compare",
  );
  control.dataset.entityId = entityId;
  if (!selected && state.compareLicenseIds.length >= 4) {
    control.disabled = true;
    control.title = "Four licenses selected. Remove one to add another.";
  }
  return control;
}

function selectControl(
  labelText: string,
  filterKey: keyof ProductFilterState,
  value: string,
  options: readonly (readonly [string, string])[],
  includeUnknown = true,
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "catalog-filter";
  const title = document.createElement("span");
  title.textContent = labelText;
  const select = document.createElement("select");
  select.dataset.action = "product-filter";
  select.dataset.filterKey = filterKey;
  const choices = includeUnknown
    ? [...options, ["unknown", "Unknown / not assessed"] as const]
    : options;
  for (const [optionValue, optionLabel] of choices) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionLabel;
    option.selected = optionValue === value;
    select.append(option);
  }
  label.append(title, select);
  return label;
}

function discoveryControl(
  labelText: string,
  key: keyof LanguageDiscoveryFilters,
  value: string,
  choices: readonly (readonly [string, string])[],
): HTMLLabelElement {
  const label = selectControl(
    labelText,
    "languageCategory",
    value,
    choices,
    false,
  );
  const select = label.children[1] as HTMLSelectElement;
  select.dataset.action = "language-discovery";
  select.dataset.discoveryKey = key;
  delete select.dataset.filterKey;
  return label;
}

function requireLanguageInformation(name: string): LanguageInformation {
  const info = languageInformationByName(name);
  if (!info) throw new Error(`Language information missing for ${name}`);
  return info;
}

function languageInformationTerms(name: string): readonly string[] {
  const info = requireLanguageInformation(name);
  return [info.summary, ...info.uses, info.lifecycleNote ?? ""];
}

function recordLanguageMetadata(card: HTMLElement, name: string): void {
  const info = requireLanguageInformation(name);
  card.dataset.languageEra = languageEra(info);
  card.dataset.languageLifecycle = info.lifecycle;
  const rank = languageRank(name);
  if (rank !== null) card.dataset.languageRank = String(rank);
  if (info.introduced !== null)
    card.dataset.languageIntroduced = String(info.introduced);
}

function informationLink(label: string, url: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.textContent = label;
  link.href = url;
  link.rel = "noopener noreferrer";
  return link;
}

function renderLanguageInformation(name: string): HTMLElement {
  const info = requireLanguageInformation(name);
  const block = document.createElement("div");
  block.className = "language-information";
  const summary = paragraph(info.summary);
  summary.className = "language-information-summary";
  const uses = paragraph(`Used for: ${info.uses.join(", ")}.`);
  uses.className = "language-information-uses";
  const metadata = document.createElement("div");
  metadata.className = "language-information-tags product-stats";
  const era = languageEra(info);
  metadata.append(
    badge(
      info.introduced === null
        ? "Documented origin year unverified"
        : "Documented origin " +
            info.introduced +
            " · " +
            (era === "classic" ? "Classic" : "Modern"),
    ),
  );
  const rank = languageRank(name);
  metadata.append(
    badge(rank === null ? "Outside cited top 10" : `GitHub 2025 #${rank}`),
  );
  const lifecycleLabels = {
    maintained: "Maintained implementation",
    experimental: "Experimental implementation",
    retired: "Retired / deprecated project",
    unknown: "Lifecycle unverified",
  };
  metadata.append(badge(lifecycleLabels[info.lifecycle]));

  const details = document.createElement("details");
  details.className = "language-information-sources";
  const title = document.createElement("summary");
  title.textContent = "Language information & sources";
  details.append(
    title,
    paragraph(
      "Descriptive information checked " +
        LANGUAGE_INFORMATION.checked_on +
        ". Origin years refer to the cited design, implementation or publication milestone; open the source for its context. These sources do not assess performance, complexity or project suitability.",
    ),
  );
  const links = document.createElement("ul");
  for (const item of info.links) {
    const row = document.createElement("li");
    row.append(informationLink(item.label, item.url));
    links.append(row);
  }
  if (info.introducedSource) {
    const row = document.createElement("li");
    row.append(
      informationLink("Documented origin year source", info.introducedSource),
    );
    links.append(row);
  }
  if (info.lifecycleNote) details.append(paragraph(info.lifecycleNote));
  if (info.lifecycleSource) {
    const row = document.createElement("li");
    row.append(
      informationLink("Implementation lifecycle source", info.lifecycleSource),
    );
    links.append(row);
  }
  details.append(links);
  block.append(summary, uses, metadata, details);
  return block;
}

const TONE_SYMBOLS: Record<DecisionTone, string> = {
  favorable: "+",
  mixed: "±",
  unfavorable: "−",
  neutral: "·",
};

function metricBadge(value: string, tone: DecisionTone): HTMLSpanElement {
  const text = humanizeDecisionValue(value);
  const node = badge(
    `${TONE_SYMBOLS[tone]} ${text}`,
    `metric-badge metric-badge--${tone}`,
  );
  const description = `${text}: ${tone} trade-off`;
  node.setAttribute("role", "img");
  node.setAttribute("aria-label", description);
  node.title = description;
  return node;
}

function quickFact(
  labelText: string,
  value: string,
  tone: DecisionTone,
): HTMLElement {
  const item = document.createElement("span");
  item.className = "decision-quick-fact";
  const label = document.createElement("span");
  label.className = "decision-quick-label";
  label.textContent = labelText;
  item.append(label, metricBadge(value, tone));
  return item;
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
    ...("build_path" in profile
      ? [
          ...languageInformationTerms(profile.label),
          ...readerProfileTerms(profile.label),
        ]
      : []),
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
  const languageTotal =
    PRODUCT_MODEL.languages.length + INDEX_ONLY_LANGUAGES.length;
  const licenseTotal =
    PRODUCT_MODEL.licenses.length + INDEX_ONLY_LICENSES.length;
  const candidateFacts = [...catalog.languages, ...catalog.licenses].reduce(
    (total, entry) => total + entry.facts.length,
    0,
  );
  stats.append(
    badge(`${languageTotal} language identities`),
    badge(`${licenseTotal} license identities`),
    badge(`${languageTotal} reader profiles`),
    badge(`${PRODUCT_MODEL.languages.length} editorial language previews`),
    badge(`${PRODUCT_MODEL.licenses.length} detailed licenses`),
    badge(`${candidateFacts} Preview facts`),
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

  function guideControl(guide: UseCaseGuide): HTMLButtonElement {
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
    return control;
  }

  const mainGuides = PRODUCT_MODEL.use_cases.slice(0, 15);
  const additionalGuides = PRODUCT_MODEL.use_cases.slice(15);
  const grid = document.createElement("div");
  grid.className = "use-case-grid";
  for (const guide of mainGuides) {
    grid.append(guideControl(guide));
  }
  section.append(grid);

  if (additionalGuides.length > 0) {
    const more = document.createElement("details");
    more.className = "use-case-more";
    more.dataset.useCaseMore = "true";
    more.open = additionalGuides.some(
      (guide) => guide.use_case_id === state.selectedUseCaseId,
    );
    const summary = document.createElement("summary");
    summary.textContent = `Explore ${additionalGuides.length} more project types`;
    const extraGrid = document.createElement("div");
    extraGrid.className = "use-case-grid";
    for (const guide of additionalGuides) {
      extraGrid.append(guideControl(guide));
    }
    more.append(summary, extraGrid);
    section.append(more);
  }

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
    const add = compareButton(id, state, "secondary-action");
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

function renderLanguageQuickFacts(
  profile: LanguageProductProfile,
): HTMLElement {
  const decision = LANGUAGE_DECISION_PROFILES[profile.entity_id];
  const strip = document.createElement("div");
  strip.className = "decision-quick-strip";
  if (!decision) return strip;
  strip.append(
    quickFact(
      "Throughput",
      decision.performance.throughput_potential,
      languageDecisionTone(
        "throughput_potential",
        decision.performance.throughput_potential,
      ),
    ),
    quickFact(
      "Learning",
      decision.complexity.learning_curve,
      languageDecisionTone(
        "learning_curve",
        decision.complexity.learning_curve,
      ),
    ),
    quickFact(
      "Deployment",
      decision.complexity.deployment,
      languageDecisionTone("deployment", decision.complexity.deployment),
    ),
    quickFact(
      "Ecosystem",
      decision.ecosystem.breadth,
      languageDecisionTone("breadth", decision.ecosystem.breadth),
    ),
  );
  return strip;
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
        [
          "throughput_potential",
          "Throughput potential",
          decision.performance.throughput_potential,
        ],
        ["startup", "Startup", decision.performance.startup],
        [
          "runtime_overhead",
          "Runtime overhead",
          decision.performance.runtime_overhead,
        ],
        [
          "latency_predictability",
          "Latency predictability",
          decision.performance.latency_predictability,
        ],
        ["build_speed", "Build speed", decision.performance.build_speed],
      ],
    ],
    [
      "Complexity",
      [
        [
          "learning_curve",
          "Learning curve",
          decision.complexity.learning_curve,
        ],
        [
          "language_surface",
          "Language surface",
          decision.complexity.language_surface,
        ],
        [
          "memory_reasoning",
          "Memory reasoning",
          decision.complexity.memory_reasoning,
        ],
        ["toolchain", "Toolchain", decision.complexity.toolchain],
        [
          "dependency_management",
          "Dependencies",
          decision.complexity.dependency_management,
        ],
        ["deployment", "Deployment", decision.complexity.deployment],
      ],
    ],
    [
      "Ecosystem",
      [
        ["maturity", "Maturity", decision.ecosystem.maturity],
        ["breadth", "Breadth", decision.ecosystem.breadth],
        ["tooling", "Tooling", decision.ecosystem.tooling],
        ["hiring_pool", "Hiring pool", decision.ecosystem.hiring_pool],
      ],
    ],
  ] as const;

  for (const [title, rows] of groups) {
    const group = document.createElement("section");
    group.className = "decision-profile-group";
    group.append(heading(3, title));
    const list = document.createElement("div");
    list.className = "metric-group-rows";
    for (const [metric, label, value] of rows) {
      const row = document.createElement("div");
      row.className = "metric-row";
      const term = document.createElement("span");
      term.className = "metric-row-label";
      term.textContent = label;
      row.append(term, metricBadge(value, languageDecisionTone(metric, value)));
      list.append(row);
    }
    group.append(list);
    grid.append(group);
  }

  const note = paragraph(
    `${LANGUAGE_BAND_EVIDENCE_NOTICE} Workload, runtime, compiler, team and deployment context can move these bands.`,
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
    const origin = document.createElement("small");
    origin.className = "preview-provenance-disclosure";
    origin.textContent = ` · ${factProvenanceDisclosure(fact)}`;
    value.append(origin);
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
  card.dataset.catalogName = profile.label;
  card.dataset.catalogStatus = "editorial";
  card.dataset.entityId = profile.entity_id;
  card.dataset.catalogSearchText = productSearchText(profile, entry);
  recordLanguageMetadata(card, profile.label);

  const head = document.createElement("div");
  head.className = "product-card-head";
  head.append(heading(3, profile.label), badge("Editorial Preview"));
  card.append(
    head,
    renderLanguageInformation(profile.label),
    renderLanguageReaderBrief(requireReaderProfile(profile.label)),
    paragraph(profile.tagline),
  );

  const tags = document.createElement("div");
  tags.className = "profile-tags";
  for (const category of profile.categories) tags.append(badge(category));
  card.append(tags, renderLanguageQuickFacts(profile));
  const bandStatus = paragraph(
    "Unverified editorial estimates · audit v0.3 · not benchmark results.",
  );
  bandStatus.className = "decision-profile-note";
  bandStatus.dataset.languageBandEvidence = "unverified";
  card.append(bandStatus);

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
  const compare = compareButton(profile.entity_id, state);
  actions.append(compare);
  card.append(
    actions,
    languageReaderDisclosure(profile.label, profile.entity_id),
    renderDecisionProfile(profile),
    renderPreviewFacts(entry),
  );
  const measuredEvidence = renderWorkloadEvidence(profile.entity_id);
  if (measuredEvidence) card.append(measuredEvidence);
  card.append(profileLink(profile.entity_id));
  return card;
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
    "Editorial Preview only. Patent fields describe express license text, not patent clearance; for GPL-2.0-or-later verify the selected GPL version and contributor. Read canonical terms for project-specific compliance.",
  );
  note.className = "decision-profile-note";
  const networkQualifier = networkSourceOfferQualifier(profile.entity_id);
  if (networkQualifier) details.append(paragraph(networkQualifier));
  const scopeQualifier = licenseDisclosureScopeQualifier(profile.entity_id);
  if (scopeQualifier) details.append(paragraph(scopeQualifier));
  details.append(metadata, grid, note);
  return details;
}

function renderLicenseQuickFacts(profile: LicenseProductProfile): HTMLElement {
  const decision = LICENSE_DECISION_PROFILES[profile.entity_id];
  const strip = document.createElement("div");
  strip.className = "decision-quick-strip";
  if (!decision) return strip;
  strip.append(
    quickFact(
      "Model",
      decision.model,
      licenseDecisionTone("model", decision.model),
    ),
    quickFact(
      "Commercial",
      decision.rights.commercial_use,
      licenseDecisionTone("commercial_use", decision.rights.commercial_use),
    ),
    quickFact(
      "SaaS",
      decision.rights.saas_hosting,
      licenseDecisionTone("saas_hosting", decision.rights.saas_hosting),
    ),
    quickFact(
      "Compete",
      decision.rights.competitive_use,
      licenseDecisionTone("competitive_use", decision.rights.competitive_use),
    ),
    quickFact(
      "OSI",
      decision.osi_status,
      licenseDecisionTone("osi_status", decision.osi_status),
    ),
  );
  return strip;
}

function renderLicenseCard(
  profile: LicenseProductProfile,
  entry: CatalogPreviewEntryView | undefined,
  state: ProductUiState,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "product-card license-profile-card";
  card.dataset.catalogEntry = "true";
  card.dataset.catalogName = profile.label;
  card.dataset.catalogStatus = "editorial";
  card.dataset.entityId = profile.entity_id;
  card.dataset.catalogSearchText = productSearchText(profile, entry);
  const spdxId = LICENSE_DECISION_PROFILES[profile.entity_id]?.spdx_id;
  const identity = LICENSE_IDENTITIES.find((item) => item.id === spdxId);
  if (identity) card.dataset.identityOsiApproved = String(identity.osiApproved);

  const head = document.createElement("div");
  head.className = "product-card-head";
  head.append(
    heading(3, profile.label),
    badge(LICENSE_FAMILY_LABELS[profile.family] ?? profile.family),
  );
  card.append(
    head,
    paragraph(profile.tagline),
    renderLicenseQuickFacts(profile),
  );

  const good = paragraph(`Good when: ${profile.good_when}`);
  good.className = "license-good";
  const watch = paragraph(`Watch for: ${profile.watch_for}`);
  watch.className = "license-watch";
  card.append(
    good,
    watch,
    licenseCompareButton(profile.entity_id, state),
    renderLicenseDecisionProfile(profile),
    renderPreviewFacts(entry),
    profileLink(profile.entity_id),
  );
  return card;
}

type UnassessedRecord = (typeof candidates.records)[number];
/** Resolve only pinned v0.2 records; arbitrary URL input never creates a profile. */
export function pinnedCandidateById(
  id: string | null,
): UnassessedRecord | null {
  return id
    ? (candidates.records.find((record) => record.id === id) ?? null)
    : null;
}

function renderUnassessedProfile(record: UnassessedRecord): HTMLElement {
  if (
    record.stage !== "UNASSESSED_PREVIEW" ||
    record.review_status !== "NOT_REVIEWED" ||
    record.source_status !== "PINNED_IDENTITY" ||
    record.claim_refs.length !== 0 ||
    !Object.values(record.assessments).every((value) => value === "UNKNOWN")
  ) {
    throw new Error("Unassessed candidate metadata violated trust boundary");
  }
  const details = document.createElement("details");
  details.className = "identity-profile";
  details.dataset.candidateId = record.id;
  const summary = document.createElement("summary");
  summary.textContent = "Assessment details · pending";
  const values = paragraph(
    Object.entries(record.assessments)
      .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`)
      .join(" · "),
  );
  const pin =
    record.kind === "language"
      ? candidates.source_pins.linguist_commit
      : candidates.source_pins.spdx_commit;
  const provenance = paragraph(`ID: ${record.id} · Source commit: ${pin}`);
  const reference = document.createElement("a");
  reference.href = record.reference;
  reference.textContent = "Pinned source";
  reference.rel = "noopener noreferrer";
  const permalink = document.createElement("a");
  permalink.className = "candidate-permalink";
  permalink.dataset.candidatePermalink = "true";
  permalink.href = `?candidate=${encodeURIComponent(record.id)}#catalog`;
  permalink.textContent = "Direct link to this profile";
  details.append(summary, values, provenance, reference, permalink);
  return details;
}

function profileLink(id: string, candidate = false): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "catalog-profile-link";
  link.href = candidate
    ? `?candidate=${encodeURIComponent(id)}#catalog`
    : `?profile=${encodeURIComponent(id)}#catalog`;
  link.textContent = "Open profile";
  return link;
}
function renderIdentityCard(
  record: UnassessedRecord,
  state: ProductUiState,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "product-card identity-card";
  card.dataset.catalogEntry = "true";
  card.dataset.identityEntry = "true";
  card.dataset.catalogStatus = "unassessed";
  card.dataset.catalogName = "spdx_id" in record ? record.spdx_id : record.name;
  card.dataset.catalogSearchText = [
    card.dataset.catalogName,
    record.name,
    ...(record.kind === "language"
      ? [
          ...languageInformationTerms(record.name),
          ...readerProfileTerms(record.name),
        ]
      : []),
  ]
    .join(" ")
    .normalize("NFKD")
    .toLocaleLowerCase("en-US");
  if (record.kind === "language") {
    recordLanguageMetadata(card, record.name);
    card.dataset.entityId = record.id;
  }
  if ("osi_approved_source_flag" in record)
    card.dataset.identityOsiApproved = String(record.osi_approved_source_flag);
  const head = document.createElement("div");
  head.className = "product-card-head";
  head.append(
    heading(3, card.dataset.catalogName),
    badge("Assessments pending"),
  );
  card.append(
    head,
    record.kind === "language"
      ? renderLanguageInformation(record.name)
      : paragraph(record.name),
    paragraph(
      record.kind === "language"
        ? "Performance, complexity and suitability assessments pending · UNKNOWN. Descriptive sources do not make this a Reviewed recommendation."
        : "Profile available: identity and pinned source. Rights, obligations and applicability remain UNKNOWN until assessed; not a Reviewed recommendation.",
    ),
    profileLink(record.id, true),
    renderUnassessedProfile(record),
  );
  if (record.kind === "language")
    card.append(
      renderLanguageReaderBrief(requireReaderProfile(record.name)),
      compareButton(record.id, state),
      languageReaderDisclosure(record.name, record.id),
    );
  return card;
}
function renderCatalogResults(
  catalog: CatalogPreviewView,
  state: ProductUiState,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "catalog-results";
  if (state.mode === "licenses") wrapper.append(renderLicenseAxis());
  const count = paragraph("");
  count.className = "catalog-result-count";
  count.dataset.catalogVisibleCount = "true";
  count.setAttribute("role", "status");
  count.setAttribute("aria-live", "polite");
  wrapper.append(count);
  const grid = document.createElement("div");
  grid.className = "product-card-grid";
  grid.dataset.catalogGrid = "true";
  const byId = new Map(
    [...catalog.languages, ...catalog.licenses].map((entry) => [
      entry.entity_id,
      entry,
    ]),
  );
  if (state.status !== "unassessed") {
    if (state.mode === "languages") {
      for (const profile of PRODUCT_MODEL.languages.filter((p) =>
        languageMatchesFilters(p, state.filters),
      ))
        grid.append(
          renderLanguageCard(profile, byId.get(profile.entity_id), state),
        );
    } else {
      for (const profile of PRODUCT_MODEL.licenses.filter((p) =>
        licenseMatchesFilters(p, state.filters),
      ))
        grid.append(
          renderLicenseCard(profile, byId.get(profile.entity_id), state),
        );
    }
  }
  if (
    state.status !== "editorial" &&
    candidateMatchesFilters(state.mode, state.filters)
  ) {
    for (const record of candidates.records) {
      if (record.kind === (state.mode === "languages" ? "language" : "license"))
        grid.append(renderIdentityCard(record, state));
    }
  }
  wrapper.append(grid);
  const more = button("Show more results", "identity-more", "identity-more");
  more.dataset.identityMore = "true";
  more.setAttribute("aria-controls", "catalog");
  wrapper.append(more);
  return wrapper;
}

function renderCatalog(
  catalog: CatalogPreviewView,
  state: ProductUiState,
): HTMLElement {
  const section = document.createElement("section");
  section.className = `product-catalog catalog-view-${state.view}`;
  section.id = "catalog";

  const title =
    state.mode === "languages" ? "Language catalogue" : "License navigator";
  const intro =
    state.mode === "languages"
      ? "Read the card first; open the Preview facts only when you need the mechanics."
      : "Start with the licensing intent, then inspect the Preview facts. This is navigation help, not legal advice.";
  section.append(heading(2, title), paragraph(intro));
  const toneGuide = paragraph(
    "Badge tones: + Favorable; ± Mixed; − Unfavorable; · Neutral. Context still matters.",
  );
  toneGuide.className = "metric-tone-guide";
  section.append(toneGuide);

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
  search.maxLength = 200;
  search.setAttribute("aria-controls", "catalog");
  search.dataset.action = "catalog-search";
  searchLabel.append(searchTitle, search);
  controls.append(searchLabel);
  const sortChoices: readonly (readonly [string, string])[] = [
    ["asc", "Name A–Z"],
    ["desc", "Name Z–A"],
    ...(state.mode === "languages"
      ? ([
          ["common", "Common first · GitHub 2025"],
          ["oldest", "Oldest documented origins"],
          ["newest", "Newest documented origins"],
          ["lifecycle", "Implementation status"],
        ] as const)
      : []),
  ];
  for (const [label, action, current, choices] of [
    [
      "Data status",
      "catalog-status",
      state.status,
      [
        ["all", "All identities"],
        ["editorial", "Editorial profiles"],
        ["unassessed", "Profiles · assessments pending"],
      ],
    ],
    ["Sort", "catalog-order", state.order, sortChoices],
    [
      "View",
      "catalog-view",
      state.view,
      [
        ["list", "Compact list"],
        ["cards", "Detailed cards"],
      ],
    ],
  ] as const) {
    const control = selectControl(
      label,
      "languageCategory",
      current,
      choices,
      false,
    );
    (control.children[1] as HTMLSelectElement).dataset.action = action;
    controls.append(control);
  }
  const share = document.createElement("a");
  share.className = "catalog-share";
  share.textContent = "Link to this view";
  share.title =
    "Copy or bookmark this link to preserve search, filters and sort.";
  share.href = `?catalog=${state.mode}#catalog`;
  controls.append(share);
  section.append(controls);

  const filters = document.createElement("div");
  filters.className = "catalog-filter-grid";
  if (state.mode === "languages") {
    filters.append(
      discoveryControl("Usage · GitHub 2025", "usage", state.discovery.usage, [
        ["any", "Any reported usage"],
        ["ranked", "In the cited top 10"],
        ["unranked", "Outside the cited top 10"],
      ]),
      discoveryControl("Documented origin era", "era", state.discovery.era, [
        ["any", "Any documented origin era"],
        ["classic", "Origins before 1990"],
        ["modern", "Origins 1990 onward"],
        ["unknown", "Documented origin year unverified"],
      ]),
      discoveryControl(
        "Implementation lifecycle",
        "lifecycle",
        state.discovery.lifecycle,
        [
          ["any", "Any lifecycle"],
          ["maintained", "Maintained implementation"],
          ["experimental", "Experimental implementation"],
          ["retired", "Retired / deprecated project"],
          ["unknown", "Lifecycle unverified"],
        ],
      ),
      selectControl(
        "Category",
        "languageCategory",
        state.filters.languageCategory,
        [
          ["any", "Any category"],
          ["assurance", "Assurance"],
          ["domain", "Domain"],
          ["fundament", "General-purpose"],
          ["functional", "Functional"],
          ["legacy", "Legacy / established"],
          ["managed", "Managed runtime"],
          ["science", "Science / numerical"],
          ["scripting", "Scripting"],
          ["system", "Systems"],
          ["tool", "Tooling / shell"],
        ],
      ),
      selectControl(
        "Throughput",
        "languageThroughput",
        state.filters.languageThroughput,
        [
          ["any", "Any throughput"],
          ["high", "High"],
          ["medium", "Medium"],
          ["low", "Low"],
        ],
      ),
      selectControl(
        "Learning curve",
        "languageLearning",
        state.filters.languageLearning,
        [
          ["any", "Any learning curve"],
          ["low", "Low"],
          ["medium", "Medium"],
          ["high", "High"],
        ],
      ),
      selectControl(
        "Ecosystem",
        "languageEcosystem",
        state.filters.languageEcosystem,
        [
          ["any", "Any ecosystem"],
          ["broad", "Broad"],
          ["moderate", "Moderate"],
          ["niche", "Niche"],
        ],
      ),
    );
  } else {
    filters.append(
      selectControl(
        "License model",
        "licenseModel",
        state.filters.licenseModel,
        [
          ["any", "Any model"],
          ["open-source", "Open Source"],
          ["source-available", "Source available"],
          ["public-domain-like", "Public-domain-like"],
          ["license-transition", "License transition"],
        ],
      ),
      selectControl(
        "Commercial use",
        "licenseCommercial",
        state.filters.licenseCommercial,
        [
          ["any", "Any"],
          ["yes", "Allowed"],
          ["conditional", "Conditional"],
          ["no", "Not granted"],
        ],
      ),
      selectControl(
        "SaaS / hosting",
        "licenseSaas",
        state.filters.licenseSaas,
        [
          ["any", "Any"],
          ["yes", "Allowed"],
          ["conditional", "Conditional"],
          ["no", "Not granted"],
        ],
      ),
      selectControl(
        "Competitive use",
        "licenseCompetitive",
        state.filters.licenseCompetitive,
        [
          ["any", "Any"],
          ["yes", "Allowed"],
          ["conditional", "Conditional"],
          ["no", "Restricted"],
        ],
      ),
      selectControl("OSI status", "licenseOsi", state.filters.licenseOsi, [
        ["any", "Any OSI status"],
        ["approved", "Approved"],
        ["not-approved", "Not approved"],
        ["not-applicable", "Not applicable"],
      ]),
    );
  }
  const reset = button("Reset filters", "reset-product-filters");
  reset.className = "catalog-filter-reset";
  filters.append(reset);
  if (state.mode === "licenses") {
    const osi = selectControl(
      "SPDX source flag",
      "licenseOsi",
      "any",
      [
        ["any", "All pinned identities"],
        ["yes", "OSI-approved flag"],
        ["no", "No OSI-approved flag"],
      ],
      false,
    );
    (osi.children[1] as HTMLSelectElement).dataset.action = "identity-osi";
    filters.append(osi);
  }
  if (state.mode === "languages") {
    const discoveryNote = paragraph(
      LANGUAGE_INFORMATION.ranking.label +
        " (" +
        LANGUAGE_INFORMATION.ranking.period +
        "), measured by " +
        LANGUAGE_INFORMATION.ranking.metric +
        ". Outside its top 10 does not mean unpopular or forgotten. Shell is an aggregate report category, not a Bash ranking. Documented origins may refer to design, implementation or publication rather than a first release. Era is independent of maintenance: an older language may still be maintained. Lifecycle describes the cited implementation; unverified dates and statuses stay unverified.",
    );
    discoveryNote.className = "catalog-filter-note";
    const rankingLink = informationLink(
      "Ranking source and methodology",
      LANGUAGE_INFORMATION.ranking.url,
    );
    filters.append(discoveryNote, rankingLink);
  }
  const note = paragraph(
    "Assessment filters match known editorial values or explicit Unknown. Profiles with pending assessments keep UNKNOWN values; profile availability does not imply a rating.",
  );
  note.className = "catalog-filter-note";
  filters.append(note);
  const layout = document.createElement("div");
  layout.className = "catalog-layout";
  layout.append(filters, renderCatalogResults(catalog, state));
  section.append(layout);
  const exportControl = button(
    "Export all 841 profiles with pending assessments (CSV)",
    "export-unassessed-csv",
    "catalog-filter-reset",
  );
  exportControl.title =
    "All pinned v0.2 candidates, independent of active search filters. UNKNOWN remains unknown.";
  section.append(exportControl);
  const searchEmpty = paragraph(
    "No matches for that search. Try a different keyword or reset the filters.",
  );
  searchEmpty.className = "catalog-search-empty";
  searchEmpty.dataset.catalogSearchEmpty = "true";
  searchEmpty.hidden = true;
  section.append(searchEmpty);
  return section;
}

function compareFact(
  entry: CatalogPreviewEntryView | undefined,
  dimensionId: string,
): string {
  return factValue(factsByDimension(entry).get(dimensionId));
}

export type LanguageCompareRow = {
  dimensionId?: string;
  label: string;
  value: (profile: LanguageProductProfile) => string;
};

export function selectEditorialLanguages(
  ids: readonly string[],
): LanguageProductProfile[] {
  if (ids.length > 4 || new Set(ids).size !== ids.length) {
    throw new Error(
      "Language comparison requires up to four distinct editorial IDs",
    );
  }
  const profiles = new Map(
    PRODUCT_MODEL.languages.map((profile) => [profile.entity_id, profile]),
  );
  return ids.map((id) => {
    const profile = profiles.get(id);
    if (!profile)
      throw new Error("Language is not an Editorial Preview profile");
    return profile;
  });
}

export function languageComparisonRows(
  catalog: CatalogPreviewView,
): LanguageCompareRow[] {
  const entryMap = new Map(
    catalog.languages.map((entry) => [entry.entity_id, entry]),
  );
  const rows: LanguageCompareRow[] = [
    { label: "Character", value: (profile) => profile.tagline },
    { label: "Build", value: (profile) => profile.build_path },
    { label: "Good for", value: (profile) => profile.good_for.join(", ") },
    { label: "Watch for", value: (profile) => profile.watch_for.join(", ") },
    {
      label: "Performance / complexity evidence status",
      value: () => LANGUAGE_BAND_EVIDENCE_NOTICE,
    },
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
      dimensionId,
      label,
      value: (profile) =>
        compareFact(entryMap.get(profile.entity_id), dimensionId),
    });
  }

  return rows;
}

export interface CatalogLanguageSelection {
  entity_id: string;
  label: string;
  editorial: LanguageProductProfile | null;
  reader: LanguageReaderProfile;
}
/** Selection is bounded to canonical editorial or pinned language IDs. */
export function selectCatalogLanguages(
  ids: readonly string[],
): CatalogLanguageSelection[] {
  if (ids.length > 4 || new Set(ids).size !== ids.length)
    throw new Error(
      "Language comparison requires up to four distinct catalogue IDs",
    );
  return ids.map((id) => {
    const editorial = PRODUCT_MODEL.languages.find(
      (profile) => profile.entity_id === id,
    );
    if (editorial)
      return {
        entity_id: id,
        label: editorial.label,
        editorial,
        reader: requireReaderProfile(editorial.label),
      };
    const candidate = pinnedCandidateById(id);
    if (candidate?.kind !== "language")
      throw new Error(
        "Language comparison ID is not a pinned catalogue language",
      );
    return {
      entity_id: id,
      label: candidate.name,
      editorial: null,
      reader: requireReaderProfile(candidate.name),
    };
  });
}
export function catalogLanguageComparisonRows(
  catalog: CatalogPreviewView,
): CatalogLanguageCompareRow[] {
  return readerComparisonRows(catalog, languageComparisonRows(catalog));
}

function renderCompareEvidence(
  fact: CatalogPreviewFactView | undefined,
): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "compare-evidence";
  details.dataset.compareEvidence = "true";
  const summary = document.createElement("summary");
  summary.textContent = `Preview evidence · ${fact?.review_status ?? "UNKNOWN"} · ${fact?.sources.length ?? 0} source(s)`;
  details.append(summary);
  const disclosure = document.createElement("p");
  disclosure.className = "preview-provenance-disclosure";
  disclosure.textContent = factProvenanceDisclosure(fact);
  details.append(disclosure);
  const claim = document.createElement("code");
  claim.textContent = fact?.claim_id ?? "No Preview claim recorded";
  details.append(claim);
  if (!fact || fact.sources.length === 0) {
    details.append(
      paragraph("No sources recorded for this Preview dimension."),
    );
    return details;
  }
  const sources = document.createElement("div");
  sources.className = "profile-source-links";
  for (const source of fact.sources) {
    const href = safeHttps(source.reference);
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.rel = "noopener noreferrer";
      link.textContent = source.title;
      sources.append(link);
    } else {
      sources.append(paragraph(`Unlinked source: ${source.title}`));
    }
  }
  details.append(sources);
  return details;
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
      "Compare up to four catalogue languages using sourced reader profiles. Profiles with pending assessments keep UNKNOWN ratings; editorial bands remain unverified estimates. No measured cross-language ranking is claimed.",
    ),
  );
  headingRow.append(copy);
  if (state.compareLanguageIds.length > 0) {
    headingRow.append(button("Clear comparison", "clear-compare"));
    headingRow.append(
      button("Export selected comparison (CSV)", "export-language-compare"),
    );
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

  const selected = selectCatalogLanguages(state.compareLanguageIds);

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
  const rows = catalogLanguageComparisonRows(catalog);

  for (const row of rows) {
    const tr = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = row.label;
    tr.append(label);
    for (const profile of selected) {
      const cell = document.createElement("td");
      const value = row.value(profile);
      if (row.label === "Example code") {
        const pre = document.createElement("pre");
        pre.textContent = value;
        pre.setAttribute("tabindex", "0");
        pre.setAttribute("aria-label", `${profile.label} comparison example`);
        cell.append(pre);
      } else {
        const text = paragraph(value);
        text.className = "compare-row-value";
        cell.append(text);
      }
      const references = document.createElement("div");
      references.className = "compare-reader-sources";
      for (const source of row.sources(profile)) {
        const href = safeHttps(source.url);
        if (href) {
          const link = document.createElement("a");
          link.textContent = source.label;
          link.href = href;
          link.rel = "noopener noreferrer";
          references.append(link);
        } else references.append(paragraph(`Unlinked source: ${source.url}`));
      }
      if (references.children.length > 0) cell.append(references);
      if (row.dimensionId) {
        const fact = row.previewFact?.(profile);
        cell.append(renderCompareEvidence(fact));
      }
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
  const nav = document.createElement("nav");
  nav.className = "catalog-navigation";
  nav.setAttribute("aria-label", "Quick navigation");
  for (const [href, label] of [
    ["#catalog", "Skip to catalogue"],
    ["?catalog=languages#catalog", "Browse languages"],
    ["?catalog=licenses#catalog", "Browse licenses"],
    ["#explore", "Project guides"],
  ] as const) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    nav.append(link);
  }
  wrapper.append(nav);
  wrapper.append(
    renderHero(catalog),
    renderPreviewEvidenceInventory(catalog),
    renderUseCases(state),
    state.mode === "languages"
      ? renderCompare(catalog, state)
      : renderLicenseComparison(state.compareLicenseIds, catalog),
    renderCatalog(catalog, state),
  );
  return wrapper;
}
