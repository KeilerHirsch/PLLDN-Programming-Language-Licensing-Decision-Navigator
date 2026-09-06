// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseReleasePolicy,
  validateReleaseIdentity,
} from "../tools/release-policy.ts";

const raw = () => readFileSync("release/v0.0.1-beta.1/policy.json", "utf8");
const EXPECTED_ASSETS = [
  "SHA256SUMS",
  "known-limitations.md",
  "plldn-v0.0.1-beta.1-pages.tar.gz",
  "release-evidence.json",
  "reviewed-coverage.json",
  "sbom.cdx.json",
] as const;

test("checked-in beta policy freezes exact release identity", () => {
  const policy = parseReleasePolicy(raw());
  assert.equal(policy.version, "0.0.1-beta.1");
  assert.equal(policy.tag, "v0.0.1-beta.1");
  assert.equal(policy.title, "PLLDN v0.0.1 Beta 1");
  assert.equal(policy.prerelease, true);
  assert.deepEqual(policy.assets, EXPECTED_ASSETS);
  assert.doesNotThrow(() => validateReleaseIdentity(policy));
});

function mutate(fn: (value: Record<string, unknown>) => void): string {
  const value = JSON.parse(raw()) as Record<string, unknown>;
  fn(value);
  return JSON.stringify(value);
}

test("beta policy rejects identity drift and schema extensions", () => {
  for (const changed of [
    mutate((v) => {
      v.version = "0.0.1";
    }),
    mutate((v) => {
      v.tag = "v0.0.1-beta";
    }),
    mutate((v) => {
      v.title = "PLLDN Beta";
    }),
    mutate((v) => {
      v.prerelease = false;
    }),
    mutate((v) => {
      v.extra = true;
    }),
    mutate((v) => {
      v.reviewed_source_manifest_sha256 = "0".repeat(64);
    }),
    mutate((v) => {
      v.runtime_projection_sha256 = "0".repeat(64);
    }),
  ])
    assert.throws(() => parseReleasePolicy(changed));
});

test("beta policy rejects asset/path ambiguity", () => {
  assert.throws(() =>
    parseReleasePolicy(
      mutate((v) => {
        v.assets = [EXPECTED_ASSETS[0]];
      }),
    ),
  );
  assert.throws(() =>
    parseReleasePolicy(
      mutate((v) => {
        v.assets = [...EXPECTED_ASSETS, EXPECTED_ASSETS[0]];
      }),
    ),
  );
  assert.throws(() =>
    parseReleasePolicy(
      mutate((v) => {
        v.release_notes_path = "../notes.md";
      }),
    ),
  );
  assert.throws(() =>
    parseReleasePolicy(
      mutate((v) => {
        v.release_notes_path = "release/other/release-notes.md";
      }),
    ),
  );
});

test("package identity remains private and matches policy", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const policy = parseReleasePolicy(raw());
  assert.equal(pkg.private, true);
  assert.equal(pkg.version, policy.version);
});
