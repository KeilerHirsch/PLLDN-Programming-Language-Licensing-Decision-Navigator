// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import {
  DEFAULT_PRODUCT_FILTERS,
  type ProductFilterState,
} from "../product/catalog-filters.ts";
import {
  DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
  type LanguageDiscoveryFilters,
  type LanguageOrder,
} from "../product/language-information.ts";
export type CatalogStatus = "all" | "editorial" | "unassessed";
export interface CatalogNavigation {
  mode: "languages" | "licenses";
  query: string;
  status: CatalogStatus;
  order: LanguageOrder;
  discovery: LanguageDiscoveryFilters;
  view: "cards" | "list";
  spdx: "any" | "yes" | "no";
  filters: ProductFilterState;
}
const options: Readonly<Record<keyof ProductFilterState, readonly string[]>> = {
  languageCategory: [
    "any",
    "unknown",
    "assurance",
    "domain",
    "fundament",
    "functional",
    "legacy",
    "managed",
    "science",
    "scripting",
    "system",
    "tool",
  ],
  languageThroughput: ["any", "unknown", "high", "medium", "low"],
  languageLearning: ["any", "unknown", "high", "medium", "low"],
  languageEcosystem: ["any", "unknown", "broad", "moderate", "niche"],
  licenseModel: [
    "any",
    "unknown",
    "open-source",
    "source-available",
    "public-domain-like",
    "license-transition",
  ],
  licenseCommercial: ["any", "unknown", "yes", "conditional", "no"],
  licenseSaas: ["any", "unknown", "yes", "conditional", "no"],
  licenseCompetitive: ["any", "unknown", "yes", "conditional", "no"],
  licenseOsi: ["any", "unknown", "approved", "not-approved", "not-applicable"],
};
const discoveryOptions: Readonly<
  Record<keyof LanguageDiscoveryFilters, readonly string[]>
> = {
  usage: ["any", "ranked", "unranked"],
  era: ["any", "classic", "modern", "unknown"],
  lifecycle: ["any", "maintained", "experimental", "retired", "unknown"],
};
const languageOrders: readonly LanguageOrder[] = [
  "asc",
  "desc",
  "common",
  "oldest",
  "newest",
  "lifecycle",
];
/** URL state is navigation only, never a source of assessments or entities. */
export function readCatalogNavigation(search: string): CatalogNavigation {
  const p = new URLSearchParams(search);
  const filters = { ...DEFAULT_PRODUCT_FILTERS };
  for (const key of Object.keys(options) as (keyof ProductFilterState)[]) {
    const value = p.get(key);
    if (value && options[key].includes(value)) filters[key] = value;
  }
  const mode = p.get("catalog") === "licenses" ? "licenses" : "languages";
  const discovery = { ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS };
  if (mode === "languages") {
    for (const key of Object.keys(
      discoveryOptions,
    ) as (keyof LanguageDiscoveryFilters)[]) {
      const value = p.get(key);
      if (value && discoveryOptions[key].includes(value))
        Object.assign(discovery, { [key]: value });
    }
  }
  const order = p.get("order");
  const status = p.get("status"),
    spdx = p.get("spdx");
  return {
    mode,
    query: (p.get("q") ?? "").trim().slice(0, 200),
    status: status === "editorial" || status === "unassessed" ? status : "all",
    order:
      mode === "languages" && languageOrders.includes(order as LanguageOrder)
        ? (order as LanguageOrder)
        : order === "desc"
          ? "desc"
          : "asc",
    discovery,
    view: p.get("view") === "cards" ? "cards" : "list",
    spdx:
      mode === "licenses" && (spdx === "yes" || spdx === "no") ? spdx : "any",
    filters,
  };
}
export function catalogNavigationHref(state: CatalogNavigation): string {
  const p = new URLSearchParams({ catalog: state.mode });
  if (state.query) p.set("q", state.query.trim().slice(0, 200));
  if (state.status !== "all") p.set("status", state.status);
  if (
    state.order === "desc" ||
    (state.mode === "languages" &&
      languageOrders.includes(state.order) &&
      state.order !== "asc")
  )
    p.set("order", state.order);
  if (state.mode === "languages") {
    for (const key of Object.keys(
      discoveryOptions,
    ) as (keyof LanguageDiscoveryFilters)[]) {
      const value = state.discovery[key];
      if (value !== "any" && discoveryOptions[key].includes(value))
        p.set(key, value);
    }
  }
  if (state.view !== "list") p.set("view", state.view);
  if (state.mode === "licenses" && state.spdx !== "any")
    p.set("spdx", state.spdx);
  for (const key of Object.keys(options) as (keyof ProductFilterState)[]) {
    if (
      state.filters[key] !== "any" &&
      options[key].includes(state.filters[key])
    )
      p.set(key, state.filters[key]);
  }
  return "?" + p.toString() + "#catalog";
}
export function candidateMatchesFilters(
  mode: CatalogNavigation["mode"],
  filters: ProductFilterState,
): boolean {
  const prefix = mode === "languages" ? "language" : "license";
  return Object.entries(filters).every(
    ([key, value]) =>
      !key.startsWith(prefix) || value === "any" || value === "unknown",
  );
}
export function compareCatalogNames(
  a: string,
  b: string,
  order: "asc" | "desc",
): number {
  const fold = (s: string) => s.normalize("NFKD").toLocaleLowerCase("en-US");
  const x = fold(a),
    y = fold(b);
  return (
    (x < y ? -1 : x > y ? 1 : a < b ? -1 : a > b ? 1 : 0) *
    (order === "desc" ? -1 : 1)
  );
}
