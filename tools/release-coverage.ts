// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeCanonical, sha256 } from "../src/snapshots/manifest.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";
import { parsePagesRuntimeProfile } from "./pages-profile.ts";
import { projectPagesRuntime } from "./pages-runtime.ts";
import type { ReleasePolicy } from "./release-policy.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const reviewedManifestPath = resolve(
  repoRoot,
  "knowledge/reviewed/stage2-core.manifest.json",
);
const reviewedRoot = resolve(repoRoot, "knowledge/reviewed/stage2-core");
const pagesProfilePath = resolve(
  repoRoot,
  "deployments/github-pages/runtime-profile.json",
);

function assertSha(value: string): void {
  if (!/^[0-9a-f]{40}$/u.test(value))
    throw new Error("Exact source commit SHA required");
}

function recordId(raw: string): string | undefined {
  const envelope = asObject(parseStrictJson(raw));
  const record = asObject(envelope.record);
  const id = record.entity_id ?? record.dimension_id;
  return typeof id === "string" ? id : undefined;
}

async function loadTrustState(policy: ReleasePolicy) {
  const [manifestRaw, profileRaw] = await Promise.all([
    readFile(reviewedManifestPath, "utf8"),
    readFile(pagesProfilePath, "utf8"),
  ]);
  if ((await sha256(manifestRaw)) !== policy.reviewed_source_manifest_sha256)
    throw new Error("Reviewed manifest digest drift");
  const profile = parsePagesRuntimeProfile(profileRaw);
  if (
    profile.approved_source_manifest_sha256 !==
    policy.reviewed_source_manifest_sha256
  )
    throw new Error("Pages source approval drift");
  if (
    profile.approved_runtime_manifest_sha256 !==
    policy.runtime_projection_sha256
  )
    throw new Error("Pages runtime approval drift");
  const manifest = asObject(parseStrictJson(manifestRaw));
  const documents = manifest.documents;
  if (!Array.isArray(documents))
    throw new Error("Reviewed manifest documents required");
  const allIds = new Set<string>();
  for (const item of documents) {
    const path = asObject(item).path;
    if (
      typeof path !== "string" ||
      (!path.startsWith("entities/") && !path.startsWith("dimensions/"))
    )
      continue;
    const id = recordId(await readFile(resolve(reviewedRoot, path), "utf8"));
    if (id) allIds.add(id);
  }
  return { manifestRaw, profile, allIds };
}

export async function buildReviewedCoverage(
  policy: ReleasePolicy,
  targetSha: string,
): Promise<string> {
  assertSha(targetSha);
  const { manifestRaw, profile, allIds } = await loadTrustState(policy);
  const runtimeFiles: Record<string, string> = Object.fromEntries(
    await Promise.all(
      profile.runtime_document_paths.map(async (path) => [
        path,
        await readFile(resolve(reviewedRoot, path), "utf8"),
      ]),
    ),
  );
  const projected = await projectPagesRuntime(
    profile,
    manifestRaw,
    runtimeFiles,
  );
  if (projected.manifestSha256 !== policy.runtime_projection_sha256)
    throw new Error("Runtime projection digest drift");
  const runtimeIds = new Set<string>();
  for (const raw of Object.values(runtimeFiles)) {
    const id = recordId(raw);
    if (id) runtimeIds.add(id);
  }
  for (const id of [...policy.live_language_ids, ...policy.live_dimension_ids])
    if (!allIds.has(id) || !runtimeIds.has(id))
      throw new Error(`Live coverage drift: ${id}`);
  for (const id of policy.reviewed_not_live_license_ids)
    if (!allIds.has(id) || runtimeIds.has(id))
      throw new Error(`Reviewed-not-live coverage drift: ${id}`);
  return encodeCanonical({
    schema_version: "0.1",
    release: {
      version: policy.version,
      tag: policy.tag,
      source_commit: targetSha,
    },
    trust: {
      reviewed_source_manifest_sha256: policy.reviewed_source_manifest_sha256,
      runtime_projection_sha256: policy.runtime_projection_sha256,
    },
    live: {
      languages: [...policy.live_language_ids],
      dimensions: [...policy.live_dimension_ids],
    },
    reviewed_not_live: { licenses: [...policy.reviewed_not_live_license_ids] },
    unsupported_surfaces: [...policy.unsupported_surfaces],
  });
}

export function renderKnownLimitations(policy: ReleasePolicy): string {
  const bullets = policy.unsupported_surfaces.map(
    (item) => `- PLLDN does not broaden this Beta beyond: ${item}`,
  );
  return [
    `# Known limitations — ${policy.title}`,
    "",
    "This Beta intentionally publishes a narrow, evidence-backed surface. Correct abstention is expected when Reviewed evidence is insufficient.",
    "",
    ...bullets,
    "",
  ].join("\n");
}
