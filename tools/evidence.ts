// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFileSync, writeFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { encodeCanonical, sha256 } from "../src/snapshots/manifest.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";
import {
  logPath,
  requiredChecks,
  validateVerification,
} from "./evidence-contract.ts";
import { sourceTree } from "./source-tree.ts";

const raw = readFileSync("reports/verification.json", "utf8");
const report = asObject(parseStrictJson(raw));
const subject = sourceTree();
const logs = Object.fromEntries(
  requiredChecks.map((id) => [logPath(id), readFileSync(logPath(id), "utf8")]),
);
await validateVerification(report, subject.sha256, logs);
const manifest = {
  schema_version: "0.1",
  scope: "stage-5a-verified-github-pages-runtime",
  subject_sha256: subject.sha256,
  files: subject.files,
  node: process.version,
  checks: report.checks,
  verification_sha256: await sha256(raw),
};
const validator = new Ajv2020({ strict: true });
if (
  !validator.validate(
    asObject(
      parseStrictJson(
        readFileSync("assurance/evidence-contract.schema.json", "utf8"),
      ),
    ),
    manifest,
  )
)
  throw new Error(validator.errorsText());
if (sourceTree().sha256 !== subject.sha256)
  throw new Error("Source changed during evidence export");
const encoded = encodeCanonical(manifest);
writeFileSync("reports/evidence.json", encoded);
console.log(await sha256(encoded));
