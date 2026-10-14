// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import type { LockedPackageEvidence } from "../tools/locked-package-evidence.ts";
import { upstreamReferencesForMissingEvidence } from "../tools/upstream-biome-license.ts";

test("exact upstream Biome references do not promote unresolved packaged evidence", () => {
  const evidence: LockedPackageEvidence = {
    path: "node_modules/@biomejs/cli-win32-x64",
    name: "@biomejs/cli-win32-x64",
    lockVersion: "2.5.15",
    lockLicense: "MIT OR Apache-2.0",
    installedVersion: "2.5.15",
    installedLicense: "MIT OR Apache-2.0",
    licenseFileSha256: null,
    integrity: "sha512-dummy",
    optional: true,
    status: "MISSING_EVIDENCE",
    reviewed: false,
  };
  const reference = upstreamReferencesForMissingEvidence(evidence);
  assert.equal(reference?.kind, "UPSTREAM_REFERENCE_ONLY");
  assert.equal(reference?.tag, "@biomejs/biome@2.5.15");
  assert.equal(reference?.licenseFiles.length, 2);
  assert(
    reference?.licenseFiles.every(
      (entry) =>
        entry.url.startsWith(
          "https://github.com/biomejs/biome/blob/0b4c11f553a7e702f9851af139662e1de45dc131/",
        ) && /^[0-9a-f]{40}$/u.test(entry.gitBlobSha1),
    ),
  );
  assert.equal(evidence.status, "MISSING_EVIDENCE");
  assert.equal(evidence.reviewed, false);
  for (const change of [
    { lockVersion: "2.5.16" },
    { installedLicense: "MIT" },
    { status: "METADATA_MATCH" as const },
    { path: "node_modules/other" },
  ])
    assert.equal(
      upstreamReferencesForMissingEvidence({ ...evidence, ...change }),
      null,
    );
});
