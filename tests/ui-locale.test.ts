// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { getUiLocale, setUiLocale, tr } from "../src/ui/ui-locale.ts";

test("German UI labels change, assessment and license tokens remain exact", () => {
  setUiLocale("de");
  try {
    assert.equal(getUiLocale(), "de");
    assert.equal(tr("Only differences"), "Nur Unterschiede");
    assert.equal(tr("UNKNOWN"), "UNKNOWN");
    assert.equal(tr("NOT_REVIEWED"), "NOT_REVIEWED");
    assert.equal(tr("SPDX"), "SPDX");
    assert.equal(tr("MIT"), "MIT");
    assert.equal(tr("Apache-2.0"), "Apache-2.0");
    assert.equal(tr("Compare languages (2/4)"), "Sprachen vergleichen (2/4)");
  } finally {
    setUiLocale("en");
  }
  assert.equal(tr("Only differences"), "Only differences");
});
