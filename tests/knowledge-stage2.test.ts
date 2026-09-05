// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { buildKnowledgeCandidate } from "../src/knowledge/candidate.ts";

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

async function built() {
  return buildKnowledgeCandidate(files(), at);
}
function claimValue(record: Record<string, unknown> | undefined): unknown {
  const value = record?.value;
  if (value === null || typeof value !== "object") return undefined;
  return (value as Record<string, unknown>).value;
}
test("Stage 2 candidate knowledge is structurally valid but not self-approved", async () => {
  const result = await built();
  assert.equal(result.documents.length, 51);
  assert.equal(result.reviewedAssertions, 0);
  assert.equal(result.partialAssertions, 16);
  assert.equal(
    result.manifest.knowledge_snapshot,
    "candidate.stage2-core.2026-09-05",
  );
});

test("language entities pin the observed stable versions", async () => {
  const result = await built();
  const versions = new Map(
    result.documents
      .filter((d) => d.kind === "entity" && d.record.entity_type === "language")
      .map((d) => [d.record.entity_id, d.record.version_scope]),
  );
  assert.deepEqual(versions.get("language.rust"), ["1.98.1"]);
  assert.deepEqual(versions.get("language.go"), ["1.27.1"]);
  assert.deepEqual(versions.get("language.python"), ["3.14.7"]);
  assert.deepEqual(versions.get("language.typescript"), ["7.0"]);
});
test("license only/or-later identities remain distinct", async () => {
  const result = await built();
  const ids = new Map(
    result.documents
      .filter((d) => d.kind === "entity" && d.record.entity_type === "license")
      .map((d) => [d.record.entity_id, d.record.license_id]),
  );
  assert.equal(ids.get("license.gpl-3.0-only"), "GPL-3.0-only");
  assert.equal(ids.get("license.gpl-3.0-or-later"), "GPL-3.0-or-later");
  assert.equal(ids.get("license.agpl-3.0-only"), "AGPL-3.0-only");
  assert.equal(ids.get("license.agpl-3.0-or-later"), "AGPL-3.0-or-later");
});

test("Stage 2 sources are official or normative captures with exact digests", async () => {
  const result = await built();
  const sources = result.documents.filter((d) => d.kind === "source");
  assert.equal(sources.length, 17);
  for (const source of sources) {
    const reference = new URL(source.record.reference as string);
    assert(["https:"].includes(reference.protocol));
    assert.match(source.record.content_sha256 as string, /^[a-f0-9]{64}$/);
  }
});
test("initial language claims stay narrow and source-backed", async () => {
  const result = await built();
  const claims = new Map(
    result.documents
      .filter((d) => d.kind === "claim")
      .map((d) => [d.record.claim_id, d.record]),
  );
  assert.equal(
    claimValue(claims.get("claim.rust-safe-memory-without-gc")),
    true,
  );
  assert.equal(claimValue(claims.get("claim.go-runtime-gc")), true);
  assert.equal(claimValue(claims.get("claim.typescript-static-checker")), true);
  assert.equal(
    claimValue(claims.get("claim.typescript-emits-javascript")),
    true,
  );
  assert.deepEqual(
    claims.get("claim.rust-safe-memory-without-gc")?.source_ids,
    ["source.rust-ownership", "source.rust-safe-unsafe"],
  );
  assert.deepEqual(claims.get("claim.go-runtime-gc")?.source_ids, [
    "source.go-faq",
  ]);
});

test("candidate manifest is deterministic across input insertion order", async () => {
  const original = files();
  const reversed = Object.fromEntries(Object.entries(original).reverse());
  const a = await buildKnowledgeCandidate(original, at);
  const b = await buildKnowledgeCandidate(reversed, at);
  assert.deepEqual(a.manifest, b.manifest);
});
test("candidate pack rejects an assertion promoted to Reviewed inside the pack", async () => {
  const tampered = files();
  const path = "claims/rust-safe-memory-without-gc.json";
  const raw = tampered[path];
  if (typeof raw !== "string") throw new Error("Stage 2 fixture missing");
  const doc = JSON.parse(raw);
  doc.record.review_status = "Reviewed";
  doc.record.test_refs = ["test.synthetic"];
  tampered[path] = `${JSON.stringify(doc)}\n`;
  await assert.rejects(
    () => buildKnowledgeCandidate(tampered, at),
    /cannot self-declare Reviewed assertions/,
  );
});

test("Rust safe-code memory claim requires both ownership and Safe Rust evidence", async () => {
  const result = await built();
  const claim = result.documents.find(
    (d) =>
      d.kind === "claim" &&
      d.record.claim_id === "claim.rust-safe-memory-without-gc",
  );
  assert.deepEqual(claim?.record.source_ids, [
    "source.rust-ownership",
    "source.rust-safe-unsafe",
  ]);
});

test("current stable version claims are volatile and expire", async () => {
  const result = await built();
  const current = result.documents.filter(
    (d) =>
      d.kind === "claim" &&
      d.record.dimension_id === "dimension.current-stable-version",
  );
  assert.equal(current.length, 4);
  for (const claim of current) {
    assert.equal(claim.record.world_freshness_class, "volatile");
    assert.equal(typeof claim.record.valid_until, "string");
    const verified = Date.parse(claim.record.verified_at as string);
    const until = Date.parse(claim.record.valid_until as string);
    assert(until > verified);
    assert(until - verified <= 24 * 60 * 60 * 1000);
  }
});

test("Python current version uses both release and latest-download evidence", async () => {
  const result = await built();
  const claim = result.documents.find(
    (d) =>
      d.kind === "claim" &&
      d.record.claim_id === "claim.python-current-version",
  );
  assert.deepEqual(claim?.record.source_ids, [
    "source.python-release",
    "source.python-downloads",
  ]);
});
