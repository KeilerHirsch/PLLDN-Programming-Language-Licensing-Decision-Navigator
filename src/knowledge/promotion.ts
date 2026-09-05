// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

import {
  createManifest,
  encodeCanonical,
  type Manifest,
  sha256,
} from "../snapshots/manifest.ts";
import {
  type Document,
  parseDocument,
  validateDocument,
} from "../validation/documents.ts";
import { asObject, parseStrictJson } from "../validation/json.ts";
import { validateReferences } from "../validation/references.ts";
import { buildKnowledgeCandidate } from "./candidate.ts";

export interface KnowledgeReview {
  schema_version: "0.1";
  review_id: string;
  candidate_manifest_sha256: string;
  reviewer: { kind: "human"; identity: string };
  reviewed_at: string;
  decision: "APPROVE";
  assertions: { assertion_id: string; test_refs: string[] }[];
}

export interface PromotionBuild {
  manifest: Manifest;
  documents: Document[];
  files: Record<string, string>;
}
const assertionKinds = new Set(["claim", "relation", "rule"]);

export async function candidateDigest(manifest: Manifest): Promise<string> {
  return sha256(encodeCanonical(manifest));
}

function assertionId(doc: Document): string {
  const field = `${doc.kind}_id`;
  const id = doc.record[field];
  if (typeof id !== "string") throw new Error("Assertion identity missing");
  return id;
}

function reviewedSnapshotId(candidateId: string): string {
  if (!candidateId.startsWith("candidate."))
    throw new Error("Candidate snapshot identity is invalid");
  return `reviewed.${candidateId.slice("candidate.".length)}`;
}
export async function promoteKnowledgeCandidate(
  files: Readonly<Record<string, string>>,
  at: string,
  reviewInput: KnowledgeReview,
): Promise<PromotionBuild> {
  const candidate = await buildKnowledgeCandidate(files, at);
  validateDocument("review", reviewInput);
  if (
    reviewInput.candidate_manifest_sha256 !==
    (await candidateDigest(candidate.manifest))
  )
    throw new Error("Review candidate manifest binding mismatch");

  const assertions = candidate.documents.filter((d) =>
    assertionKinds.has(d.kind),
  );
  const expected = new Set(assertions.map(assertionId));
  const approved = new Map<string, string[]>();
  for (const item of reviewInput.assertions) {
    if (approved.has(item.assertion_id))
      throw new Error("Duplicate review assertion");
    approved.set(item.assertion_id, item.test_refs);
  }
  if (
    approved.size !== expected.size ||
    [...approved.keys()].some((id) => !expected.has(id)) ||
    [...expected].some((id) => !approved.has(id))
  )
    throw new Error("Review coverage mismatch");
  const promotedFiles: Record<string, string> = {};
  for (const [path, raw] of Object.entries(files)) {
    const wrapper = asObject(parseStrictJson(raw));
    const kind = wrapper.kind as string;
    const record = asObject(wrapper.record);
    if (assertionKinds.has(kind)) {
      const id = record[`${kind}_id`] as string;
      record.review_status = "Reviewed";
      record.test_refs = approved.get(id);
    }
    promotedFiles[path] = encodeCanonical({ kind, record });
  }

  const reviewPath = `reviews/${reviewInput.review_id.replaceAll(".", "-")}.json`;
  promotedFiles[reviewPath] = encodeCanonical({
    kind: "review",
    record: reviewInput,
  });
  const documents = Object.values(promotedFiles).map(parseDocument);
  validateReferences(documents, at);

  const manifest = await createManifest(
    promotedFiles,
    reviewedSnapshotId(candidate.manifest.knowledge_snapshot),
    reviewedSnapshotId(candidate.manifest.rules_snapshot),
  );
  return { manifest, documents, files: promotedFiles };
}
