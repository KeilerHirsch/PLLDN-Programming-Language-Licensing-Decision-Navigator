// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GLOSSARY_TERMS } from "../src/ui/product-glossary.ts";

test("glossary covers trust-boundary and licensing terms without invented decisions", () => {
  const terms: string[] = GLOSSARY_TERMS.map((term) => term.term);
  for (const term of [
    "SPDX",
    "Copyleft",
    "SaaS",
    "Runtime",
    "Preview",
    "Reviewed",
    "UNKNOWN",
    "NOT_REVIEWED",
    "Complexity",
    "Throughput",
    "PolyForm",
  ]) {
    assert(terms.includes(term), term);
  }
  assert.equal(new Set(terms).size, terms.length);
  for (const entry of GLOSSARY_TERMS) {
    assert(entry.definition.length >= 25);
    assert(!entry.definition.includes("guaranteed compatible"));
  }
  assert(
    GLOSSARY_TERMS.find(
      (entry) => entry.term === "UNKNOWN",
    )?.definition.includes("not assessed"),
  );
});

test("glossary uses keyboard-accessible native details and safe DOM text nodes", () => {
  const module = readFileSync("src/ui/product-glossary.ts", "utf8");
  const ui = readFileSync("src/ui/product.ts", "utf8");
  assert(module.includes('document.createElement("details")'));
  assert(module.includes('document.createElement("summary")'));
  assert(module.includes("textContent"));
  assert(!module.includes("innerHTML"));
  assert(ui.includes("renderProductGlossary()"));
});
