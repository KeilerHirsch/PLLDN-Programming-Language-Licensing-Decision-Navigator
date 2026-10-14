// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { filterLanguageComparisonRows } from "../src/ui/language-compare-filter.ts";
import type { CatalogLanguageCompareRow } from "../src/ui/language-reader-comparison.ts";
import type { CatalogLanguageSelection } from "../src/ui/product.ts";

const selected = [
  { entity_id: "language.alpha" },
  { entity_id: "candidate.language.beta" },
] as CatalogLanguageSelection[];

function row(
  label: string,
  alpha: string,
  beta: string,
): CatalogLanguageCompareRow {
  return {
    label,
    value: (profile) =>
      profile.entity_id === selected[0]?.entity_id ? alpha : beta,
    sources: () => [],
  };
}

test("only differences suppresses identical known values without changing original rows", () => {
  const rows = [
    row("Shared", "Documented", "Documented"),
    row("Distinct", "Go", "Rust"),
    row("Shared scope", "v1", "v1"),
  ];
  assert.deepEqual(filterLanguageComparisonRows(rows, selected, false), rows);
  assert.deepEqual(
    filterLanguageComparisonRows(rows, selected, true).map(
      (entry) => entry.label,
    ),
    ["Distinct"],
  );
  assert.equal(rows.length, 3);
});

test("unresolved assessments remain visible even if both candidates are unknown", () => {
  const rows = [
    row("Assessment", "UNKNOWN", "UNKNOWN"),
    row("Not reviewed", "NOT_REVIEWED", "NOT_REVIEWED"),
    row("Mixed", "UNKNOWN", "Fast"),
    row("Known", "Fast", "Fast"),
  ];
  assert.deepEqual(
    filterLanguageComparisonRows(rows, selected, true).map(
      (entry) => entry.label,
    ),
    ["Assessment", "Not reviewed", "Mixed"],
  );
});

test("a single selection retains all rows, including common information", () => {
  const rows = [
    row("Shared", "Yes", "Yes"),
    row("Unknown", "UNKNOWN", "UNKNOWN"),
  ];
  assert.deepEqual(
    filterLanguageComparisonRows(rows, selected.slice(0, 1), true),
    rows,
  );
});
