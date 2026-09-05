// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

test("DOM boundary uses safe content APIs and semantic native controls", () => {
  const render = source("src/ui/render.ts");
  for (const forbidden of [
    "innerHTML",
    "insertAdjacentHTML",
    "eval(",
    "new Function",
  ]) {
    assert.equal(render.includes(forbidden), false, forbidden);
  }
  for (const required of [
    'createElement("button")',
    'createElement("select")',
    'createElement("details")',
    'setAttribute("aria-live", "polite")',
    ".textContent",
  ]) {
    assert(render.includes(required), required);
  }
});

test("browser startup fails closed when runtime material is absent", () => {
  const main = source("src/ui/main.ts");
  assert(main.includes("PLLDN_RUNTIME"));
  assert(main.includes("Runtime snapshot not configured"));
  assert(main.includes('addEventListener("click"'));
  assert(main.includes('addEventListener("change"'));
});
