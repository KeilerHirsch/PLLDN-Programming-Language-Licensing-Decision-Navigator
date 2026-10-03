// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  buildKnowledgeCandidate,
  type CandidateSnapshotIdentity,
} from "../src/knowledge/candidate.ts";
import {
  candidateDigest,
  type KnowledgeReview,
  promoteKnowledgeCandidate,
} from "../src/knowledge/promotion.ts";

const root = new URL("../knowledge/candidate/stage2-core/", import.meta.url);
const at = "2026-09-05T22:00:00Z";
function files(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const child = new URL(`${dir.name}/`, root);
    for (const name of readdirSync(child).filter((x) => x.endsWith(".json")))
      out[`${dir.name}/${name}`] = readFileSync(new URL(name, child), "utf8");
  }
  return out;
}
async function reviewRecord(
  identity?: CandidateSnapshotIdentity,
): Promise<KnowledgeReview> {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const assertionIds = built.documents
    .filter((d) => ["claim", "relation", "rule"].includes(d.kind))
    .map((d) => d.record[`${d.kind}_id`] as string)
    .sort();
  return {
    schema_version: "0.1",
    review_id: "review.stage2.synthetic",
    candidate_manifest_sha256: await candidateDigest(built.manifest),
    reviewer: { kind: "human", identity: "reviewer.example" },
    reviewed_at: at,
    decision: "APPROVE",
    assertions: assertionIds.map((assertion_id) => ({
      assertion_id,
      test_refs: ["test.knowledge-stage2"],
    })),
  };
}
test("promotion rejects review bound to a different candidate manifest", async () => {
  const review = await reviewRecord();
  review.candidate_manifest_sha256 = "0".repeat(64);
  await assert.rejects(
    () => promoteKnowledgeCandidate(files(), at, review),
    /candidate manifest binding mismatch/,
  );
});

test("promotion requires explicit approval coverage for every assertion", async () => {
  const review = await reviewRecord();
  review.assertions.pop();
  await assert.rejects(
    () => promoteKnowledgeCandidate(files(), at, review),
    /Review coverage mismatch/,
  );
});
test("external review promotes every assertion and injects non-empty test refs", async () => {
  const review = await reviewRecord();
  const promoted = await promoteKnowledgeCandidate(files(), at, review);
  const assertions = promoted.documents.filter((d) =>
    ["claim", "relation", "rule"].includes(d.kind),
  );
  assert.equal(assertions.length, 16);
  for (const doc of assertions) {
    assert.equal(doc.record.review_status, "Reviewed");
    assert.deepEqual(doc.record.test_refs, ["test.knowledge-stage2"]);
  }
  const reviews = promoted.documents.filter((d) => d.kind === "review");
  assert.equal(reviews.length, 1);
  assert.equal(
    promoted.manifest.knowledge_snapshot,
    "reviewed.stage2-core.2026-09-05",
  );
});


test("new candidate snapshots use explicit versioned identities without rewriting Stage 2", async () => {
  const identity: CandidateSnapshotIdentity = {
    knowledgeSnapshot: "candidate.language-core.2026-10-03",
    rulesSnapshot: "candidate.language-core.rules.2026-10-03",
  };
  const candidate = await buildKnowledgeCandidate(files(), at, identity);
  assert.equal(
    candidate.manifest.knowledge_snapshot,
    "candidate.language-core.2026-10-03",
  );
  assert.equal(
    candidate.manifest.rules_snapshot,
    "candidate.language-core.rules.2026-10-03",
  );

  const review = await reviewRecord(identity);
  const promoted = await promoteKnowledgeCandidate(
    files(),
    at,
    review,
    identity,
  );
  assert.equal(
    promoted.manifest.knowledge_snapshot,
    "reviewed.language-core.2026-10-03",
  );
  assert.equal(
    promoted.manifest.rules_snapshot,
    "reviewed.language-core.rules.2026-10-03",
  );
});

test("candidate snapshot identities fail closed outside the candidate namespace", async () => {
  await assert.rejects(
    () =>
      buildKnowledgeCandidate(files(), at, {
        knowledgeSnapshot: "reviewed.invalid",
        rulesSnapshot: "candidate.valid.rules",
      }),
    /candidate snapshot identity/i,
  );
});
