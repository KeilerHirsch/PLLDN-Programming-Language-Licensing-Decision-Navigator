// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { sha256 } from "../src/snapshots/manifest.ts";
import { validateReferences } from "../src/validation/references.ts";
import { validateVerification } from "../tools/evidence-contract.ts";
import { bundle, now } from "./fixtures.ts";

for (const value of [
  "2026-09-05T12:00:00",
  "2026-02-30T12:00:00Z",
  "September 5, 2026",
  "not-a-date",
]) {
  test(`evaluation rejects ambiguous or invalid time: ${value}`, () =>
    assert.throws(() => validateReferences(bundle(), value)));
}
test("equivalent explicit offsets yield same freshness", () => {
  validateReferences(bundle(), now);
  validateReferences(bundle(), "2026-09-05T14:00:00+02:00");
});
async function report() {
  const ids = ["typecheck", "lint", "check:repository", "test:coverage"];
  const logs = Object.fromEntries(
    ids.map((id) => [
      `reports/${id.replaceAll(":", "-")}.txt`,
      "actual check output",
    ]),
  );
  return {
    logs,
    value: {
      schema_version: "0.1",
      subject_sha256: "a".repeat(64),
      occurred_at: now,
      node: process.version,
      state: "PASS",
      checks: await Promise.all(
        ids.map(async (id) => ({
          id,
          result: "PASS",
          log: {
            path: `reports/${id.replaceAll(":", "-")}.txt`,
            sha256: await sha256("actual check output"),
          },
        })),
      ),
    },
  };
}
test("bound check logs validate", async () => {
  const r = await report();
  await validateVerification(r.value, "a".repeat(64), r.logs);
});
test("log substitution fails even for same source", async () => {
  const r = await report();
  r.logs["reports/lint.txt"] = "different output";
  await assert.rejects(() =>
    validateVerification(r.value, "a".repeat(64), r.logs),
  );
});
test("missing checks and wrong source fail", async () => {
  const r = await report();
  await assert.rejects(() =>
    validateVerification(r.value, "b".repeat(64), r.logs),
  );
  r.value.checks.pop();
  await assert.rejects(() =>
    validateVerification(r.value, "a".repeat(64), r.logs),
  );
});
test("check path cannot escape reports", async () => {
  const r = await report();
  const first = r.value.checks[0];
  assert(first);
  first.log.path = "../private.txt";
  await assert.rejects(() =>
    validateVerification(r.value, "a".repeat(64), r.logs),
  );
});
