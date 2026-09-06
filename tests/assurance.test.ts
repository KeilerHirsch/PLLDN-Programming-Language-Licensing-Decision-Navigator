// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readJson = (path: string) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

test("assurance control plane names the Stage 4 free-text accelerator scope", () => {
  const requirements = readJson("assurance/requirements.json");
  const evidenceSchema = readJson("assurance/evidence-contract.schema.json");
  assert.equal(requirements.scope, "stage-4-free-text-accelerator");
  assert.equal(
    evidenceSchema.properties.scope.const,
    "stage-4-free-text-accelerator",
  );
  assert.match(
    readFileSync(new URL("../tools/evidence.ts", import.meta.url), "utf8"),
    /scope: "stage-4-free-text-accelerator"/,
  );
});

test("Stage 4 requirements map core, knowledge, browser and text invariants to real tests", () => {
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
    "PLLDN-C14": ["tests/browser-portability.test.ts"],
    "PLLDN-C15": ["tests/ui-facts.test.ts"],
    "PLLDN-C16": ["tests/ui-controller.test.ts", "tests/ui-model.test.ts"],
    "PLLDN-C17": ["tests/ui-runtime.test.ts"],
    "PLLDN-C18": [
      "tests/ui-render-contract.test.ts",
      "tests/browser-build.test.ts",
    ],
    "PLLDN-C19": ["tests/product-facets.test.ts"],
    "PLLDN-C20": [
      "tests/text-rules.test.ts",
      "tests/text-normalize.test.ts",
      "tests/text-analyze.test.ts",
    ],
    "PLLDN-C21": ["tests/text-equivalence.test.ts"],
    "PLLDN-C22": [
      "tests/ui-text-contract.test.ts",
      "tests/browser-build.test.ts",
    ],
    "PLLDN-C23": [
      "tests/ui-text-contract.test.ts",
      "tests/text-equivalence.test.ts",
    ],
  };
  assert.equal(rows.length, Object.keys(expected).length);
  for (const [id, tests] of Object.entries(expected)) {
    assert.deepEqual(byId.get(id)?.tests, tests);
    for (const path of tests) {
      assert.equal(
        readFileSync(new URL(`../${path}`, import.meta.url), "utf8").length > 0,
        true,
        path,
      );
    }
  }
});
