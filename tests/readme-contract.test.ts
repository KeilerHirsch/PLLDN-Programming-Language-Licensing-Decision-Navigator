// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readme = readFileSync("README.md", "utf8");
const top = readme.split("\n## Scope and trust model\n", 1)[0] ?? readme;

const markers = [
  "# PLLDN - Programming Language & Licensing Decision Navigator",
  "**Outcome:**",
  "**For:**",
  "**Status:**",
  "**Use it now:**",
  "**Setup:**",
  "## 30-second workflow",
  "**Before using:**",
  "**Verify:**",
  "**Next:**",
] as const;

test("README top zone sells the product outcome before the machinery", () => {
  const positions = markers.map((marker) => top.indexOf(marker));
  assert.equal(
    positions.every((position) => position >= 0),
    true,
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
  );
  assert.match(top, /GitHub Pages/u);
  assert.match(top, /v0\.0\.1 Beta 1/u);
  assert.match(top, /community-supported/iu);
  assert.match(top, /no account, API key, LLM, or provider setup/iu);
  assert.match(top, /free text.*proposes.*confirm/isu);
  assert.match(top, /why.*fit|why.*candidate/iu);
});

test("README keeps product explanation ahead of trust internals", () => {
  const product = readme.indexOf("## What PLLDN does");
  const trust = readme.indexOf("## Scope and trust model");
  assert.ok(product >= 0);
  assert.ok(trust > product);
});
