// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { auditPreviewProvenance } from "../tools/preview-provenance-audit.ts";

test("historical 345 Preview claims are internal matrix seeds, not primary reviews", () => {
  const report = auditPreviewProvenance();
  assert.equal(report.claims_total, 345);
  assert.equal(report.internal_seed_only, 345);
  assert.equal(report.other_unverified_sources, 0);
  assert.equal(report.no_sources, 0);
  assert.equal(report.claims_with_test_refs, 0);
  assert.equal(report.internal_seed_documents, 3);
  assert.equal(report.verified_internal_seed_hashes, 3);
  assert.equal(report.mutable_main_source_urls, 3);
  assert.equal(report.independently_verified_claims, 0);
  assert(report.claims.every((claim) => claim.review_status === "Preview"));
  assert(report.sources.every((source) => source.sha256_matches));
  assert.equal(
    JSON.stringify(report),
    JSON.stringify(auditPreviewProvenance()),
  );
});

test("changed matrix bytes invalidate the old claim-to-seed provenance", () => {
  const base = mkdtempSync(join(tmpdir(), "plldn-provenance-test-"));
  const dir = "knowledge/candidate/catalog-2026-10-03";
  try {
    cpSync(dir, join(base, dir), { recursive: true });
    const matrix = join(
      base,
      dir,
      "evidence",
      "block3-license-classification.md",
    );
    writeFileSync(matrix, `${readFileSync(matrix, "utf8")}\nchanged\n`);
    assert.throws(() => auditPreviewProvenance(base), /Seed hash mismatch/u);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("missing Preview source references fail closed", () => {
  const base = mkdtempSync(join(tmpdir(), "plldn-provenance-test-"));
  const dir = "knowledge/candidate/catalog-2026-10-03";
  try {
    cpSync(dir, join(base, dir), { recursive: true });
    const file = join(
      base,
      dir,
      "claims",
      "mit-license-explicit-patent-grant.json",
    );
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    parsed.record.source_ids = ["source.does-not-exist"];
    writeFileSync(file, JSON.stringify(parsed));
    assert.throws(() => auditPreviewProvenance(base), /Unresolved source/u);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
