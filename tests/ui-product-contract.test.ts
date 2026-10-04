// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

test("Product Model UI exposes explore, compare, catalogue and license guidance", () => {
  const product = source("src/ui/product.ts");
  for (const required of [
    "Choose the foundation before the first commit.",
    "What are you building?",
    "Compare languages",
    "Language catalogue",
    "License navigator",
    "Editorial Preview",
    "Good for",
    "Watch for",
    "Build",
    "Preview facts",
  ]) {
    assert(product.includes(required), required);
  }
});

test("Product Model UI stays on safe DOM APIs", () => {
  const product = source("src/ui/product.ts");
  for (const forbidden of [
    "innerHTML",
    "insertAdjacentHTML",
    "eval(",
    "new Function",
  ]) {
    assert.equal(product.includes(forbidden), false, forbidden);
  }
  for (const required of [
    'createElement("button")',
    'createElement("table")',
    'createElement("details")',
    ".textContent",
  ]) {
    assert(product.includes(required), required);
  }
});

test("browser places Product Model ahead of the Reviewed decision lab", () => {
  const main = source("src/ui/main.ts");
  for (const required of [
    "renderProductExperience",
    "installProductExperience",
    "Reviewed decision lab",
    'action === "select-use-case"',
    'action === "toggle-compare"',
    'action === "catalog-mode"',
    'action === "clear-compare"',
  ]) {
    assert(main.includes(required), required);
  }
  assert(
    main.indexOf("renderProductExperience") <
      main.indexOf('decision.className = "decision-lab"'),
  );
});
