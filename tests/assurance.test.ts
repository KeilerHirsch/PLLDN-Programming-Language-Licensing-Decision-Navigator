// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readJson = (path: string) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

test("assurance control plane names the Stage 6 beta release scope", () => {
  const requirements = readJson("assurance/requirements.json");
  const evidenceSchema = readJson("assurance/evidence-contract.schema.json");
  assert.equal(requirements.scope, "stage-6-beta-release");
  assert.equal(evidenceSchema.properties.scope.const, "stage-6-beta-release");
  assert.match(
    readFileSync(new URL("../tools/evidence.ts", import.meta.url), "utf8"),
    /scope: "stage-6-beta-release"/,
  );
});

test("Stage 6 requirements map core through immutable beta release invariants to real tests", () => {
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
    "PLLDN-C24": ["tests/pages-profile.test.ts"],
    "PLLDN-C25": ["tests/pages-runtime.test.ts"],
    "PLLDN-C26": ["tests/pages-build.test.ts", "tests/browser-build.test.ts"],
    "PLLDN-C27": [
      "tests/pages-security.test.ts",
      "tests/standalone-validators.test.ts",
    ],
    "PLLDN-C28": ["tests/pages-workflow.test.ts"],
    "PLLDN-C29": ["tests/source-candidates.test.ts"],
    "PLLDN-C30": ["tests/dictionary-issue-form.test.ts"],
    "PLLDN-C31": [
      "tests/community-review.test.ts",
      "tests/community-workflow.test.ts",
    ],
    "PLLDN-C32": ["tests/community-authority.test.ts"],
    "PLLDN-C33": [
      "tests/release-policy.test.ts",
      "tests/release-workflow.test.ts",
    ],
    "PLLDN-C34": [
      "tests/release-coverage.test.ts",
      "tests/release-docs.test.ts",
    ],
    "PLLDN-C35": [
      "tests/release-archive.test.ts",
      "tests/release-sbom.test.ts",
      "tests/release-assets.test.ts",
    ],
    "PLLDN-C36": ["tests/release-workflow.test.ts"],
    "PLLDN-C37": ["tests/release-workflow.test.ts"],
    "PLLDN-C38": ["tests/release-assets.test.ts", "tests/release-docs.test.ts"],
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
