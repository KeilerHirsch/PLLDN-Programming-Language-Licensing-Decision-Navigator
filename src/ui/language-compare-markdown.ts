// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readerSafeHttps } from "../product/language-reader-validation.ts";
import {
  filterLanguageComparisonRows,
  prioritizeUnresolvedComparisonRows,
} from "./language-compare-filter.ts";
import {
  catalogLanguageComparisonRows,
  selectCatalogLanguages,
} from "./product.ts";
import type { CatalogPreviewView } from "./types.ts";
import { trForLocale, type UiLocale } from "./ui-locale.ts";

/** A plain, source-bound record of the displayed comparison, not a new recommendation. */
export function exportLanguageComparisonMarkdown(
  ids: readonly string[],
  catalog: CatalogPreviewView,
  onlyDifferences: boolean,
  unresolvedFirst = false,
  createdAt?: string,
  locale: UiLocale = "en",
): string {
  if (
    createdAt !== undefined &&
    (Number.isNaN(Date.parse(createdAt)) ||
      new Date(createdAt).toISOString() !== createdAt)
  ) {
    throw new Error(
      "Report creation time must be an explicit ISO 8601 UTC timestamp",
    );
  }
  if (catalog.status !== "Preview" || !catalog.knowledge_snapshot) {
    throw new Error("Comparison report requires a named Preview snapshot");
  }
  const selected = selectCatalogLanguages(ids);
  if (selected.length === 0) throw new Error("Select a catalogue language");
  const rows = prioritizeUnresolvedComparisonRows(
    filterLanguageComparisonRows(
      catalogLanguageComparisonRows(catalog),
      selected,
      onlyDifferences,
    ),
    selected,
    unresolvedFirst,
  );
  const safe = (value: string): string =>
    value.replace(/[\r\n]+/gu, " / ").replace(/[\\`*_{}[\]()#+.!|>]/gu, "\\$&");
  const label = (value: string): string => trForLocale(value, locale);
  const lines = [
    `# ${label("PLLDN language comparison")}`,
    "",
    `- ${label("View")}: ${label(onlyDifferences && selected.length > 1 ? "Only differences" : "All attributes")}`,
    `- ${label("Row order")}: ${label(unresolvedFirst ? "Unresolved first" : "Original catalogue order")}`,
    `- ${label("Preview snapshot")}: ${safe(catalog.knowledge_snapshot)}`,
    ...(createdAt
      ? [`- ${label("Report created at (UTC)")}: ${createdAt}`]
      : []),
    `- ${label("Selected")}: ${selected.map((entry) => safe(entry.label)).join(", ")}`,
    `- ${label("Evidence: sourced reader information and Editorial Preview; not a Reviewed recommendation.")}`,
    `- ${label("UNKNOWN and NOT_REVIEWED are not assessed. No measured cross-language ranking or legal certification is claimed.")}`,
  ];
  for (const row of rows) {
    lines.push("", `## ${safe(label(row.label))}`);
    for (const profile of selected) {
      lines.push(
        "",
        `### ${safe(profile.label)} (${safe(profile.entity_id)})`,
        "",
        safe(row.value(profile)),
      );
      const sources = row.sources(profile);
      for (const source of sources) {
        const matching = profile.reader.sources.find(
          (record) =>
            record.url === source.url && record.label === source.label,
        );
        // Keep unlinked text in a report, but never turn an unsafe URI into a link.
        const uri = readerSafeHttps(source.url)
          ? source.url
          : "(unlinked reference)";
        lines.push(
          `- ${label("Source")}: ${safe(source.label)} (${label("Checked")}: ${safe(matching?.checked_on ?? "UNKNOWN")}): ${uri}`,
        );
      }
      if (row.previewFact) {
        const claim = row.previewFact(profile);
        lines.push(
          `- ${label("Preview evidence")}: ${label("claim")} ${safe(claim?.claim_id ?? "UNKNOWN")}; ${label("review status")} ${safe(claim?.review_status ?? "UNKNOWN")}`,
        );
      }
    }
  }
  return `${lines.join("\n")}\n`;
}
