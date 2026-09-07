// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fundingPath = ".github/FUNDING.yml";

test("native GitHub sponsorship surface exposes only active funding destinations", () => {
  const funding = readFileSync(fundingPath, "utf8");
  assert.match(funding, /^ko_fi: keilerhirsch$/mu);
  assert.doesNotMatch(funding, /^github:/mu);
  assert.doesNotMatch(funding, /^custom:/mu);
});

test("README keeps funding explanatory rather than entitlement-bearing", () => {
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /Ko-fi/u);
  assert.match(readme, /GitHub Sponsors/u);
  assert.match(readme, /no feature entitlement/iu);
  assert.match(readme, /native Sponsor\s+button.*Ko-fi/isu);
});
