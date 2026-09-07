// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildRelease,
  createSha256Sums,
  type PreparedReleaseInputs,
  validatePublicAssetNames,
} from "../tools/build-release.ts";
import { EXPECTED_RELEASE_ASSETS } from "../tools/release-policy.ts";

const TARGET = "a".repeat(40);
const EPOCH = "2026-09-06T21:00:00.000Z";
const SOURCE = "b".repeat(64);
const pages = {
  "app.css": Buffer.from("body{}\n"),
  "app.js": Buffer.from("console.log('x');\n"),
  "index.html": Buffer.from("<!doctype html>\n"),
  "runtime.js": Buffer.from("window.PLLDN_RUNTIME={};\n"),
};
function sbomRaw(): string {
  return JSON.stringify({
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: "urn:uuid:test",
    version: 1,
    metadata: {
      timestamp: "2026-09-01T00:00:00.000Z",
      component: {
        "bom-ref": "plldn@0.0.1-beta.1",
        type: "library",
        name: "plldn",
        version: "0.0.1-beta.1",
      },
    },
    components: [],
    dependencies: [{ ref: "plldn@0.0.1-beta.1", dependsOn: [] }],
  });
}

function prepared(
  overrides: Partial<PreparedReleaseInputs> = {},
): PreparedReleaseInputs {
  const repositoryEvidenceRaw = `${JSON.stringify({
    schema_version: "0.1",
    scope: "stage-6-beta-release",
    subject_sha256: SOURCE,
    node: "v24.15.0",
    checks: [
      { id: "typecheck", result: "PASS" },
      { id: "lint", result: "PASS" },
      { id: "check:repository", result: "PASS" },
      { id: "test:coverage", result: "PASS" },
    ],
  })}\n`;
  return {
    headSha: TARGET,
    commitEpochIso: EPOCH,
    sourceTreeSha256: SOURCE,
    repositoryEvidenceRaw,
    coverageLogRaw: "all files | 97.59 | 86.23 | 98.31 |\n",
    nodeVersion: "v24.15.0",
    npmVersion: "11.12.1",
    sbomRaw: sbomRaw(),
    pagesFiles: pages,
    ...overrides,
  };
}

async function withOutDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "plldn-release-assets-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("buildRelease produces the exact six public assets and bound evidence", async () => {
  await withOutDir(async (dir) => {
    await buildRelease({
      targetSha: TARGET,
      releaseEpoch: EPOCH,
      outDir: dir,
      prepared: prepared(),
    });
    assert.deepEqual(
      (await readdir(join(dir, "public"))).sort(),
      [...EXPECTED_RELEASE_ASSETS].sort(),
    );
    const evidence = JSON.parse(
      await readFile(join(dir, "public/release-evidence.json"), "utf8"),
    );
    assert.equal(evidence.target_commit_sha, TARGET);
    assert.equal(evidence.source_tree_sha256, SOURCE);
    assert.equal(evidence.immutable_release_requirement, "required");
  });
});
test("release evidence and publication manifest are byte deterministic", async () => {
  await withOutDir(async (a) => {
    await withOutDir(async (b) => {
      await buildRelease({
        targetSha: TARGET,
        releaseEpoch: EPOCH,
        outDir: a,
        prepared: prepared(),
      });
      await buildRelease({
        targetSha: TARGET,
        releaseEpoch: EPOCH,
        outDir: b,
        prepared: prepared(),
      });
      for (const name of EXPECTED_RELEASE_ASSETS) {
        assert.deepEqual(
          await readFile(join(a, "public", name)),
          await readFile(join(b, "public", name)),
        );
      }
      assert.deepEqual(
        await readFile(join(a, "internal/publication-manifest.json")),
        await readFile(join(b, "internal/publication-manifest.json")),
      );
    });
  });
});

test("release build rejects target and repository-evidence drift", async () => {
  await withOutDir(async (dir) => {
    await assert.rejects(() =>
      buildRelease({
        targetSha: TARGET,
        releaseEpoch: EPOCH,
        outDir: dir,
        prepared: prepared({ headSha: "c".repeat(40) }),
      }),
    );
    const drift = prepared();
    drift.repositoryEvidenceRaw = drift.repositoryEvidenceRaw.replace(
      SOURCE,
      "d".repeat(64),
    );
    await assert.rejects(() =>
      buildRelease({
        targetSha: TARGET,
        releaseEpoch: EPOCH,
        outDir: dir,
        prepared: drift,
      }),
    );
  });
});

test("checksum and public-asset contracts reject self-reference and extras", async () => {
  const five = new Map<string, Buffer>();
  for (const name of EXPECTED_RELEASE_ASSETS.filter(
    (name) => name !== "SHA256SUMS",
  ))
    five.set(name, Buffer.from(name));
  const sums = createSha256Sums(five);
  assert.match(sums, /^[0-9a-f]{64} {2}/mu);
  assert.throws(() =>
    createSha256Sums(new Map([...five, ["SHA256SUMS", Buffer.from("x")]])),
  );
  assert.doesNotThrow(() => validatePublicAssetNames(EXPECTED_RELEASE_ASSETS));
  assert.throws(() =>
    validatePublicAssetNames([...EXPECTED_RELEASE_ASSETS, "extra.txt"]),
  );
});
