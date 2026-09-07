// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildReviewedCoverage,
  renderKnownLimitations,
} from "../tools/release-coverage.ts";
import { parseReleasePolicy } from "../tools/release-policy.ts";

const policy = () =>
  parseReleasePolicy(readFileSync("release/v0.0.1-beta.1/policy.json", "utf8"));

test("reviewed coverage binds the exact live and reviewed-not-live sets", async () => {
  const value = JSON.parse(
    await buildReviewedCoverage(policy(), "a".repeat(40)),
  );
  assert.equal(value.release.version, "0.0.1-beta.1");
  assert.equal(value.release.source_commit, "a".repeat(40));
  assert.deepEqual(value.live.languages, [
    "language.go",
    "language.python",
    "language.rust",
    "language.typescript",
  ]);
  assert.equal(value.live.dimensions.length, 4);
  assert.equal(value.reviewed_not_live.licenses.length, 8);
  assert.equal(
    value.trust.reviewed_source_manifest_sha256,
    policy().reviewed_source_manifest_sha256,
  );
  assert.equal(
    value.trust.runtime_projection_sha256,
    policy().runtime_projection_sha256,
  );
});

test("known limitations are derived from release policy", () => {
  const rendered = renderKnownLimitations(policy());
  assert.match(rendered, /does not.*complete.*license/iu);
  assert.match(rendered, /Stage 5C/iu);
  assert.match(rendered, /abstain/iu);
  assert.equal(rendered.endsWith("\n"), true);
  assert.equal(rendered.includes("\r"), false);
});

test("coverage generation fails closed on frozen-set drift", async () => {
  const p = policy();
  await assert.rejects(() =>
    buildReviewedCoverage(
      {
        ...p,
        live_language_ids: [
          "language.go",
          "language.python",
          "language.rust",
          "language.missing",
        ],
      },
      "a".repeat(40),
    ),
  );
  await assert.rejects(() =>
    buildReviewedCoverage(
      {
        ...p,
        live_dimension_ids: [
          "dimension.emits-javascript",
          "dimension.runtime-garbage-collection",
          "dimension.safe-code-memory-safety-without-gc",
          "dimension.missing",
        ],
      },
      "a".repeat(40),
    ),
  );
  await assert.rejects(() =>
    buildReviewedCoverage(
      {
        ...p,
        reviewed_not_live_license_ids: [
          ...p.reviewed_not_live_license_ids.slice(0, 7),
          "license.missing",
        ],
      },
      "a".repeat(40),
    ),
  );
});

test("coverage generation is canonical and byte deterministic", async () => {
  const first = await buildReviewedCoverage(policy(), "b".repeat(40));
  const second = await buildReviewedCoverage(policy(), "b".repeat(40));
  assert.equal(first, second);
  assert.equal(first.endsWith("\n"), true);
});
