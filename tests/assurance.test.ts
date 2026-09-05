// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readJson = (path: string) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

test("assurance control plane names the Stage 1 decision-core scope", () => {
  const requirements = readJson("assurance/requirements.json");
  const evidenceSchema = readJson("assurance/evidence-contract.schema.json");
  assert.equal(requirements.scope, "stage-1-decision-core");
  assert.equal(evidenceSchema.properties.scope.const, "stage-1-decision-core");
  assert.match(
    readFileSync(new URL("../tools/evidence.ts", import.meta.url), "utf8"),
    /scope: "stage-1-decision-core"/,
  );
});

test("Stage 1 requirements map decision invariants to their real test files", () => {
  const rows = (
    readJson("assurance/requirements.json") as {
      requirements: Array<{ id: string; tests: string[] }>;
    }
  ).requirements;
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const id of ["PLLDN-C01", "PLLDN-C02", "PLLDN-C03", "PLLDN-C04"])
    assert(byId.has(id));
  const expected: Record<string, string[]> = {
    "PLLDN-C05": [
      "tests/decision-selection.test.ts",
      "tests/decision-rules.test.ts",
    ],
    "PLLDN-C06": [
      "tests/decision-selection.test.ts",
      "tests/decision-invariants.test.ts",
    ],
    "PLLDN-C07": [
      "tests/decision-invariants.test.ts",
      "tests/decision-effects.test.ts",
    ],
    "PLLDN-C08": ["tests/facets.test.ts"],
    "PLLDN-C09": [
      "tests/decision-rules.test.ts",
      "tests/decision-invariants.test.ts",
    ],
  };
  for (const [id, tests] of Object.entries(expected))
    assert.deepEqual(byId.get(id)?.tests, tests);
});
