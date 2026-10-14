// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { formatFactValue, formatTypedValue } from "../src/ui/render.ts";
import { setUiLocale } from "../src/ui/ui-locale.ts";

test("Reviewed fact presentation follows DE/EN locale while typed data and states remain untouched", () => {
  const bool = { type: "boolean" as const, value: true };
  const unknown = { state: "UNKNOWN", value: null } as Parameters<
    typeof formatFactValue
  >[0];
  const notApplicable = { state: "NOT_APPLICABLE", value: null } as Parameters<
    typeof formatFactValue
  >[0];
  const conditional = {
    state: "CONDITIONAL",
    value: { type: "boolean", value: false },
  } as Parameters<typeof formatFactValue>[0];
  setUiLocale("de");
  try {
    assert.equal(formatTypedValue(bool), "Ja");
    assert.equal(formatFactValue(unknown), "Unbekannt");
    assert.equal(formatFactValue(notApplicable), "Nicht anwendbar");
    assert.equal(formatFactValue(conditional), "Nein (bedingt)");
    assert.equal(unknown.state, "UNKNOWN");
    assert.equal(conditional.state, "CONDITIONAL");
    assert.deepEqual(bool, { type: "boolean", value: true });
  } finally {
    setUiLocale("en");
  }
  assert.equal(formatTypedValue(bool), "Yes");
  assert.equal(formatFactValue(unknown), "Unknown");
  assert.equal(formatFactValue(notApplicable), "Not applicable");
  assert.equal(formatFactValue(conditional), "No (conditional)");
});
