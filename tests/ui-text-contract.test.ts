// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

test("text assistance renders semantic explicit-confirmation controls", () => {
  const render = source("src/ui/render.ts");
  for (const required of [
    "Describe constraints",
    'createElement("textarea")',
    'dataset.action = "analyze-text"',
    'dataset.action = "confirm-text"',
    'dataset.action = "confirm-all-text"',
    "Detected",
    "Needs clarification",
    "Conflicting statements",
    "No supported constraints detected",
  ])
    assert(render.includes(required), required);
});

test("text assistance keeps source and proposal rendering on safe DOM APIs", () => {
  const render = source("src/ui/render.ts");
  for (const forbidden of ["innerHTML", "insertAdjacentHTML"]) {
    assert.equal(render.includes(forbidden), false, forbidden);
  }
  assert(render.includes(".textContent"));
});

test("browser wiring analyzes separately and confirms through facet path", () => {
  const main = source("src/ui/main.ts");
  for (const required of [
    "analyzeText(",
    "confirmProposal(",
    "confirmProposals(",
    'action === "analyze-text"',
    'action === "confirm-text"',
    'action === "confirm-all-text"',
    'action === "clear-text-analysis"',
  ])
    assert(main.includes(required), required);
  assert.equal(main.includes("ui.text."), false);
});

test("runtime exposes validated product facets and checked-in text rules", () => {
  const runtime = source("src/ui/runtime.ts");
  assert(runtime.includes("loadStage4Rules"));
  assert(runtime.includes("validatedProductFacets"));
  assert(runtime.includes("textRules"));
  assert(runtime.includes("facets"));
});

test("Stage 4 source has no network or dynamic-code surface", () => {
  const combined = [
    "src/text/analyze.ts",
    "src/text/normalize.ts",
    "src/text/rules.ts",
    "src/ui/text-assistance.ts",
    "src/ui/main.ts",
    "src/ui/render.ts",
  ]
    .map(source)
    .join("\n");
  for (const forbidden of [
    "fetch(",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "eval(",
    "new Function",
  ])
    assert.equal(combined.includes(forbidden), false, forbidden);
});
