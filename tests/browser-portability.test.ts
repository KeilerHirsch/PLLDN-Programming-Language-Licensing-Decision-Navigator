// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { schemaDigest } from "../src/snapshots/manifest.ts";

const baselineSchemaDigest =
  "c093f493fb38d9230c42961e98d061187330672516223032790a24db95759f3e";

test("validation module has no filesystem dependency", () => {
  const source = readFileSync("src/validation/documents.ts", "utf8");
  assert.equal(source.includes('from "node:fs"'), false);
  assert.equal(source.includes("readFileSync"), false);
});

test("browser portability preserves the schema digest", async () => {
  assert.equal(await schemaDigest(), baselineSchemaDigest);
});
