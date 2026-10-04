// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  buildKnowledgeCandidate,
  type CandidateSnapshotIdentity,
} from "../src/knowledge/candidate.ts";

const root = new URL(
  "../knowledge/candidate/catalog-2026-10-03/",
  import.meta.url,
);
const at = "2026-10-04T05:59:00Z";
const identity: CandidateSnapshotIdentity = {
  knowledgeSnapshot: "candidate.language-license-catalog.2026-10-03",
  rulesSnapshot: "candidate.language-license-catalog.rules.2026-10-03",
};

function files(): Record<string, string> {
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

test("broad candidate catalog remains structurally valid and non-Reviewed", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  assert.equal(built.documents.length, 427);
  assert.equal(built.reviewedAssertions, 0);
  assert.equal(built.partialAssertions, 0);
  assert.equal(
    built.manifest.knowledge_snapshot,
    "candidate.language-license-catalog.2026-10-03",
  );
  assert.equal(
    built.manifest.rules_snapshot,
    "candidate.language-license-catalog.rules.2026-10-03",
  );
  assert.equal(
    built.documents.some((doc) => ["relation", "rule"].includes(doc.kind)),
    false,
  );
});

test("candidate catalog contains 35 languages and 32 licenses", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const languages = built.documents.filter(
    (doc) => doc.kind === "entity" && doc.record.entity_type === "language",
  );
  const licenses = built.documents.filter(
    (doc) => doc.kind === "entity" && doc.record.entity_type === "license",
  );
  assert.equal(languages.length, 35);
  assert.equal(licenses.length, 32);
  assert(
    languages.every(
      (doc) =>
        JSON.stringify(doc.record.version_scope) ===
        JSON.stringify(["unspecified"]),
    ),
  );
});

test("catalog exposes twelve comparison vocabularies", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const dimensions = built.documents.filter((doc) => doc.kind === "dimension");
  assert.equal(dimensions.length, 12);
  assert(
    dimensions.some(
      (doc) => doc.record.dimension_id === "dimension.package-dependency-tools",
    ),
  );
});

test("every language has nine Preview claims", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const claims = built.documents.filter(
    (doc) =>
      doc.kind === "claim" &&
      typeof doc.record.entity_id === "string" &&
      doc.record.entity_id.startsWith("language."),
  );
  assert.equal(claims.length, 315);
  const byLanguage = new Map<string, number>();
  for (const claim of claims) {
    const entityId = claim.record.entity_id;
    if (typeof entityId !== "string") {
      throw new Error("Claim entity_id must be a string");
    }
    assert.equal(claim.record.review_status, "Preview");
    byLanguage.set(entityId, (byLanguage.get(entityId) ?? 0) + 1);
  }
  assert.equal(byLanguage.size, 35);
  assert([...byLanguage.values()].every((count) => count === 9));
});

test("the original 15 license seeds retain two Preview classification claims", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const claims = built.documents.filter(
    (doc) =>
      doc.kind === "claim" &&
      typeof doc.record.entity_id === "string" &&
      doc.record.entity_id.startsWith("license."),
  );
  assert.equal(claims.length, 30);
  const byLicense = new Map<string, number>();
  for (const claim of claims) {
    const entityId = claim.record.entity_id;
    if (typeof entityId !== "string") {
      throw new Error("Claim entity_id must be a string");
    }
    assert.equal(claim.record.review_status, "Preview");
    byLicense.set(entityId, (byLicense.get(entityId) ?? 0) + 1);
  }
  assert.equal(byLicense.size, 15);
  assert([...byLicense.values()].every((count) => count === 2));
});

for (const [sourceId, evidencePath] of [
  ["source.catalog-block1-preview", "block1-initial-classification.md"],
  ["source.catalog-block2-preview", "block2-platform-ecosystem.md"],
  ["source.catalog-block3-preview", "block3-license-classification.md"],
] as const) {
  test(`${sourceId} hash binds its checked-in evidence matrix`, async () => {
    const built = await buildKnowledgeCandidate(files(), at, identity);
    const source = built.documents.find(
      (doc) => doc.kind === "source" && doc.record.source_id === sourceId,
    );
    assert(source);
    const evidence = readFileSync(
      new URL(
        `../knowledge/candidate/catalog-2026-10-03/evidence/${evidencePath}`,
        import.meta.url,
      ),
    );
    assert.equal(
      createHash("sha256").update(evidence).digest("hex"),
      source.record.content_sha256,
    );
  });
}

test("license identity is independent from optional SPDX metadata", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const licenses = built.documents.filter(
    (doc) => doc.kind === "entity" && doc.record.entity_type === "license",
  );
  const byId = new Map(
    licenses.map((doc) => [String(doc.record.entity_id), doc.record]),
  );

  const shield = byId.get("license.polyform-shield-1.0.0");
  assert(shield);
  assert.equal("spdx_id" in shield, false);
  assert.equal("license_id" in shield, false);

  const noncommercial = byId.get("license.polyform-noncommercial-1.0.0");
  assert(noncommercial);
  assert.equal(noncommercial.spdx_id, "PolyForm-Noncommercial-1.0.0");

  const legacyMit = byId.get("license.mit");
  assert(legacyMit);
  assert.equal(legacyMit.license_id, "MIT");
});
