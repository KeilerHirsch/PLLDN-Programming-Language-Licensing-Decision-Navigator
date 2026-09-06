// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import {
  encodeCanonical,
  type Manifest,
  sha256,
} from "../src/snapshots/manifest.ts";
import { validateDocument } from "../src/validation/documents.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";
import type { PagesBaseProject, PagesRuntimeProfile } from "./pages-profile.ts";

const runtimePath =
  /^(claims|dimensions|entities|sources)\/[a-z0-9._-]+\.json$/;

export interface ProjectedPagesRuntime {
  manifestRaw: string;
  manifestSha256: string;
  files: Readonly<Record<string, string>>;
  baseProject: PagesBaseProject;
  candidateType: "language";
  componentId: string;
}
function sourceManifest(raw: string): Manifest {
  const parsed = asObject(parseStrictJson(raw));
  validateDocument("snapshot", parsed);
  return parsed as unknown as Manifest;
}

/** Derive only the explicitly approved Pages runtime closure from Reviewed bytes. */
export async function projectPagesRuntime(
  profile: PagesRuntimeProfile,
  sourceManifestRaw: string,
  sourceFiles: Readonly<Record<string, string>>,
): Promise<ProjectedPagesRuntime> {
  if (
    (await sha256(sourceManifestRaw)) !==
    profile.approved_source_manifest_sha256
  )
    throw new Error("Source manifest approval mismatch");

  for (const path of profile.runtime_document_paths)
    if (!runtimePath.test(path)) throw new Error("Invalid runtime path");
  if (
    new Set(profile.runtime_document_paths).size !==
    profile.runtime_document_paths.length
  )
    throw new Error("Runtime paths must be unique");

  const source = sourceManifest(sourceManifestRaw);
  const sourceByPath = new Map(
    source.documents.map((entry) => [entry.path, entry]),
  );
  if (sourceByPath.size !== source.documents.length)
    throw new Error("Source manifest document paths are not unique");

  const files: Record<string, string> = {};
  const documents: Manifest["documents"] = [];
  for (const path of profile.runtime_document_paths) {
    const entry = sourceByPath.get(path);
    if (!entry) throw new Error("Runtime path missing from source manifest");
    const content = sourceFiles[path];
    if (typeof content !== "string")
      throw new Error("Runtime source document missing");
    if ((await sha256(content)) !== entry.sha256)
      throw new Error("Runtime document digest mismatch");
    files[path] = content;
    documents.push({ path: entry.path, sha256: entry.sha256 });
  }

  const runtimeManifest: Manifest = {
    schema_version: "0.1",
    knowledge_snapshot: profile.runtime_knowledge_snapshot,
    rules_snapshot: source.rules_snapshot,
    schema_sha256: source.schema_sha256,
    documents,
  };
  validateDocument(
    "snapshot",
    runtimeManifest as unknown as Record<string, unknown>,
  );
  const manifestRaw = encodeCanonical(runtimeManifest);
  const manifestSha256 = await sha256(manifestRaw);
  if (manifestSha256 !== profile.approved_runtime_manifest_sha256)
    throw new Error("Runtime projection approval mismatch");

  return {
    manifestRaw,
    manifestSha256,
    files,
    baseProject: profile.base_project,
    candidateType: profile.candidate_type,
    componentId: profile.component_id,
  };
}
