// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { inspectDirectDependencies } from "../tools/direct-package-evidence.ts";

test("actual direct component versions and declarations are corroborated, not Reviewed", () => {
  const manifest = { dependencies: { "some-library": "1.2.3" } };
  const lock = {
    packages: {
      "node_modules/some-library": {
        version: "1.2.3",
        license: "MIT",
        integrity: "sha512-test",
      },
    },
  };
  const evidence = inspectDirectDependencies(manifest, lock, () => ({
    version: "1.2.3",
    license: "MIT",
    licenseText: "Original text supplied with package.",
  }));
  assert.equal(evidence[0]!.status, "METADATA_MATCH");
  assert.equal(evidence[0]!.reviewed, false);
  assert.match(evidence[0]!.licenseFileSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(evidence[0]!.integrity, "sha512-test");
  assert.deepEqual(
    evidence,
    inspectDirectDependencies(manifest, lock, () => ({
      version: "1.2.3",
      license: "MIT",
      licenseText: "Original text supplied with package.",
    })),
  );
  assert.equal(
    inspectDirectDependencies(manifest, lock, () => ({
      version: "1.2.3",
      license: "Apache-2.0",
      licenseText: "Other original text",
    }))[0]!.status,
    "METADATA_CONFLICT",
  );
  assert.equal(
    inspectDirectDependencies(manifest, lock, () => ({
      version: "1.2.3",
      license: "MIT",
    }))[0]!.status,
    "MISSING_EVIDENCE",
  );
  assert.throws(() =>
    inspectDirectDependencies(
      { dependencies: { "../escape": "1.2.3" } },
      lock,
      () => null,
    ),
  );
});
