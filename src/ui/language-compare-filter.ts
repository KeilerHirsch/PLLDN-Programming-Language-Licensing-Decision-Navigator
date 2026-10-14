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

/** A stable view-only partition; it never changes profile values or evidence. */
export function prioritizeUnresolvedComparisonRows(
  rows: readonly CatalogLanguageCompareRow[],
  selected: readonly CatalogLanguageSelection[],
  enabled: boolean,
): CatalogLanguageCompareRow[] {
  if (!enabled || selected.length === 0) return [...rows];
  const missing = (row: CatalogLanguageCompareRow): boolean =>
    selected.some((candidate) =>
      /\b(?:UNKNOWN|NOT_REVIEWED)\b/u.test(row.value(candidate)),
    );
  return [...rows.filter(missing), ...rows.filter((row) => !missing(row))];
}
