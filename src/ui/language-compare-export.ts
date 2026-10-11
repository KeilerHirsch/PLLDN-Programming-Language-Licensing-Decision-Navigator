// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { PRODUCT_COMPARE_DIMENSIONS } from "../product/catalog.ts";
import { exportCsvCell } from "../product/unassessed-export.ts";
import {
  languageComparisonRows,
  selectEditorialLanguages,
} from "./product.ts";
import type { CatalogPreviewView } from "./types.ts";

/** Exactly the same editorial and Preview values as the on-screen language table. */
export function exportEditorialLanguageCompareCsv(
  ids: readonly string[],
  catalog: CatalogPreviewView,
): string {
  if (catalog.status !== "Preview" || !catalog.knowledge_snapshot) {
    throw new Error("Language comparison requires a named Preview snapshot");
  }
  const selected = selectEditorialLanguages(ids);
  if (selected.length === 0) {
    throw new Error("Select at least one Editorial Preview language");
  }
  const entries = new Map(
    catalog.languages.map((entry) => [entry.entity_id, entry]),
  );
  const lines: string[][] = [
    ["Attribute", ...selected.map((profile) => profile.label)],
    ["Entity ID", ...selected.map((profile) => profile.entity_id)],
    [
      "Evidence tier",
      ...selected.map(() => "Editorial Preview (not Reviewed)"),
    ],
    ["Preview snapshot", ...selected.map(() => catalog.knowledge_snapshot)],
    ...languageComparisonRows(catalog).map((row) => [
      row.label,
      ...selected.map((profile) => row.value(profile)),
    ]),
  ];
  for (const dimensionId of PRODUCT_COMPARE_DIMENSIONS) {
    const records = selected.map((profile) =>
      entries
        .get(profile.entity_id)
        ?.facts.find((fact) => fact.dimension_id === dimensionId),
    );
    const label = records.find((fact) => fact !== undefined)?.label ?? dimensionId;
    lines.push(
      [
        `Preview claim ID: ${label}`,
        ...records.map((fact) => fact?.claim_id ?? "UNKNOWN"),
      ],
      [
        `Preview review status: ${label}`,
        ...records.map((fact) => fact?.review_status ?? "UNKNOWN"),
      ],
      [
        `Preview sources: ${label}`,
        ...records.map(
          (fact) =>
            fact?.sources.map((source) => source.reference).join(" | ") ||
            "UNKNOWN",
        ),
      ],
    );
  }
  return `${lines.map((row) => row.map(exportCsvCell).join(",")).join("\n")}\n`;
}
