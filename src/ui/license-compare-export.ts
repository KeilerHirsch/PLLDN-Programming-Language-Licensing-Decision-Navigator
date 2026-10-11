// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { LICENSE_DECISION_PROFILES } from "../product/license-decision-profiles.ts";
import { licensePreviewClaimRows, previewFactText } from "./preview-evidence.ts";
import type { CatalogPreviewView } from "./types.ts";
import { exportCsvCell } from "../product/unassessed-export.ts";
import {
  licenseComparisonRows,
  selectEditorialLicenses,
} from "./license-comparison.ts";

/** Export existing Editorial Preview decisions, not new or reviewed assertions. */
export function exportEditorialLicenseCompareCsv(
  ids: readonly string[],
  catalog: CatalogPreviewView,
): string {
  if (catalog.status !== "Preview" || !catalog.knowledge_snapshot) {
    throw new Error("License export requires a named Preview snapshot");
  }
  const licenses = selectEditorialLicenses(ids);
  if (licenses.length === 0)
    throw new Error("Select at least one Editorial Preview license");
  const lines = [
    ["Attribute", ...licenses.map((license) => license.label)],
    ["Entity ID", ...licenses.map((license) => license.entity_id)],
    ["Preview snapshot", ...licenses.map(() => catalog.knowledge_snapshot)],
    [
      "Evidence tier",
      ...licenses.map(() => "Editorial Preview (not Reviewed)"),
    ],
    [
      "Canonical terms",
      ...licenses.map((license) => {
        const source =
          LICENSE_DECISION_PROFILES[license.entity_id]?.canonical_source;
        if (!source || new URL(source).protocol !== "https:")
          throw new Error("License source missing or not HTTPS");
        return source;
      }),
    ],
    ...licenseComparisonRows().map((row) => [
      row.label,
      ...licenses.map((license) => row.value(license)),
    ]),
  ];
  for (const row of licensePreviewClaimRows(
    catalog,
    licenses.map((license) => license.entity_id),
  )) {
    lines.push(
      [`Preview fact: ${row.label}`, ...row.facts.map(previewFactText)],
      [
        `Preview claim ID: ${row.label}`,
        ...row.facts.map((fact) => fact?.claim_id ?? "UNKNOWN"),
      ],
      [
        `Preview review status: ${row.label}`,
        ...row.facts.map((fact) => fact?.review_status ?? "UNKNOWN"),
      ],
      [
        `Preview sources: ${row.label}`,
        ...row.facts.map(
          (fact) =>
            fact?.sources.map((source) => source.reference).join(" | ") ||
            "UNKNOWN",
        ),
      ],
    );
  }
  return `${lines.map((line) => line.map(exportCsvCell).join(",")).join("\n")}\n`;
}
