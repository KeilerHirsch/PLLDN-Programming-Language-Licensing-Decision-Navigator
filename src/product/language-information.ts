// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import raw from "../../catalog/language-information.v1.json" with {
  type: "json",
};
import { PRODUCT_MODEL } from "./catalog.ts";
import { LANGUAGE_IDENTITIES } from "./identity-index.ts";

export type LanguageLifecycle =
  | "maintained"
  | "experimental"
  | "retired"
  | "unknown";
export type LanguageOrder =
  | "asc"
  | "desc"
  | "common"
  | "oldest"
  | "newest"
  | "lifecycle";
export interface LanguageDiscoveryFilters {
  usage: "any" | "ranked" | "unranked";
  era: "any" | "classic" | "modern" | "unknown";
  lifecycle: "any" | LanguageLifecycle;
}
export interface LanguageInformation {
  name: string;
  summary: string;
  uses: string[];
  links: { label: string; url: string }[];
  introduced: number | null;
  introducedSource: string | null;
  lifecycle: LanguageLifecycle;
  lifecycleNote: string | null;
  lifecycleSource: string | null;
}
export interface LanguageInformationCatalog {
  schema_version: number;
  checked_on: string;
  ranking: {
    label: string;
    metric: string;
    period: string;
    url: string;
    ordered_names: string[];
  };
  records: LanguageInformation[];
}
export const DEFAULT_LANGUAGE_DISCOVERY_FILTERS: LanguageDiscoveryFilters = {
  usage: "any",
  era: "any",
  lifecycle: "any",
};
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Language information: ${message}`);
}
function object(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  requireValue(
    value && typeof value === "object" && !Array.isArray(value),
    "expected object",
  );
  const record = value as Record<string, unknown>;
  requireValue(
    Object.keys(record).length === keys.length &&
      keys.every((key) => Object.hasOwn(record, key)),
    "unexpected or missing fields",
  );
  return record;
}
function text(value: unknown, min = 1, max = 300): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.length <= max &&
    !/\p{Cc}/u.test(value)
  );
}
function https(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /[\p{Cc}\s]/u.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

/** Validate the complete local dataset; malformed entries never disappear silently. */
export function validateLanguageInformation(
  input: unknown,
  expectedNames: readonly string[],
): LanguageInformationCatalog {
  const catalog = object(input, [
    "schema_version",
    "checked_on",
    "ranking",
    "records",
  ]);
  requireValue(catalog.schema_version === 1, "unsupported schema");
  const date = catalog.checked_on;
  requireValue(
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(date),
    "invalid checked date",
  );
  const parsedDate = new Date(date);
  requireValue(
    !Number.isNaN(parsedDate.valueOf()) &&
      parsedDate.toISOString().slice(0, 10) === date,
    "invalid checked date",
  );
  const ranking = object(catalog.ranking, [
    "label",
    "metric",
    "period",
    "url",
    "ordered_names",
  ]);
  requireValue(
    text(ranking.label) &&
      text(ranking.metric) &&
      text(ranking.period) &&
      https(ranking.url),
    "invalid ranking provenance",
  );
  requireValue(
    Array.isArray(ranking.ordered_names) && ranking.ordered_names.length === 10,
    "ranking must contain the ten reported identities",
  );
  const expected = new Set(expectedNames);
  requireValue(
    expected.size === expectedNames.length && expected.size > 0,
    "invalid expected identities",
  );
  const ranked = ranking.ordered_names;
  requireValue(
    ranked.every(
      (name) =>
        typeof name === "string" && (expected.has(name) || name === "Shell"),
    ) && new Set(ranked).size === ranked.length,
    "invalid or duplicate ranked identity",
  );
  requireValue(
    Array.isArray(catalog.records) && catalog.records.length === expected.size,
    "incomplete identity coverage",
  );
  const seen = new Set<string>();
  const records: LanguageInformation[] = catalog.records.map((item) => {
    const r = object(item, [
      "name",
      "summary",
      "uses",
      "links",
      "introduced",
      "introducedSource",
      "lifecycle",
      "lifecycleNote",
      "lifecycleSource",
    ]);
    requireValue(
      text(r.name, 1, 80) && expected.has(r.name) && !seen.has(r.name),
      "unknown or duplicate identity",
    );
    seen.add(r.name);
    requireValue(
      text(r.summary, 50, 600),
      `missing useful introduction for ${r.name}`,
    );
    requireValue(
      Array.isArray(r.uses) &&
        r.uses.length >= 2 &&
        r.uses.length <= 6 &&
        r.uses.every((use) => text(use, 2, 120)) &&
        new Set(r.uses).size === r.uses.length,
      `invalid use areas for ${r.name}`,
    );
    requireValue(
      Array.isArray(r.links) && r.links.length >= 1 && r.links.length <= 8,
      `missing primary sources for ${r.name}`,
    );
    const links = r.links.map((item) => {
      const link = object(item, ["label", "url"]);
      requireValue(
        text(link.label, 1, 120) && https(link.url),
        `unsafe or invalid source for ${r.name}`,
      );
      return { label: link.label, url: link.url };
    });
    const sources = new Set(links.map((link) => link.url));
    requireValue(
      sources.size === links.length,
      `duplicate source for ${r.name}`,
    );
    const introduced = r.introduced;
    requireValue(
      introduced === null ||
        (typeof introduced === "number" &&
          Number.isInteger(introduced) &&
          introduced >= 1940 &&
          introduced <= parsedDate.getUTCFullYear()),
      `invalid origin year for ${r.name}`,
    );
    requireValue(
      introduced === null
        ? r.introducedSource === null
        : typeof r.introducedSource === "string" &&
            sources.has(r.introducedSource),
      `origin lacks bound source for ${r.name}`,
    );
    const lifecycle = r.lifecycle;
    requireValue(
      lifecycle === "maintained" ||
        lifecycle === "experimental" ||
        lifecycle === "retired" ||
        lifecycle === "unknown",
      `invalid lifecycle for ${r.name}`,
    );
    requireValue(
      lifecycle === "unknown"
        ? r.lifecycleNote === null && r.lifecycleSource === null
        : text(r.lifecycleNote, 10, 600) &&
            typeof r.lifecycleSource === "string" &&
            sources.has(r.lifecycleSource),
      `lifecycle lacks scoped evidence for ${r.name}`,
    );
    return r as unknown as LanguageInformation;
  });
  return {
    schema_version: 1,
    checked_on: date,
    ranking: ranking as unknown as LanguageInformationCatalog["ranking"],
    records,
  };
}
const expectedNames = [
  ...new Set([
    ...LANGUAGE_IDENTITIES,
    ...PRODUCT_MODEL.languages.map((profile) => profile.label),
  ]),
];
export const LANGUAGE_INFORMATION = validateLanguageInformation(
  raw,
  expectedNames,
);
const byName = new Map(
  LANGUAGE_INFORMATION.records.map((record) => [record.name, record]),
);
export function languageInformationByName(
  name: string,
): LanguageInformation | undefined {
  return byName.get(name);
}
export function languageRank(name: string): number | null {
  if (!byName.has(name)) return null;
  const index = LANGUAGE_INFORMATION.ranking.ordered_names.indexOf(name);
  return index < 0 ? null : index + 1;
}
export function languageEra(
  info: LanguageInformation,
): "classic" | "modern" | "unknown" {
  return info.introduced === null
    ? "unknown"
    : info.introduced < 1990
      ? "classic"
      : "modern";
}
export function matchesLanguageInformation(
  info: LanguageInformation,
  filters: LanguageDiscoveryFilters,
): boolean {
  const rank = languageRank(info.name);
  return (
    (filters.usage === "any" ||
      (filters.usage === "ranked" ? rank !== null : rank === null)) &&
    (filters.era === "any" || languageEra(info) === filters.era) &&
    (filters.lifecycle === "any" || info.lifecycle === filters.lifecycle)
  );
}
export function languageMatchesDiscovery(
  name: string,
  filters: LanguageDiscoveryFilters,
): boolean {
  const info = languageInformationByName(name);
  return !!info && matchesLanguageInformation(info, filters);
}
function nameOrder(a: string, b: string): number {
  const fold = (s: string) => s.normalize("NFKD").toLocaleLowerCase("en-US");
  const x = fold(a),
    y = fold(b);
  return x < y ? -1 : x > y ? 1 : a < b ? -1 : a > b ? 1 : 0;
}
const lifecycleOrder: Record<LanguageLifecycle, number> = {
  maintained: 0,
  experimental: 1,
  retired: 2,
  unknown: 3,
};
/** Popularity is report-specific. Unreported origins/status sort after known values. */
export function compareLanguageNames(
  a: string,
  b: string,
  order: LanguageOrder,
): number {
  const x = byName.get(a),
    y = byName.get(b);
  let value = 0;
  if (order === "common")
    value = (languageRank(a) ?? Infinity) - (languageRank(b) ?? Infinity);
  if (order === "oldest" || order === "newest") {
    const yearX = x?.introduced,
      yearY = y?.introduced;
    if (yearX == null || yearY == null)
      value = (yearX == null ? 1 : 0) - (yearY == null ? 1 : 0);
    else value = (yearX - yearY) * (order === "newest" ? -1 : 1);
  }
  if (order === "lifecycle")
    value =
      lifecycleOrder[x?.lifecycle ?? "unknown"] -
      lifecycleOrder[y?.lifecycle ?? "unknown"];
  return (
    (Number.isNaN(value) ? 0 : value) ||
    nameOrder(a, b) * (order === "desc" ? -1 : 1)
  );
}
