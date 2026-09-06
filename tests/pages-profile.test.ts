// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parsePagesRuntimeProfile } from "../tools/pages-profile.ts";

const profilePath = new URL(
  "../deployments/github-pages/runtime-profile.json",
  import.meta.url,
);
const SOURCE_SHA =
  "a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5";
const RUNTIME_SHA =
  "a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec";

function encode(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

async function checkedIn(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(profilePath, "utf8")) as Record<
    string,
    unknown
  >;
}
test("checked-in Pages profile binds the frozen deployment approval", async () => {
  const raw = await readFile(profilePath, "utf8");
  const profile = parsePagesRuntimeProfile(raw);
  assert.equal(profile.schema_version, "0.1");
  assert.equal(profile.deployment_id, "github-pages");
  assert.equal(
    profile.source_manifest_path,
    "knowledge/reviewed/stage2-core.manifest.json",
  );
  assert.equal(profile.approved_source_manifest_sha256, SOURCE_SHA);
  assert.equal(
    profile.runtime_knowledge_snapshot,
    "deployment.github-pages.language.stage2-core.2026-09-06",
  );
  assert.equal(profile.approved_runtime_manifest_sha256, RUNTIME_SHA);
  assert.equal(profile.candidate_type, "language");
  assert.equal(profile.runtime_document_paths.length, 16);
  assert.deepEqual(
    [...profile.runtime_document_paths].sort((a, b) => a.localeCompare(b)),
    profile.runtime_document_paths,
  );
  assert.equal(new Set(profile.runtime_document_paths).size, 16);
  assert.equal(profile.base_project.components.length, 1);
  assert.equal(
    profile.base_project.components[0]?.component_id,
    profile.component_id,
  );
  assert.deepEqual(profile.base_project.facts, []);
  assert.deepEqual(profile.base_project.boundaries, []);
});
test("Pages profile rejects unsafe runtime document paths", async () => {
  const base = await checkedIn();
  for (const bad of [
    "../x.json",
    "/claims/x.json",
    "C:/claims/x.json",
    "candidate/claims/x.json",
    "knowledge/candidate/x.json",
  ]) {
    assert.throws(
      () =>
        parsePagesRuntimeProfile(
          encode({ ...base, runtime_document_paths: [bad] }),
        ),
      /runtime path/i,
      bad,
    );
  }
});

test("Pages profile rejects unsorted or duplicate runtime paths", async () => {
  const base = await checkedIn();
  const paths = base.runtime_document_paths as string[];
  assert.throws(
    () =>
      parsePagesRuntimeProfile(
        encode({ ...base, runtime_document_paths: [...paths].reverse() }),
      ),
    /sorted/i,
  );
  assert.throws(
    () =>
      parsePagesRuntimeProfile(
        encode({ ...base, runtime_document_paths: [...paths, paths[0]] }),
      ),
    /unique/i,
  );
});
test("Pages profile rejects schema extensions and malformed base projects", async () => {
  const base = await checkedIn();
  assert.throws(
    () => parsePagesRuntimeProfile(encode({ ...base, surprise: true })),
    /invalid Pages runtime profile/i,
  );
  assert.throws(
    () =>
      parsePagesRuntimeProfile(
        encode({
          ...base,
          base_project: {
            schema_version: "0.1",
            project_id: "project.pages",
            components: [
              { component_id: "component.pages", form: "browser-ui" },
            ],
            facts: [],
          },
        }),
      ),
    /project-facts/i,
  );
});

test("Pages profile requires component_id to name its only base component", async () => {
  const base = await checkedIn();
  assert.throws(
    () =>
      parsePagesRuntimeProfile(
        encode({ ...base, component_id: "component.other" }),
      ),
    /component/i,
  );
});
