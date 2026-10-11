// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACK = "knowledge/candidate/catalog-2026-10-03";
const SEED_PREFIX = `${PACK}/evidence/`;

interface SeedSource {
  source_id: string;
  source_class: string;
  reference: string;
  content_sha256: string;
}
interface CandidateClaim {
  claim_id: string;
  entity_id: string;
  dimension_id: string;
  review_status: string;
  state: string;
  source_ids: string[];
  test_refs: string[];
}

export interface ClaimAuditRow {
  claim_id: string;
  entity_id: string;
  dimension_id: string;
  review_status: string;
  state: string;
  evidence_status: "INTERNAL_SEED_ONLY" | "OTHER_UNVERIFIED_SOURCE" | "NO_SOURCE";
  source_ids: string[];
  test_refs: string[];
}

export interface ProvenanceAudit {
  schema_version: "0.1";
  scope: string;
  claims_total: number;
  internal_seed_only: number;
  other_unverified_sources: number;
  no_sources: number;
  claims_with_test_refs: number;
  internal_seed_documents: number;
  verified_internal_seed_hashes: number;
  mutable_main_source_urls: number;
  independently_verified_claims: 0;
  sources: { id: string; type: string; reference: string; sha256_matches: boolean }[];
  claims: ClaimAuditRow[];
}

function parseRecord<T>(filename: string): T {
  const value = JSON.parse(readFileSync(filename, "utf8")) as {
    kind?: string;
    record?: T;
  };
  if (!value.record) throw new Error(`Missing record: ${filename}`);
  return value.record;
}

const lexical = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

/** SHA binding verifies seed bytes, NOT accuracy of the seed's assertions. */
function internalSeedPath(source: SeedSource): string | null {
  let url: URL;
  try {
    url = new URL(source.reference);
  } catch {
    return null;
  }
  const marker = "/blob/main/";
  const position = url.pathname.indexOf(marker);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    position < 0
  ) {
    return null;
  }
  const path = url.pathname.slice(position + marker.length);
  return path.startsWith(SEED_PREFIX) &&
    !path.includes("..") &&
    source.source_class === "community"
    ? path
    : null;
}

export function auditPreviewProvenance(root = process.cwd()): ProvenanceAudit {
  const dir = resolve(root, PACK);
  const sourceFiles = readdirSync(join(dir, "sources"))
    .filter((name) => name.endsWith(".json"))
    .sort(lexical);
  const sources = new Map<string, SeedSource>();
  const sourceAudit: ProvenanceAudit["sources"] = [];
  let verifiedInternal = 0;
  let mutableMain = 0;
  for (const file of sourceFiles) {
    const source = parseRecord<SeedSource>(join(dir, "sources", file));
    if (sources.has(source.source_id))
      throw new Error(`Duplicate source ID: ${source.source_id}`);
    sources.set(source.source_id, source);
    const path = internalSeedPath(source);
    let matches = false;
    if (path) {
      const hash = createHash("sha256")
        .update(readFileSync(resolve(root, path)))
        .digest("hex");
      matches = hash === source.content_sha256;
      if (!matches) throw new Error(`Seed hash mismatch: ${source.source_id}`);
      verifiedInternal += 1;
      mutableMain += 1;
    }
    sourceAudit.push({
      id: source.source_id,
      type: path ? "INTERNAL_SEED" : "OTHER_UNVERIFIED",
      reference: source.reference,
      sha256_matches: matches,
    });
  }

  const claims: ClaimAuditRow[] = readdirSync(join(dir, "claims"))
    .filter((name) => name.endsWith(".json"))
    .sort(lexical)
    .map((file) => {
      const claim = parseRecord<CandidateClaim>(join(dir, "claims", file));
      if (claim.review_status !== "Preview") {
        throw new Error(`Non-Preview record in candidate pack: ${claim.claim_id}`);
      }
      const kinds = claim.source_ids.map((id) => {
        const source = sources.get(id);
        if (!source) throw new Error(`Unresolved source ${id}: ${claim.claim_id}`);
        return internalSeedPath(source) ? "INTERNAL_SEED" : "OTHER_UNVERIFIED";
      });
      const evidence_status =
        kinds.length === 0
          ? "NO_SOURCE"
          : kinds.every((kind) => kind === "INTERNAL_SEED")
            ? "INTERNAL_SEED_ONLY"
            : "OTHER_UNVERIFIED_SOURCE";
      return {
        claim_id: claim.claim_id,
        entity_id: claim.entity_id,
        dimension_id: claim.dimension_id,
        review_status: claim.review_status,
        state: claim.state,
        evidence_status,
        source_ids: [...claim.source_ids],
        test_refs: [...claim.test_refs],
      };
    })
    .sort((a, b) => lexical(a.claim_id, b.claim_id));
  if (new Set(claims.map((claim) => claim.claim_id)).size !== claims.length) {
    throw new Error("Duplicate Preview claim ID");
  }
  return {
    schema_version: "0.1",
    scope: PACK,
    claims_total: claims.length,
    internal_seed_only: claims.filter(
      (claim) => claim.evidence_status === "INTERNAL_SEED_ONLY",
    ).length,
    other_unverified_sources: claims.filter(
      (claim) => claim.evidence_status === "OTHER_UNVERIFIED_SOURCE",
    ).length,
    no_sources: claims.filter(
      (claim) => claim.evidence_status === "NO_SOURCE",
    ).length,
    claims_with_test_refs: claims.filter(
      (claim) => claim.test_refs.length > 0,
    ).length,
    internal_seed_documents: sourceAudit.filter(
      (source) => source.type === "INTERNAL_SEED",
    ).length,
    verified_internal_seed_hashes: verifiedInternal,
    mutable_main_source_urls: mutableMain,
    independently_verified_claims: 0,
    sources: sourceAudit,
    claims,
  };
}

const invokedAs = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedAs === fileURLToPath(import.meta.url)) {
  const report = auditPreviewProvenance();
  if (process.argv.includes("--claims")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const { claims: _claims, ...summary } = report;
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  }
}
