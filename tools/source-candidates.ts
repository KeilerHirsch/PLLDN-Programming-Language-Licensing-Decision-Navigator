// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  encodeCanonical,
  type Manifest,
  sha256,
} from "../src/snapshots/manifest.ts";
import {
  type Document,
  evaluationTime,
  parseDocument,
  validateDocument,
} from "../src/validation/documents.ts";
import { asObject, parseStrictJson } from "../src/validation/json.ts";

export type FreshnessReason = "EXPIRED" | "REVIEW_DUE";
export interface FreshnessCandidate {
  claim_id: string;
  source_ids: readonly string[];
  world_freshness_class: string;
  verified_at: string;
  valid_until: string;
  reason: FreshnessReason;
}
export interface FreshnessCandidateReport {
  schema_version: "0.1";
  evaluated_at: string;
  review_window_hours: number;
  candidates: readonly FreshnessCandidate[];
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`Freshness claim requires ${key}`);
  return value;
}

function sourceIds(record: Record<string, unknown>): readonly string[] {
  const value = record.source_ids;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string"))
    throw new Error("Freshness claim requires source_ids");
  return [...value];
}

function reviewHorizon(
  evaluatedAt: string,
  reviewWindowHours: number,
): [number, number] {
  if (!Number.isSafeInteger(reviewWindowHours) || reviewWindowHours <= 0)
    throw new Error("Positive integer review window required");
  const evaluated = evaluationTime(evaluatedAt);
  const horizon = evaluated + reviewWindowHours * 60 * 60 * 1000;
  if (!Number.isFinite(horizon)) throw new Error("Unsupported review window");
  return [evaluated, horizon];
}

export function buildFreshnessReport(
  documents: readonly Document[],
  evaluatedAt: string,
  reviewWindowHours: number,
): FreshnessCandidateReport {
  const [evaluated, horizon] = reviewHorizon(evaluatedAt, reviewWindowHours);
  const candidates: FreshnessCandidate[] = [];
  for (const document of documents) {
    if (document.kind !== "claim") continue;
    const record = document.record;
    if (typeof record.valid_until !== "string") continue;
    const validUntil = evaluationTime(record.valid_until);
    evaluationTime(stringField(record, "verified_at"));
    const reason: FreshnessReason | undefined =
      validUntil <= evaluated
        ? "EXPIRED"
        : validUntil <= horizon
          ? "REVIEW_DUE"
          : undefined;
    if (!reason) continue;
    candidates.push({
      claim_id: stringField(record, "claim_id"),
      source_ids: sourceIds(record),
      world_freshness_class: stringField(record, "world_freshness_class"),
      verified_at: stringField(record, "verified_at"),
      valid_until: record.valid_until,
      reason,
    });
  }
  candidates.sort((a, b) =>
    a.claim_id < b.claim_id ? -1 : a.claim_id > b.claim_id ? 1 : 0,
  );
  return {
    schema_version: "0.1",
    evaluated_at: evaluatedAt,
    review_window_hours: reviewWindowHours,
    candidates,
  };
}

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const reviewedManifestPath = resolve(
  repoRoot,
  "knowledge/reviewed/stage2-core.manifest.json",
);
function parseManifest(raw: string): Manifest {
  const parsed = asObject(parseStrictJson(raw));
  validateDocument("snapshot", parsed);
  return parsed as unknown as Manifest;
}

function isContained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

async function loadReviewedDocuments(): Promise<readonly Document[]> {
  const manifestRaw = await readFile(reviewedManifestPath, "utf8");
  const manifest = parseManifest(manifestRaw);
  const sourceRoot = reviewedManifestPath.slice(0, -".manifest.json".length);
  const documents: Document[] = [];
  const seen = new Set<string>();
  for (const entry of manifest.documents) {
    if (seen.has(entry.path))
      throw new Error("Reviewed manifest path is duplicated");
    seen.add(entry.path);
    const filePath = resolve(sourceRoot, entry.path);
    if (entry.path.includes("\0") || !isContained(sourceRoot, filePath))
      throw new Error("Reviewed manifest path escapes snapshot root");
    const raw = await readFile(filePath, "utf8");
    if ((await sha256(raw)) !== entry.sha256)
      throw new Error(`Reviewed document digest mismatch: ${entry.path}`);
    documents.push(parseDocument(raw));
  }
  return documents;
}
function assertClaimSourcesResolve(documents: readonly Document[]): void {
  const knownSources = new Set(
    documents
      .filter((document) => document.kind === "source")
      .map((document) => stringField(document.record, "source_id")),
  );
  for (const document of documents) {
    if (document.kind !== "claim") continue;
    for (const sourceId of sourceIds(document.record)) {
      if (!knownSources.has(sourceId))
        throw new Error(`Claim source does not resolve: ${sourceId}`);
    }
  }
}

interface CliArgs {
  evaluatedAt: string;
  reviewWindowHours: number;
  output: string;
}

function parseCliArgs(argv: readonly string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set([
    "--evaluated-at",
    "--review-window-hours",
    "--output",
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key || !allowed.has(key) || value === undefined || values.has(key))
      throw new Error("Required CLI arguments are invalid");
    values.set(key, value);
  }
  const evaluatedAt = values.get("--evaluated-at");
  const windowRaw = values.get("--review-window-hours");
  const output = values.get("--output");
  if (!evaluatedAt || !windowRaw || !output)
    throw new Error(
      "evaluated-at, review-window-hours and output are required",
    );
  return {
    evaluatedAt,
    reviewWindowHours: Number(windowRaw),
    output,
  };
}

async function runCli(argv: readonly string[]): Promise<void> {
  const args = parseCliArgs(argv);
  const documents = await loadReviewedDocuments();
  assertClaimSourcesResolve(documents);
  const report = buildFreshnessReport(
    documents,
    args.evaluatedAt,
    args.reviewWindowHours,
  );
  const output = resolve(process.cwd(), args.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, encodeCanonical(report), "utf8");
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
