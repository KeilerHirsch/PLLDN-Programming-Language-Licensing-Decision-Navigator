// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  exampleExecutionStatus,
  validateExampleEvidence,
} from "../src/product/language-reader-evidence.ts";
import type { LanguageReaderProfile } from "../src/product/language-reader-validation.ts";

const example = {
  filename: "hello.js",
  code: 'console.log("PLLDN");\n',
  run_instructions: "node hello.js",
  expected_result: "Prints PLLDN.",
};
const profile = { name: "JavaScript", example } as LanguageReaderProfile;
const record = {
  name: "JavaScript",
  producer: "node-console-v1",
  ...example,
  stdout: "PLLDN\n",
  toolchain: "Node.js 24.15.0",
  checked_on: "2026-10-13",
};
test("execution evidence is scoped to the exact documented example", () => {
  const evidence = validateExampleEvidence({
    schema_version: 1,
    records: [record],
  });
  assert.equal(exampleExecutionStatus(profile, evidence).status, "executed");
  for (const key of [
    "filename",
    "code",
    "run_instructions",
    "expected_result",
  ] as const) {
    const changed = structuredClone(profile);
    changed.example[key] += "changed";
    assert.equal(
      exampleExecutionStatus(changed, evidence).status,
      "documented",
    );
  }
  assert.equal(
    exampleExecutionStatus({ ...profile, name: "BASIC" }, evidence).status,
    "documented",
  );
  assert.equal(exampleExecutionStatus(profile, []).status, "documented");
});
test("evidence rejects malformed, duplicate, unknown and invalid output receipts", () => {
  for (const bad of [
    null,
    { schema_version: 2, records: [record] },
    { schema_version: 1, records: [record, record] },
    { schema_version: 1, records: [{ ...record, name: "BASIC" }] },
    {
      schema_version: 1,
      records: [{ ...record, producer: "shell-data-command" }],
    },
    { schema_version: 1, records: [{ ...record, stdout: "FAIL" }] },
    { schema_version: 1, records: [{ ...record, toolchain: "unknown" }] },
    { schema_version: 1, records: [{ ...record, checked_on: "2026-02-30" }] },
    { schema_version: 1, records: [{ ...record, code: "" }] },
    { schema_version: 1, records: [{ ...record, executed: true }] },
  ])
    assert.throws(() => validateExampleEvidence(bad));
});
