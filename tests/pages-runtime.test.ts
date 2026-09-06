// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { verifySnapshot } from "../src/snapshots/verify.ts";
import {
  type PagesRuntimeProfile,
  parsePagesRuntimeProfile,
} from "../tools/pages-profile.ts";
import { projectPagesRuntime } from "../tools/pages-runtime.ts";

const profileUrl = new URL(
  "../deployments/github-pages/runtime-profile.json",
  import.meta.url,
);
const manifestUrl = new URL(
  "../knowledge/reviewed/stage2-core.manifest.json",
  import.meta.url,
);
const reviewedRoot = new URL(
  "../knowledge/reviewed/stage2-core/",
  import.meta.url,
);
const RUNTIME_SHA =
  "a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec";

async function fixture(): Promise<{
  profile: PagesRuntimeProfile;
  manifestRaw: string;
  files: Record<string, string>;
}> {
  const profile = parsePagesRuntimeProfile(await readFile(profileUrl, "utf8"));
  const manifestRaw = await readFile(manifestUrl, "utf8");
  const files = Object.fromEntries(
    await Promise.all(
      profile.runtime_document_paths.map(async (path) => [
        path,
        await readFile(new URL(path, reviewedRoot), "utf8"),
      ]),
    ),
  );
  return { profile, manifestRaw, files };
}

function withPaths(
  profile: PagesRuntimeProfile,
  runtime_document_paths: readonly string[],
): PagesRuntimeProfile {
  return { ...profile, runtime_document_paths };
}

test("Pages runtime projection binds the approved 16-document closure", async () => {
  const { profile, manifestRaw, files } = await fixture();
  const projected = await projectPagesRuntime(profile, manifestRaw, files);
  assert.equal(projected.manifestSha256, RUNTIME_SHA);
  assert.equal(Object.keys(projected.files).length, 16);
  assert.equal(projected.manifestRaw.includes("current-stable-version"), false);
  assert.deepEqual(projected.baseProject, profile.base_project);
  assert.equal(projected.candidateType, "language");
  assert.equal(projected.componentId, profile.component_id);
  await verifySnapshot(
    projected.manifestRaw,
    projected.files,
    [RUNTIME_SHA],
    "2026-09-07T00:00:00Z",
  );
});

test("Pages runtime projection rejects source-manifest approval drift", async () => {
  const { profile, manifestRaw, files } = await fixture();
  await assert.rejects(
    () => projectPagesRuntime(profile, `${manifestRaw} `, files),
    /source manifest approval/i,
  );
});

test("Pages runtime projection rejects missing or extra allowlist entries", async () => {
  const { profile, manifestRaw, files } = await fixture();
  await assert.rejects(
    () =>
      projectPagesRuntime(
        withPaths(profile, profile.runtime_document_paths.slice(1)),
        manifestRaw,
        files,
      ),
    /runtime projection approval/i,
  );
  const extra = [
    ...profile.runtime_document_paths,
    "claims/not-reviewed.json",
  ].sort();
  await assert.rejects(
    () => projectPagesRuntime(withPaths(profile, extra), manifestRaw, files),
    /source manifest/i,
  );
});
test("Pages runtime projection rejects source-file digest drift", async () => {
  const { profile, manifestRaw, files } = await fixture();
  const path = profile.runtime_document_paths[0];
  assert(path);
  const tampered = { ...files, [path]: `${files[path]} ` };
  await assert.rejects(
    () => projectPagesRuntime(profile, manifestRaw, tampered),
    /document digest/i,
  );
});

test("Pages runtime projection rejects unsafe direct profile paths", async () => {
  const { profile, manifestRaw, files } = await fixture();
  for (const bad of ["../x.json", "candidate/claims/x.json"]) {
    await assert.rejects(
      () => projectPagesRuntime(withPaths(profile, [bad]), manifestRaw, files),
      /runtime path/i,
      bad,
    );
  }
});

test("Pages runtime projection code stays pure and host-independent", async () => {
  const source = await readFile(
    new URL("../tools/pages-runtime.ts", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    "node:fs",
    "Date(",
    "Date.now",
    "fetch(",
    "XMLHttpRequest",
    "document.",
    "window.",
    "github",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
