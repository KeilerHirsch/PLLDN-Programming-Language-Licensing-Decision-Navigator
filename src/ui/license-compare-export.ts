// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { exportCsvCell } from "../product/unassessed-export.ts";
import { LICENSE_DECISION_PROFILES } from "../product/license-decision-profiles.ts";
import {
  licenseComparisonRows,
  selectEditorialLicenses,
} from "./license-comparison.ts";

/** Export existing Editorial Preview decisions, not new or reviewed assertions. */
export function exportEditorialLicenseCompareCsv(ids: readonly string[]): string {
  const licenses = selectEditorialLicenses(ids);
  if (licenses.length === 0)
    throw new Error("Select at least one Editorial Preview license");
  const lines = [
    ["Attribute", ...licenses.map((license) => license.label)],
    ["Entity ID", ...licenses.map((license) => license.entity_id)],
    ["Evidence tier", ...licenses.map(() => "Editorial Preview (not Reviewed)")],
    [
      "Canonical terms",
      ...licenses.map((license) => {
        const source = LICENSE_DECISION_PROFILES[license.entity_id]?.canonical_source;
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
  return `${lines.map((line) => line.map(exportCsvCell).join(",")).join("\n")}\n`;
}
