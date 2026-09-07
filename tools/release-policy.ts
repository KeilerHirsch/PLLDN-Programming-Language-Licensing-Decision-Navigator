// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import policySchema from "../schemas/release-policy.schema.json" with {
  type: "json",
};
import { asObject, parseStrictJson } from "../src/validation/json.ts";

export const EXPECTED_RELEASE_ASSETS = [
  "SHA256SUMS",
  "known-limitations.md",
  "plldn-v0.0.1-beta.1-pages.tar.gz",
  "release-evidence.json",
  "reviewed-coverage.json",
  "sbom.cdx.json",
] as const;
const SOURCE_MANIFEST_SHA256 =
  "a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5";
const RUNTIME_PROJECTION_SHA256 =
  "a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec";
const RELEASE_NOTES_PATH = "release/v0.0.1-beta.1/release-notes.md";

const ajv = new Ajv2020({ strict: true, allErrors: true, coerceTypes: false });
const validatePolicySchema = ajv.compile(policySchema);

export interface ReleasePolicy {
  schema_version: "0.1";
  version: "0.0.1-beta.1";
  tag: "v0.0.1-beta.1";
  title: "PLLDN v0.0.1 Beta 1";
  prerelease: true;
  assets: readonly string[];
  reviewed_source_manifest_sha256: string;
  runtime_projection_sha256: string;
  live_language_ids: readonly string[];
  live_dimension_ids: readonly string[];
  reviewed_not_live_license_ids: readonly string[];
  unsupported_surfaces: readonly string[];
  release_notes_path: string;
}

function equalArray(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

export function validateReleaseIdentity(policy: ReleasePolicy): void {
  if (!equalArray(policy.assets, EXPECTED_RELEASE_ASSETS))
    throw new Error("Release asset identity drift");
  if (policy.reviewed_source_manifest_sha256 !== SOURCE_MANIFEST_SHA256)
    throw new Error("Reviewed source digest drift");
  if (policy.runtime_projection_sha256 !== RUNTIME_PROJECTION_SHA256)
    throw new Error("Runtime projection digest drift");
  if (policy.release_notes_path !== RELEASE_NOTES_PATH)
    throw new Error("Release notes path drift");
  if (
    !/^[a-z0-9._/-]+$/u.test(policy.release_notes_path) ||
    policy.release_notes_path.includes("..")
  )
    throw new Error("Unsafe release notes path");
}

export function parseReleasePolicy(raw: string): ReleasePolicy {
  const parsed = asObject(parseStrictJson(raw));
  if (!validatePolicySchema(parsed)) {
    throw new Error(
      `Invalid release policy: ${ajv.errorsText(validatePolicySchema.errors)}`,
    );
  }
  const policy = parsed as unknown as ReleasePolicy;
  validateReleaseIdentity(policy);
  return policy;
}

export function loadReleasePolicy(
  path = "release/v0.0.1-beta.1/policy.json",
): ReleasePolicy {
  return parseReleasePolicy(readFileSync(path, "utf8"));
}
