// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { CatalogLanguageCompareRow } from "./language-reader-comparison.ts";
import type { CatalogLanguageSelection } from "./product.ts";

const unresolved = new Set(["UNKNOWN", "NOT_REVIEWED"]);

/**
 * Keep unresolved values visible even when all candidates share them:
 * missing evidence is not a demonstrated similarity.
 */
export function filterLanguageComparisonRows(
  rows: readonly CatalogLanguageCompareRow[],
  selected: readonly CatalogLanguageSelection[],
  onlyDifferences: boolean,
): CatalogLanguageCompareRow[] {
  if (!onlyDifferences || selected.length < 2) return [...rows];
  return rows.filter((row) => {
    const values = selected.map((candidate) => row.value(candidate));
    if (values.some((value) => unresolved.has(value.trim().toUpperCase()))) {
      return true;
    }
    return values.some((value) => value !== values[0]);
  });
}
