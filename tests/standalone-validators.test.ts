// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  claim,
  evaluation_time,
  project_facts,
  text_rule_set,
} from "../src/validation/generated/validators.cjs";
import { parseStrictJson } from "../src/validation/json.ts";
import { generateStandaloneValidators } from "../tools/generate-standalone-validators.ts";

const generatedPath = "src/validation/generated/validators.cjs";

test("checked-in standalone validators reproduce exactly from pinned schemas", async () => {
  const expected = generateStandaloneValidators();
  const checkedIn = await readFile(generatedPath, "utf8");
  assert.equal(checkedIn, expected);
  for (const forbidden of [
    "new Function",
    "eval(",
    "Ajv2020",
    "compile/codegen",
  ]) {
    assert.equal(checkedIn.includes(forbidden), false, forbidden);
  }
});
test("standalone validators preserve document and text-rule schema behavior", async () => {
  const project = {
    schema_version: "0.1",
    project_id: "project.validator-test",
    components: [],
    facts: [],
    boundaries: [],
  };
  assert.equal(project_facts(project), true);
  assert.equal(project_facts({ ...project, surprise: true }), false);

  const claimRaw = await readFile(
    "knowledge/reviewed/stage2-core/claims/go-runtime-gc.json",
    "utf8",
  );
  const claimEnvelope = parseStrictJson(claimRaw) as { record: unknown };
  assert.equal(claim(claimEnvelope.record), true);
  assert.equal(
    claim({ ...(claimEnvelope.record as object), review_status: "MAGIC" }),
    false,
  );

  const rules = parseStrictJson(
    await readFile("text-rules/stage4-core.json", "utf8"),
  );
  assert.equal(text_rule_set(rules), true);
  assert.equal(text_rule_set({ ...(rules as object), regex: ".*" }), false);
});
test("standalone evaluation-time validator preserves RFC3339 format checks", () => {
  assert.equal(evaluation_time("2026-09-06T12:00:00Z"), true);
  assert.equal(evaluation_time("2026-09-06T14:00:00+02:00"), true);
  assert.equal(evaluation_time("2026-09-06T12:00:00"), false);
  assert.equal(evaluation_time("2026-02-30T12:00:00Z"), false);
  assert.equal(evaluation_time("not-a-date"), false);
});

test("generated standalone validator bytes stay outside formatter input", async () => {
  const biome = JSON.parse(await readFile("biome.json", "utf8")) as {
    files: { includes: string[] };
  };
  assert(
    biome.files.includes.includes("!src/validation/generated/validators.cjs"),
  );
});

test("browser-reachable validation modules import no AJV runtime compiler", async () => {
  for (const path of ["src/validation/documents.ts", "src/text/rules.ts"]) {
    const source = await readFile(path, "utf8");
    assert.equal(source.includes("Ajv2020"), false, path);
    assert.equal(source.includes('from "ajv-formats"'), false, path);
  }
});
