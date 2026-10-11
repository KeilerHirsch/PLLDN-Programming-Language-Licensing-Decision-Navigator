// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { buildUnassessedCandidatesV02 } from "../src/product/unassessed-candidates.ts";
import { INDEX_ONLY_LANGUAGES, INDEX_ONLY_LICENSES } from "../src/product/identity-index.ts";
import { encodeCanonical } from "../src/snapshots/manifest.ts";

const schema = JSON.parse(readFileSync("catalog/unassessed-candidates.v0.2.schema.json", "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

test("v0.2 preserves v0.1 and has only sourced unassessed index identities", () => {
  const x = buildUnassessedCandidatesV02();
  assert.equal(x.schema_version, "0.2");
  assert.equal(x.migration_from, "identity-index.v1");
  assert.equal(x.records.length, 841);
  assert.equal(x.records.filter((p) => p.kind === "language").length, 159);
  assert.equal(x.records.filter((p) => p.kind === "license").length, 682);
  assert.equal(x.records.length, INDEX_ONLY_LANGUAGES.length + INDEX_ONLY_LICENSES.length);
  assert.equal(validate(x), true, JSON.stringify(validate.errors));
  assert.equal(new Set(x.records.map((p) => p.id)).size, x.records.length);
  assert(x.records.every((p) =>
    p.stage === "UNASSESSED_PREVIEW" &&
    p.review_status === "NOT_REVIEWED" &&
    p.source_status === "PINNED_IDENTITY" &&
    p.claim_refs.length === 0 &&
    Object.values(p.assessments).every((v) => v === "UNKNOWN")
  ));
});
test("replay is byte-identical and deterministically ordered", () => {
  const expected = encodeCanonical(buildUnassessedCandidatesV02());
  assert.equal(readFileSync("catalog/unassessed-candidates.v0.2.json", "utf8"), expected);
  assert.equal(encodeCanonical(buildUnassessedCandidatesV02()), expected);
  const ids = buildUnassessedCandidatesV02().records.map((r) => r.id);
  assert(ids.every((id, i) => i === 0 || id > (ids[i-1] ?? "")));
});
test("schema fails closed on promotion, invented facts and claims", () => {
  for (const mutate of [
    (x: any) => { x.records[0].review_status = "Reviewed"; },
    (x: any) => { x.records[0].claim_refs = ["claim.unverified"]; },
    (x: any) => { x.records[0].assessments.rights = "yes"; },
    (x: any) => { x.records[0].unexpected = "rating"; },
  ]) {
    const record = structuredClone(buildUnassessedCandidatesV02());
    mutate(record);
    assert.equal(validate(record), false);
  }
});
