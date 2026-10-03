// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { createManifest, type Manifest } from "../snapshots/manifest.ts";
import { type Document, parseDocument } from "../validation/documents.ts";
import { validateReferences } from "../validation/references.ts";

export interface CandidateBuild {
  manifest: Manifest;
  documents: Document[];
  reviewedAssertions: number;
  partialAssertions: number;
}

export interface CandidateSnapshotIdentity {
  knowledgeSnapshot: string;
  rulesSnapshot: string;
}

export const STAGE2_CORE_CANDIDATE_IDENTITY: Readonly<CandidateSnapshotIdentity> =
  Object.freeze({
    knowledgeSnapshot: "candidate.stage2-core.2026-09-05",
    rulesSnapshot: "candidate.stage2-core.rules.2026-09-05",
  });

function candidateSnapshotIdentity(
  identity: CandidateSnapshotIdentity | undefined,
): CandidateSnapshotIdentity {
  const resolved = identity ?? STAGE2_CORE_CANDIDATE_IDENTITY;
  if (
    !resolved.knowledgeSnapshot.startsWith("candidate.") ||
    !resolved.rulesSnapshot.startsWith("candidate.")
  ) {
    throw new Error(
      "Candidate snapshot identity must use candidate.* namespace",
    );
  }
  return resolved;
}

const assertionKinds = new Set(["claim", "relation", "rule"]);
const forbiddenKinds = new Set([
  "project-facts",
  "decision-trace",
  "review",
  "snapshot",
]);

/** Validate an untrusted authoring pack. Candidate content can never approve itself. */
export async function buildKnowledgeCandidate(
  files: Readonly<Record<string, string>>,
  at: string,
  identity?: CandidateSnapshotIdentity,
): Promise<CandidateBuild> {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0)
    throw new Error("Candidate knowledge pack is empty");
  const documents = entries.map(([, raw]) => parseDocument(raw));
  if (documents.some((doc) => forbiddenKinds.has(doc.kind)))
    throw new Error("Candidate pack contains a non-knowledge document");

  let reviewedAssertions = 0;
  let partialAssertions = 0;
  for (const doc of documents) {
    if (!assertionKinds.has(doc.kind)) continue;
    if (doc.record.review_status === "Reviewed") reviewedAssertions += 1;
    if (doc.record.review_status === "Partial") partialAssertions += 1;
  }
  if (reviewedAssertions !== 0)
    throw new Error("Candidate pack cannot self-declare Reviewed assertions");

  validateReferences(documents, at);
  const snapshot = candidateSnapshotIdentity(identity);
  const manifest = await createManifest(
    files,
    snapshot.knowledgeSnapshot,
    snapshot.rulesSnapshot,
  );
  return { manifest, documents, reviewedAssertions, partialAssertions };
}
