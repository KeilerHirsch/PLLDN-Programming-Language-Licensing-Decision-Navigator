// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("comparison differences control exposes a pressed state and uses shared rows", () => {
  const ui = readFileSync("src/ui/product.ts", "utf8");
  const events = readFileSync("src/ui/main.ts", "utf8");
  assert(
    ui.includes('button("Only differences", "toggle-compare-differences")'),
  );
  assert(
    ui.includes(
      'filter.setAttribute("aria-pressed", String(state.compareOnlyDifferences))',
    ),
  );
  assert(ui.includes("filterLanguageComparisonRows("));
  assert(ui.includes("UNKNOWN and NOT_REVIEWED remain visible"));
  assert(events.includes('if (action === "toggle-compare-differences")'));
  assert(
    events.includes(
      "compareOnlyDifferences: !productState.compareOnlyDifferences",
    ),
  );
  assert(ui.includes("compareOnlyDifferences: false"));
});
