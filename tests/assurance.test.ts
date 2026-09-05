// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readJson = (path: string) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

test("assurance control plane names the Stage 2 reviewed-knowledge scope", () => {
  const requirements = readJson("assurance/requirements.json");
  const evidenceSchema = readJson("assurance/evidence-contract.schema.json");
  assert.equal(requirements.scope, "stage-2-reviewed-knowledge");
  assert.equal(
    evidenceSchema.properties.scope.const,
    "stage-2-reviewed-knowledge",
  );
  assert.match(
    readFileSync(new URL("../tools/evidence.ts", import.meta.url), "utf8"),
    /scope: "stage-2-reviewed-knowledge"/,
  );
});
test("Stage 2 requirements map decision and knowledge invariants to real tests", () => {
  const rows = (
    readJson("assurance/requirements.json") as {
      requirements: Array<{ id: string; tests: string[] }>;
    }
  ).requirements;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const expected: Record<string, string[]> = {
    "PLLDN-C01": ["tests/contracts.test.ts"],
    "PLLDN-C02": ["tests/references.test.ts"],
    "PLLDN-C03": ["tests/snapshots.test.ts"],
    "PLLDN-C04": ["tests/trust-boundary.test.ts"],
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
    "PLLDN-C10": ["tests/knowledge-stage2.test.ts"],
    "PLLDN-C11": ["tests/knowledge-stage2.test.ts"],
    "PLLDN-C12": ["tests/knowledge-promotion.test.ts"],
    "PLLDN-C13": ["tests/reviewed-stage2.test.ts"],
  };
  assert.equal(rows.length, Object.keys(expected).length);
  for (const [id, tests] of Object.entries(expected))
    assert.deepEqual(byId.get(id)?.tests, tests);
});
