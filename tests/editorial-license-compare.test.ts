// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import { LICENSE_DECISION_PROFILES } from "../src/product/license-decision-profiles.ts";
import {
  licenseComparisonRows,
  selectEditorialLicenses,
} from "../src/ui/license-comparison.ts";
import { DEFAULT_PRODUCT_UI_STATE } from "../src/ui/product.ts";

test("compare is restricted to distinct editorial license profiles, never index-only", () => {
  assert.equal(PRODUCT_MODEL.licenses.length, 32);
  assert.equal(Object.keys(LICENSE_DECISION_PROFILES).length, 32);
  assert.deepEqual(DEFAULT_PRODUCT_UI_STATE.compareLicenseIds, []);
  assert.equal(selectEditorialLicenses(["license.mit"])[0]?.label, "MIT");
  assert.throws(() =>
    selectEditorialLicenses(["candidate.license.artistic-2.0"]),
  );
  assert.throws(() => selectEditorialLicenses(["license.mit", "license.mit"]));
  assert.throws(() =>
    selectEditorialLicenses([
      "license.mit",
      "license.apache-2.0",
      "license.bsd-3-clause",
      "license.gpl-3.0-only",
      "license.0bsd",
    ]),
  );
});

test("comparison reuses Preview rights and UNKNOWN without inference", () => {
  const rows = licenseComparisonRows();
  const rights = rows.find((row) => row.label === "SaaS / hosting");
  const obligations = rows.find((row) => row.label === "Source disclosure");
  const mit = selectEditorialLicenses(["license.mit"])[0];
  const strict = selectEditorialLicenses(["license.polyform-strict-1.0.0"])[0];
  assert(rights && obligations && mit && strict);
  assert.equal(
    rights.value(mit),
    LICENSE_DECISION_PROFILES["license.mit"]?.rights.saas_hosting === "yes"
      ? "Yes"
      : "Unknown",
  );
  assert.equal(
    obligations.value(strict),
    LICENSE_DECISION_PROFILES[strict.entity_id]?.obligations.source_disclosure
      ?.replaceAll("-", " ")
      .replace(/\b\w/gu, (value) => value.toUpperCase()),
  );
  assert(rows.some((row) => row.label === "Patent grant"));
  assert(rows.some((row) => row.label === "Commercial use"));
});

test("browser offers comparison without DOM HTML injection or Reviewed promotion", () => {
  const ui = readFileSync("src/ui/product.ts", "utf8");
  const logic = readFileSync("src/ui/license-comparison.ts", "utf8");
  const events = readFileSync("src/ui/main.ts", "utf8");
  for (const token of [
    '"toggle-license-compare"',
    '"clear-license-compare"',
    "compareLicenseIds: []",
  ])
    assert((ui + events).includes(token), token);
  assert(logic.includes("Editorial Preview only: not legal advice"));
  assert(logic.includes("Index-only identities have no assessed rights"));
  assert(!logic.includes("innerHTML"));
  assert(!logic.includes("insertAdjacentHTML"));
  assert(!logic.includes("eval("));
});
