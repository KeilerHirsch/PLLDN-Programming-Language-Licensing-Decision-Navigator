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

test("reader disclosure labels localize while license identifiers remain exact", () => {
  setUiLocale("de");
  try {
    assert.equal(tr("Fit and limitations"), "Eignung und Grenzen");
    assert.equal(
      tr("Implementation, runtime and standard-library licenses"),
      "Lizenzen von Implementierung, Laufzeit und Standardbibliothek",
    );
    assert.equal(tr("UNKNOWN"), "UNKNOWN");
    assert.equal(tr("MIT"), "MIT");
  } finally {
    setUiLocale("en");
  }
});

test("Reviewed lab UI copy translates without rewriting decision keys", () => {
  setUiLocale("de");
  try {
    assert.equal(tr("Reviewed decision lab"), "Geprüftes Entscheidungslabor");
    assert.equal(tr("Active filters"), "Aktive Filter");
    assert.equal(tr("Decision details"), "Entscheidungsdetails");
    assert.equal(tr("UNKNOWN"), "UNKNOWN");
    assert.equal(tr("NOT_REVIEWED"), "NOT_REVIEWED");
    assert.equal(tr("license.mpl-2.0"), "license.mpl-2.0");
  } finally {
    setUiLocale("en");
  }
  assert.equal(tr("Decision details"), "Decision details");
});

test("German licence UI controls translate without changing canonical licence identifiers", () => {
  setUiLocale("de");
  try {
    assert.equal(
      tr("Rights, restrictions & compliance"),
      "Rechte, Einschränkungen und Pflichten",
    );
    assert.equal(tr("Canonical terms"), "Maßgeblicher Lizenztext");
    assert.equal(tr("Rights"), "Rechte");
    assert.equal(tr("Use"), "Nutzung");
    assert.equal(tr("Good when"), "Geeignet, wenn");
    assert.equal(
      tr("Scrollable language comparison matrix"),
      "Scrollbare Sprachvergleichstabelle",
    );
    assert.equal(
      tr("Four licenses selected. Remove one to add another."),
      "Vier Lizenzen ausgewählt. Entferne eine, um eine weitere hinzuzufügen.",
    );
    for (const literal of [
      "UNKNOWN",
      "NOT_REVIEWED",
      "MIT",
      "Apache-2.0",
      "AGPL-3.0-only",
      "WITH",
    ]) {
      assert.equal(tr(literal), literal);
    }
  } finally {
    setUiLocale("en");
  }
  assert.equal(
    tr("Rights, restrictions & compliance"),
    "Rights, restrictions & compliance",
  );
  assert.equal(tr("Canonical terms"), "Canonical terms");
});

test("dynamic DE UI messages use stable counts without altering original evidence tokens", () => {
  const cases: Array<[string, string]> = [
    ["Language information & sources", "Sprachinformationen und Quellen"],
    ["Performance & complexity", "Leistung und Komplexität"],
    ["Assessment details · pending", "Bewertungsdetails · ausstehend"],
    ["Explore 5 more project types", "Weitere 5 Projektarten entdecken"],
    ["Preview facts (0)", "Vorschauangaben (0)"],
    ["Preview facts (27)", "Vorschauangaben (27)"],
    [
      "Preview evidence · UNKNOWN · 0 source(s)",
      "Vorschau-Nachweise · UNKNOWN · 0 Quellen",
    ],
    [
      "Preview evidence · NOT_REVIEWED · 2 source(s)",
      "Vorschau-Nachweise · NOT_REVIEWED · 2 Quellen",
    ],
    ["Link to this view", "Link zu dieser Ansicht"],
    ["No Preview claim recorded", "Keine Vorschauaussage erfasst"],
    ["Quick navigation", "Schnellnavigation"],
  ];
  setUiLocale("de");
  try {
    for (const [original, expected] of cases)
      assert.equal(tr(original), expected);
    for (const unchanged of [
      "SPDX",
      "UNKNOWN",
      "NOT_REVIEWED",
      "MIT OR Apache-2.0",
      "source-id",
    ]) {
      assert.equal(tr(unchanged), unchanged);
    }
  } finally {
    setUiLocale("en");
  }
  for (const [original] of cases) assert.equal(tr(original), original);
});
