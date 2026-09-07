// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import formats from "ajv-formats";
import publicationSchema from "../assurance/publication-manifest.schema.json" with {
  type: "json",
};
import releaseEvidenceSchema from "../assurance/release-evidence.schema.json" with {
  type: "json",
};
import { encodeCanonical } from "../src/snapshots/manifest.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";
import { buildPages } from "./build-pages.ts";
import { buildDeterministicTarGz } from "./release-archive.ts";
import {
  buildReviewedCoverage,
  renderKnownLimitations,
} from "./release-coverage.ts";
import {
  EXPECTED_RELEASE_ASSETS,
  loadReleasePolicy,
} from "./release-policy.ts";
import { canonicalizeCycloneDx } from "./release-sbom.ts";
import { sourceTree } from "./source-tree.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const pageNames = ["app.css", "app.js", "index.html", "runtime.js"] as const;
const ajv = new Ajv2020({ strict: true, allErrors: true });
formats.default(ajv);
const validateReleaseEvidence = ajv.compile(releaseEvidenceSchema);
const validatePublicationManifest = ajv.compile(publicationSchema);
export interface PreparedReleaseInputs {
  headSha: string;
  commitEpochIso: string;
  sourceTreeSha256: string;
  repositoryEvidenceRaw: string;
  coverageLogRaw: string;
  nodeVersion: string;
  npmVersion: string;
  sbomRaw: string;
  pagesFiles: Readonly<Record<string, Buffer>>;
}

export interface BuildReleaseOptions {
  targetSha: string;
  releaseEpoch: string;
  outDir: string;
  prepared?: PreparedReleaseInputs;
}

function hashBytes(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function lexical(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function assertSha40(value: string): void {
  if (!/^[0-9a-f]{40}$/u.test(value))
    throw new Error("Exact release target SHA required");
}
function assertEpoch(value: string): void {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== value)
    throw new Error("Canonical release epoch required");
}

function assertSha256(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value))
    throw new Error(`${label} SHA-256 required`);
}

function equalBuffers(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && a.equals(b);
}

function equalPages(
  a: Readonly<Record<string, Buffer>>,
  b: Readonly<Record<string, Buffer>>,
): boolean {
  return pageNames.every(
    (name) => a[name] && b[name] && equalBuffers(a[name], b[name]),
  );
}

export function validatePublicAssetNames(names: readonly string[]): void {
  const sorted = [...names].sort(lexical);
  const expected = [...EXPECTED_RELEASE_ASSETS].sort(lexical);
  if (
    sorted.length !== expected.length ||
    sorted.some((name, index) => name !== expected[index])
  )
    throw new Error("Release public asset set drift");
}

export function createSha256Sums(assets: ReadonlyMap<string, Buffer>): string {
  if (assets.has("SHA256SUMS"))
    throw new Error("Checksum file cannot hash itself");
  const expected = EXPECTED_RELEASE_ASSETS.filter(
    (name) => name !== "SHA256SUMS",
  ).sort(lexical);
  const actual = [...assets.keys()].sort(lexical);
  if (
    actual.length !== expected.length ||
    actual.some((name, index) => name !== expected[index])
  )
    throw new Error("Checksum input asset set drift");
  return actual
    .map((name) => `${hashBytes(assets.get(name) as Buffer)}  ${name}\n`)
    .join("");
}
async function readPagesDir(dir: string): Promise<Record<string, Buffer>> {
  const names = (await readdir(dir)).sort(lexical);
  const expected = [...pageNames].sort(lexical);
  if (
    names.length !== expected.length ||
    names.some((name, index) => name !== expected[index])
  )
    throw new Error("Pages release file set drift");
  return Object.fromEntries(
    await Promise.all(
      pageNames.map(async (name) => [name, await readFile(join(dir, name))]),
    ),
  );
}

function parseCoverage(raw: string): {
  lines: number;
  branches: number;
  functions: number;
} {
  const match = raw.match(
    /all files\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)/u,
  );
  if (!match) throw new Error("Coverage summary missing");
  return {
    lines: Number(match[1]),
    branches: Number(match[2]),
    functions: Number(match[3]),
  };
}

function verificationFromEvidence(raw: string, sourceDigest: string) {
  const evidence = asObject(parseStrictJson(raw));
  if (evidence.subject_sha256 !== sourceDigest)
    throw new Error("Repository evidence subject mismatch");
  const checks = evidence.checks;
  if (!Array.isArray(checks) || checks.length === 0)
    throw new Error("Repository evidence checks missing");
  const summary = checks.map((item) => {
    const check = asObject(item);
    if (typeof check.id !== "string" || check.result !== "PASS")
      throw new Error("Repository evidence contains a failed or invalid check");
    return { id: check.id, result: "PASS" as const };
  });
  return { state: "PASS" as const, checks: summary };
}
async function buildRealPages(): Promise<Record<string, Buffer>> {
  const first = await mkdtemp(join(tmpdir(), "plldn-release-pages-a-"));
  const second = await mkdtemp(join(tmpdir(), "plldn-release-pages-b-"));
  try {
    await buildPages(first);
    await buildPages(second);
    const a = await readPagesDir(first);
    const b = await readPagesDir(second);
    if (!equalPages(a, b)) throw new Error("Pages double-build mismatch");
    return a;
  } finally {
    await rm(first, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
  }
}

function gitText(args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function npmSbom(): string {
  const npmExec = process.env.npm_execpath;
  if (!npmExec) throw new Error("build:release must run through npm");
  return execFileSync(
    process.execPath,
    [npmExec, "sbom", "--sbom-format", "cyclonedx"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    },
  );
}
async function loadRealInputs(): Promise<PreparedReleaseInputs> {
  if (gitText(["status", "--porcelain"]))
    throw new Error("Clean release worktree required");
  const packageJson = asObject(
    parseStrictJson(await readFile(resolve(repoRoot, "package.json"), "utf8")),
  );
  const engines = asObject(packageJson.engines);
  if (typeof engines.npm !== "string")
    throw new Error("Pinned npm version missing");
  const epochSeconds = Number(gitText(["show", "-s", "--format=%ct", "HEAD"]));
  if (!Number.isSafeInteger(epochSeconds) || epochSeconds < 0)
    throw new Error("Invalid commit epoch");
  return {
    headSha: gitText(["rev-parse", "HEAD"]),
    commitEpochIso: new Date(epochSeconds * 1000).toISOString(),
    sourceTreeSha256: sourceTree().sha256,
    repositoryEvidenceRaw: await readFile(
      resolve(repoRoot, "reports/evidence.json"),
      "utf8",
    ),
    coverageLogRaw: await readFile(
      resolve(repoRoot, "reports/test-coverage.txt"),
      "utf8",
    ),
    nodeVersion: process.version,
    npmVersion: engines.npm,
    sbomRaw: npmSbom(),
    pagesFiles: await buildRealPages(),
  };
}

async function pagesArchive(
  pages: Readonly<Record<string, Buffer>>,
  epochSeconds: number,
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "plldn-release-archive-"));
  try {
    for (const name of pageNames) {
      const bytes = pages[name];
      if (!bytes) throw new Error(`Missing Pages file: ${name}`);
      await writeFile(join(dir, name), bytes);
    }
    const first = await buildDeterministicTarGz(dir, epochSeconds);
    const second = await buildDeterministicTarGz(dir, epochSeconds);
    if (!equalBuffers(first, second))
      throw new Error("Release archive double-build mismatch");
    return first;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
export async function buildRelease(
  options: BuildReleaseOptions,
): Promise<void> {
  assertSha40(options.targetSha);
  assertEpoch(options.releaseEpoch);
  const policy = loadReleasePolicy(
    resolve(repoRoot, "release/v0.0.1-beta.1/policy.json"),
  );
  const input = options.prepared ?? (await loadRealInputs());
  if (input.headSha !== options.targetSha)
    throw new Error("HEAD does not match release target");
  if (input.commitEpochIso !== options.releaseEpoch)
    throw new Error("Release epoch does not match target commit");
  assertSha256(input.sourceTreeSha256, "Source tree");
  const verification = verificationFromEvidence(
    input.repositoryEvidenceRaw,
    input.sourceTreeSha256,
  );
  const coverageSummary = parseCoverage(input.coverageLogRaw);
  const epochSeconds = Math.floor(Date.parse(options.releaseEpoch) / 1000);
  const archive = await pagesArchive(input.pagesFiles, epochSeconds);
  const reviewedCoverage = await buildReviewedCoverage(
    policy,
    options.targetSha,
  );
  const limitations = renderKnownLimitations(policy);
  const sbom = canonicalizeCycloneDx(input.sbomRaw, options.releaseEpoch);
  const policySchemaRaw = await readFile(
    resolve(repoRoot, "schemas/release-policy.schema.json"),
    "utf8",
  );
  const releaseNotes = await readFile(
    resolve(repoRoot, policy.release_notes_path),
    "utf8",
  );
  const pageHashes = pageNames.map((name) => {
    const bytes = input.pagesFiles[name];
    if (!bytes) throw new Error(`Missing Pages file: ${name}`);
    return { name, sha256: hashBytes(bytes) };
  });
  const releaseEvidenceObject = {
    schema_version: "0.1",
    release: {
      version: policy.version,
      tag: policy.tag,
      title: policy.title,
      prerelease: policy.prerelease,
    },
    target_commit_sha: options.targetSha,
    target_commit_timestamp: options.releaseEpoch,
    source_tree_sha256: input.sourceTreeSha256,
    repository_evidence_sha256: hashBytes(input.repositoryEvidenceRaw),
    verification,
    coverage: coverageSummary,
    toolchain: { node: input.nodeVersion, npm: input.npmVersion },
    trust: {
      reviewed_source_manifest_sha256: policy.reviewed_source_manifest_sha256,
      runtime_projection_sha256: policy.runtime_projection_sha256,
    },
    pages: { files: pageHashes, archive_sha256: hashBytes(archive) },
    artifacts: {
      reviewed_coverage_sha256: hashBytes(reviewedCoverage),
      known_limitations_sha256: hashBytes(limitations),
      sbom_sha256: hashBytes(sbom),
    },
    immutable_release_requirement: "required",
    release_workflow_path: ".github/workflows/release.yml",
    release_policy_schema_sha256: hashBytes(policySchemaRaw),
  };
  if (!validateReleaseEvidence(releaseEvidenceObject))
    throw new Error(
      `Invalid release evidence: ${ajv.errorsText(validateReleaseEvidence.errors)}`,
    );
  const releaseEvidence = encodeCanonical(releaseEvidenceObject);
  const publicAssets = new Map<string, Buffer>([
    ["known-limitations.md", Buffer.from(limitations)],
    ["plldn-v0.0.1-beta.1-pages.tar.gz", archive],
    ["release-evidence.json", Buffer.from(releaseEvidence)],
    ["reviewed-coverage.json", Buffer.from(reviewedCoverage)],
    ["sbom.cdx.json", Buffer.from(sbom)],
  ]);
  const sums = createSha256Sums(publicAssets);
  publicAssets.set("SHA256SUMS", Buffer.from(sums));
  validatePublicAssetNames([...publicAssets.keys()]);

  const output = resolve(options.outDir);
  const publicDir = join(output, "public");
  const internalDir = join(output, "internal");
  await rm(output, { recursive: true, force: true });
  await mkdir(publicDir, { recursive: true });
  await mkdir(internalDir, { recursive: true });
  for (const name of EXPECTED_RELEASE_ASSETS) {
    const bytes = publicAssets.get(name);
    if (!bytes) throw new Error(`Missing release asset: ${name}`);
    await writeFile(join(publicDir, name), bytes);
  }
  const publicationManifestObject = {
    schema_version: "0.1",
    release: {
      version: policy.version,
      tag: policy.tag,
      title: policy.title,
      prerelease: policy.prerelease,
    },
    target_commit_sha: options.targetSha,
    assets: EXPECTED_RELEASE_ASSETS.map((name) => ({
      name,
      sha256: hashBytes(publicAssets.get(name) as Buffer),
    })),
    release_notes: {
      path: policy.release_notes_path,
      sha256: hashBytes(releaseNotes),
      text: releaseNotes,
    },
  };
  if (!validatePublicationManifest(publicationManifestObject))
    throw new Error(
      `Invalid publication manifest: ${ajv.errorsText(validatePublicationManifest.errors)}`,
    );
  await writeFile(
    join(internalDir, "publication-manifest.json"),
    encodeCanonical(publicationManifestObject),
  );
  validatePublicAssetNames(await readdir(publicDir));
}
function cliValue(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  await buildRelease({
    targetSha: cliValue("--target-sha"),
    releaseEpoch: cliValue("--epoch"),
    outDir: resolve(repoRoot, ".build/release"),
  });
}
