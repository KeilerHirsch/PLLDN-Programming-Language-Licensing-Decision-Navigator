// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("comparison print action uses browser print without replacing or exfiltrating comparison data", () => {
  const main = readFileSync("src/ui/main.ts", "utf8");
  const product = readFileSync("src/ui/product.ts", "utf8");
  assert(
    product.includes('button("Print comparison", "print-language-compare")'),
  );
  assert(main.includes('action === "print-language-compare"'));
  assert(main.includes("window.print()"));
  assert(!main.includes("document.write("));
  assert(!main.includes("window.open("));
});

test("comparison CSS keeps long tables scrollable with sticky headings and a print-only view", () => {
  const css = readFileSync("web/app.css", "utf8");
  const product = readFileSync("src/ui/product.ts", "utf8");
  assert(css.includes(".compare-table-wrap"));
  assert(css.includes("max-height:"));
  assert(css.includes("overflow: auto"));
  assert(css.includes(".compare-table tbody th"));
  assert(css.includes("left: 0"));
  assert(css.includes("@media print"));
  assert(css.includes(".compare-table thead th"));
  assert(css.includes("position: static"));
  assert(css.includes("break-inside: avoid"));
  assert(product.includes('wrapper.setAttribute("tabindex", "0")'));
  assert(product.includes('wrapper.setAttribute("aria-label",'));
  assert(product.includes("compare-print-note"));
});
