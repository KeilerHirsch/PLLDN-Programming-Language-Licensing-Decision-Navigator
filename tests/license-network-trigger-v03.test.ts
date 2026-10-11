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
import { networkSourceOfferQualifier } from "../src/ui/license-qualifications.ts";

test("AGPLv3 network disclosure conditions are grounded and still Preview", () => {
  const audit = JSON.parse(
    readFileSync(
      "catalog/audit/license-agpl-network-trigger.v0.3.json",
      "utf8",
    ),
  );
  assert.equal(audit.schema_version, "0.3");
  assert.equal(audit.review_status, "EDITORIAL_PREVIEW_NOT_REVIEWED");
  assert.equal(
    audit.baseline_main_sha,
    "7a176fe99a2dae5470a248632041a7e5e6d2ac94",
  );
  assert.deepEqual(audit.entity_ids, [
    "license.agpl-3.0-only",
    "license.agpl-3.0-or-later",
  ]);
  assert.equal(audit.field, "obligations.source_disclosure");
  assert.equal(audit.editorial_value_retained, "network-service");
  assert.equal(audit.trigger.modified_program, true);
  assert.equal(audit.trigger.remote_user_interaction, true);
  assert.equal(audit.trigger.unmodified_remote_use_alone, false);
  assert.equal(audit.trigger.offer_source_to_remote_users, true);
  assert.deepEqual(
    audit.references.map((item: { section: string }) => item.section),
    [
      "AGPLv3 §13",
      "FSF GPL FAQ #UnreleasedModsAGPL",
      "FSF GPL FAQ #AGPLv3InteractingRemotely",
    ],
  );
  assert(
    audit.references.every((item: { url: string }) =>
      item.url.startsWith("https://www.gnu.org/licenses/"),
    ),
  );
  for (const id of audit.entity_ids) {
    const license = LICENSE_DECISION_PROFILES[id];
    assert.equal(license?.obligations.source_disclosure, "network-service");
    assert.equal(license?.rights.saas_hosting, "conditional");
    const note = networkSourceOfferQualifier(id);
    assert(note?.includes("modified"));
    assert(note?.includes("remote users"));
    assert(note?.includes("unmodified"));
    assert(note?.includes("AGPLv3 §13"));
  }
  assert.equal(networkSourceOfferQualifier("license.mit"), null);
  assert.equal(networkSourceOfferQualifier("license.gpl-3.0-only"), null);
  assert.equal(
    networkSourceOfferQualifier("candidate.license.agpl-1.0"),
    null,
    "Unassessed candidate licenses must not inherit editorial claims",
  );
});

test("AGPL network condition is shown in both detail and comparison export", () => {
  const rows = licenseComparisonRows();
  const row = rows.find(
    (item) => item.label === "Network source-offer condition (Preview)",
  );
  assert(row);
  const agpl = selectEditorialLicenses(["license.agpl-3.0-only"])[0];
  const mit = selectEditorialLicenses(["license.mit"])[0];
  assert(agpl && mit);
  assert.equal(row.value(agpl), networkSourceOfferQualifier(agpl.entity_id));
  assert.equal(row.value(mit), "Unknown");
  const product = readFileSync("src/ui/product.ts", "utf8");
  assert(product.includes("networkSourceOfferQualifier(profile.entity_id)"));
  assert(product.includes("decision-profile-note"));
  const exportSource = readFileSync("src/ui/license-compare-export.ts", "utf8");
  assert(exportSource.includes("licenseComparisonRows()"));
});
