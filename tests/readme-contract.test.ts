// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readme = readFileSync("README.md", "utf8");
const top = readme.split("\n## Scope and trust model\n", 1)[0] ?? readme;

const markers = [
  "# PLLDN - Programming Language & Licensing Decision Navigator",
  "**For:**",
  "**Status:**",
  "**Use it now:**",
  "**Verify:**",
  "**Before using:**",
  "**Next:**",
] as const;

test("README top zone follows the first-30-seconds contract", () => {
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
});
