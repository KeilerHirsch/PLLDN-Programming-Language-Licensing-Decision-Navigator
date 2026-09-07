// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { repositoryFiles } from "../tools/source-tree.ts";

const internalLabels = [
  ["GRA", "NIT"].join(""),
  ["MAR", "TIN"].join(""),
  ["granit", "-plldn"].join(""),
];

test("public source excludes private project labels outside planning records", () => {
  for (const path of repositoryFiles()) {
    if (path.startsWith("docs/superpowers/")) continue;
    const raw = readFileSync(path, "utf8");
    for (const label of internalLabels)
      assert.equal(raw.includes(label), false, `${path}: private label`);
  }
});
