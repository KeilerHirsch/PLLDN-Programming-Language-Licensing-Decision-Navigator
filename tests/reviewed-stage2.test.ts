// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { buildKnowledgeCandidate } from "../src/knowledge/candidate.ts";
import {
  candidateDigest,
  type KnowledgeReview,
  promoteKnowledgeCandidate,
} from "../src/knowledge/promotion.ts";
import { sha256 } from "../src/snapshots/manifest.ts";
import { verifySnapshot } from "../src/snapshots/verify.ts";

const at = "2026-09-05T21:42:20Z";
const approvedCandidate =
  "4e5248d930fc592fe95a7dd03bd7bfd26e2c4ba619c291ebd71820b63864544f";
const candidateRoot = new URL(
  "../knowledge/candidate/stage2-core/",
  import.meta.url,
);
const reviewedRoot = new URL(
  "../knowledge/reviewed/stage2-core/",
  import.meta.url,
);
function tree(root: URL): Record<string, string> {
  const out: Record<string, string> = {};
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const child = new URL(`${dir.name}/`, root);
    for (const name of readdirSync(child).filter((x) => x.endsWith(".json"))) {
      out[`${dir.name}/${name}`] = readFileSync(new URL(name, child), "utf8");
    }
  }
  return out;
}

function reviewFrom(files: Record<string, string>): KnowledgeReview {
  const entry = Object.entries(files).find(([path]) =>
    path.startsWith("reviews/"),
  );
  if (!entry)
    throw new Error("Reviewed snapshot is missing its human review record");
  const wrapper = JSON.parse(entry[1]) as { record: KnowledgeReview };
  return wrapper.record;
}

test("checked-in Reviewed snapshot exactly reproduces the approved candidate", async () => {
  const candidateFiles = tree(candidateRoot);
  const candidate = await buildKnowledgeCandidate(candidateFiles, at);
  assert.equal(await candidateDigest(candidate.manifest), approvedCandidate);
  assert.equal(candidate.reviewedAssertions, 0);
  assert.equal(candidate.partialAssertions, 16);
  const reviewedFiles = tree(reviewedRoot);
  const review = reviewFrom(reviewedFiles);
  assert.equal(review.reviewer.kind, "human");
  assert.equal(review.reviewer.identity, "KeilerHirsch");
  assert.equal(review.candidate_manifest_sha256, approvedCandidate);
  assert.equal(review.assertions.length, 16);

  const rebuilt = await promoteKnowledgeCandidate(candidateFiles, at, review);
  assert.deepEqual(rebuilt.files, reviewedFiles);
  const checkedManifest = JSON.parse(
    readFileSync(
      new URL(
        "../knowledge/reviewed/stage2-core.manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.deepEqual(rebuilt.manifest, checkedManifest);
  assert.equal(
    rebuilt.manifest.knowledge_snapshot,
    "reviewed.stage2-core.2026-09-05",
  );
  assert.equal(
    rebuilt.manifest.rules_snapshot,
    "reviewed.stage2-core.rules.2026-09-05",
  );
});
test("repository ships no default runtime snapshot approval pin", () => {
  const trust = JSON.parse(
    readFileSync(
      new URL("../assurance/trusted-snapshots.json", import.meta.url),
      "utf8",
    ),
  ) as { digests: string[]; scope: string };
  assert.deepEqual(trust.digests, []);
  assert.match(trust.scope, /runtime snapshot approval/i);
});

test("Reviewed snapshot requires a caller-supplied approval digest", async () => {
  const reviewedFiles = tree(reviewedRoot);
  const manifest = readFileSync(
    new URL("../knowledge/reviewed/stage2-core.manifest.json", import.meta.url),
    "utf8",
  );
  await assert.rejects(() => verifySnapshot(manifest, reviewedFiles, [], at));
  const documents = await verifySnapshot(
    manifest,
    reviewedFiles,
    [await sha256(manifest)],
    at,
  );
  assert.equal(documents.length, 52);
  const assertions = documents.filter((doc) =>
    ["claim", "relation", "rule"].includes(doc.kind),
  );
  assert.equal(assertions.length, 16);
  assert(assertions.every((doc) => doc.record.review_status === "Reviewed"));
});
