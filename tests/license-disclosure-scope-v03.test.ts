// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LICENSE_DECISION_PROFILES } from "../src/product/license-decision-profiles.ts";
import {
  licenseComparisonRows,
  selectEditorialLicenses,
} from "../src/ui/license-comparison.ts";
import { licenseDisclosureScopeQualifier } from "../src/ui/license-qualifications.ts";

test("MPL and EUPL Editorial Preview disclosure conditions use issuer primary texts", () => {
  const audit = JSON.parse(
    readFileSync("catalog/audit/license-disclosure-scope.v0.3.json", "utf8"),
  );
  assert.equal(audit.schema_version, "0.3");
  assert.equal(audit.review_status, "EDITORIAL_PREVIEW_NOT_REVIEWED");
  assert.equal(
    audit.baseline_main_sha,
    "2d73d09373f6c3db39f8feeaabc73fcf301718a3",
  );
  assert.deepEqual(
    audit.records.map((entry: { entity_id: string }) => entry.entity_id),
    ["license.mpl-2.0", "license.eupl-1.2"],
  );
  for (const record of audit.records) {
    const license = LICENSE_DECISION_PROFILES[record.entity_id];
    assert(license, record.entity_id);
    assert.equal(
      license.obligations.source_disclosure,
      record.editorial_value_retained,
    );
    assert.equal(license.rights.saas_hosting, record.saas_value_retained);
    assert.equal(license.canonical_source, record.issuer_source_url);
    assert(record.references.length >= 2);
    assert(record.references.every((item: { url: string }) =>
      item.url.startsWith("https://"),
    ));
    assert.equal(record.review_status, "EDITORIAL_PREVIEW_NOT_REVIEWED");
    assert(record.conditions.length >= 3);
  }
  const mpl = licenseDisclosureScopeQualifier("license.mpl-2.0");
  assert(mpl?.includes("distribution"));
  assert(mpl?.includes("server-side"));
  assert(mpl?.includes("file-level"));
  const eupl = licenseDisclosureScopeQualifier("license.eupl-1.2");
  assert(eupl?.includes("essential functionality"));
  assert(eupl?.includes("Communication"));
  assert(eupl?.includes("Appendix"));
  assert.equal(licenseDisclosureScopeQualifier("license.mit"), null);
  assert.equal(
    licenseDisclosureScopeQualifier("candidate.license.mpl-2.0"),
    null,
  );
});

test("disclosure qualifier uses shared Editorial Preview UI/CSV rows", () => {
  const row = licenseComparisonRows().find(
    (item) => item.label === "Distribution / network disclosure scope (Preview)",
  );
  assert(row);
  for (const id of ["license.mpl-2.0", "license.eupl-1.2"]) {
    const profile = selectEditorialLicenses([id])[0];
    assert(profile);
    assert.equal(
      row.value(profile),
      licenseDisclosureScopeQualifier(id),
    );
  }
  const mit = selectEditorialLicenses(["license.mit"])[0];
  assert(mit);
  assert.equal(row.value(mit), "Unknown");
  const product = readFileSync("src/ui/product.ts", "utf8");
  assert(product.includes("licenseDisclosureScopeQualifier(profile.entity_id)"));
  const csv = readFileSync("src/ui/license-compare-export.ts", "utf8");
  assert(csv.includes("licenseComparisonRows()"));
});
