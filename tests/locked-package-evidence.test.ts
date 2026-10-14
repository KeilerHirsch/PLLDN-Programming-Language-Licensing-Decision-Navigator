// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectLockedPackages,
  validLockedPackagePath,
} from "../tools/locked-package-evidence.ts";

test("nested and platform-optional package declarations stay explicit and deterministic", () => {
  const entries = {
    "node_modules/z": {
      version: "2.0.0",
      license: "MIT",
      integrity: "sha512-z",
    },
    "node_modules/@scope/parent/node_modules/nested": {
      version: "1.2.3",
      license: "Apache-2.0",
    },
    "node_modules/optional-native": {
      version: "4.0.0",
      license: "MIT",
      optional: true,
    },
  };
  const installed = (path: string) =>
    path === "node_modules/optional-native"
      ? null
      : path.endsWith("/nested")
        ? {
            version: "1.2.3",
            license: "Apache-2.0",
            licenseText: "Apache source text",
          }
        : { version: "2.0.0", license: "MIT", licenseText: "MIT source text" };
  const evidence = inspectLockedPackages(entries, installed);
  assert.deepEqual(
    evidence.map((item) => item.path),
    [
      "node_modules/@scope/parent/node_modules/nested",
      "node_modules/optional-native",
      "node_modules/z",
    ],
  );
  assert.deepEqual(
    evidence.map((item) => item.status),
    ["METADATA_MATCH", "OPTIONAL_NOT_INSTALLED", "METADATA_MATCH"],
  );
  assert(evidence.every((item) => item.reviewed === false));
  assert.match(evidence[0]!.licenseFileSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(evidence[1]!.licenseFileSha256, null);
  assert.equal(
    inspectLockedPackages(entries, installed)[2]!.integrity,
    "sha512-z",
  );
  assert.equal(
    inspectLockedPackages(
      { "node_modules/z": entries["node_modules/z"]! },
      () => ({ version: "2.0.0", license: "Apache-2.0", licenseText: "text" }),
    )[0]!.status,
    "METADATA_CONFLICT",
  );
  assert.equal(
    inspectLockedPackages(
      { "node_modules/z": entries["node_modules/z"]! },
      () => ({ version: "2.0.0", license: "MIT" }),
    )[0]!.status,
    "MISSING_EVIDENCE",
  );
  assert.equal(
    validLockedPackagePath("node_modules/@scope/parent/node_modules/nested"),
    true,
  );
  for (const path of [
    "node_modules/../secret",
    "node_modules/a/../../secret",
    "other/a",
    "node_modules/a\\evil",
  ]) {
    assert.equal(validLockedPackagePath(path), false);
  }
});
