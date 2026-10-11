// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LICENSE_DECISION_PROFILES } from "../src/product/license-decision-profiles.ts";
import { licenseComparisonRows, selectEditorialLicenses } from "../src/ui/license-comparison.ts";

test("GPL-2.0-or-later patent Preview preserves version and licensor ambiguity", () => {
  const audit = JSON.parse(
    readFileSync("catalog/audit/license-patent-scope.v0.3.json", "utf8"),
  );
  assert.equal(audit.schema_version, "0.3");
  assert.equal(audit.review_status, "EDITORIAL_PREVIEW_NOT_REVIEWED");
  assert.equal(audit.baseline_main_sha, "e2782237f69c3ac45f5bad245f2a4878655e72a7");
  assert.equal(audit.entity_id, "license.gpl-2.0-or-later");
  assert.equal(audit.field, "obligations.patent_grant");
  assert.equal(audit.previous_value, "no");
  assert.equal(audit.corrected_value, "conditional");
  assert.equal(audit.license_version_selected, "UNKNOWN");
  assert.deepEqual(
    audit.references.map((item: { section: string }) => item.section),
    ["GPLv3 §11", "GPLv3 §14", "FSF GPL FAQ — #v2OrLaterPatentLicense"],
  );
  assert(audit.references.every((item: { url: string }) => item.url.startsWith("https://www.gnu.org/")));
  assert.equal(
    LICENSE_DECISION_PROFILES["license.gpl-2.0-only"]?.obligations.patent_grant,
    "no",
    "GPLv2-only has no GPLv3-style express grant; no is not a finding of zero patent rights",
  );
  assert.equal(
    LICENSE_DECISION_PROFILES["license.gpl-3.0-only"]?.obligations.patent_grant,
    "yes",
    "GPLv3 Section 11 contains an express grant",
  );
  assert.equal(
    LICENSE_DECISION_PROFILES[audit.entity_id]?.obligations.patent_grant,
    audit.corrected_value,
  );
  const row = licenseComparisonRows().find((item) => item.label === "Patent grant");
  const profile = selectEditorialLicenses([audit.entity_id])[0];
  assert(row && profile);
  assert.equal(row.value(profile), "Conditional");
});

test("UI qualifies patent Preview independently of historic snapshots", () => {
  const comparison = readFileSync("src/ui/license-comparison.ts", "utf8");
  const product = readFileSync("src/ui/product.ts", "utf8");
  assert(comparison.includes("selected GPL version and contributor"));
  assert(product.includes("selected GPL version and contributor"));
  assert(!comparison.includes("patent grants are guaranteed"));
});
