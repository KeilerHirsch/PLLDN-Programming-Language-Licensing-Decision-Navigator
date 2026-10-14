// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { exportLanguageComparisonMarkdown } from "../src/ui/language-compare-markdown.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

const catalog: CatalogPreviewView = {
  status: "Preview",
  knowledge_snapshot: "pinned-qol-fixture",
  languages: [],
  licenses: [],
};

test("mixed Markdown decision record preserves UNKNOWN, sources, dates and status", () => {
  const ids = ["language.go", "candidate.language.6261736963"];
  const markdown = exportLanguageComparisonMarkdown(ids, catalog, true);
  assert.equal(markdown, exportLanguageComparisonMarkdown(ids, catalog, true));
  for (const term of [
    "# PLLDN language comparison",
    "pinned-qol-fixture",
    "Go",
    "BASIC",
    "UNKNOWN",
    "NOT_REVIEWED",
    "https://",
    "Only differences",
    "Checked:",
  ]) {
    assert(markdown.includes(term), term);
  }
  assert(markdown.includes("Preview evidence"));
  assert(markdown.includes("not a Reviewed recommendation"));
  assert(!markdown.includes("<script"));
  assert(!markdown.includes("javascript:"));
});

test("Markdown report tracks selected table view without promoting ratings", () => {
  const ids = ["language.go", "language.rust"];
  const all = exportLanguageComparisonMarkdown(ids, catalog, false);
  const differences = exportLanguageComparisonMarkdown(ids, catalog, true);
  assert(all.includes("All attributes"));
  assert(differences.includes("Only differences"));
  assert(all.length >= differences.length);
  assert(all.includes("Entity ID"));
  assert(all.includes("Preview snapshot"));
});

test("Markdown export fails closed on missing snapshot, empty IDs and unknown ID", () => {
  assert.throws(() => exportLanguageComparisonMarkdown([], catalog, false));
  assert.throws(() =>
    exportLanguageComparisonMarkdown(
      ["language.go", "language.go"],
      catalog,
      false,
    ),
  );
  assert.throws(() =>
    exportLanguageComparisonMarkdown(["something.else"], catalog, false),
  );
  assert.throws(() =>
    exportLanguageComparisonMarkdown(
      ["language.go"],
      { ...catalog, knowledge_snapshot: "" },
      false,
    ),
  );
});

test("Markdown report discloses unresolved-first presentation order", () => {
  const markdown = exportLanguageComparisonMarkdown(
    ["language.go", "candidate.language.6261736963"],
    catalog,
    true,
    true,
  );
  assert(markdown.includes("Row order: Unresolved first"));
  assert(markdown.includes("UNKNOWN"));
});

test("explicit UTC creation time is included without contaminating source checking dates", () => {
  const ids = ["language.go", "candidate.language.6261736963"];
  const timestamp = "2026-10-14T17:42:00.000Z";
  const report = exportLanguageComparisonMarkdown(
    ids,
    catalog,
    true,
    false,
    timestamp,
  );
  assert(report.includes(`Report created at (UTC): ${timestamp}`));
  assert(report.includes("Checked:"));
  assert.equal(
    report,
    exportLanguageComparisonMarkdown(ids, catalog, true, false, timestamp),
  );
  assert.throws(() =>
    exportLanguageComparisonMarkdown(ids, catalog, true, false, "tomorrow"),
  );
});

test("German Markdown preserves IDs, UNKNOWN, sources and UTC creation metadata", () => {
  const ids = ["language.go", "candidate.language.6261736963"];
  const at = "2026-10-14T18:10:00.000Z";
  const de = exportLanguageComparisonMarkdown(
    ids,
    catalog,
    true,
    false,
    at,
    "de",
  );
  const en = exportLanguageComparisonMarkdown(
    ids,
    catalog,
    true,
    false,
    at,
    "en",
  );
  assert(de.includes(`Bericht erstellt am (UTC): ${at}`));
  assert(de.includes("PLLDN-Sprachvergleich"));
  for (const literal of [
    "language\\.go",
    "candidate\\.language\\.6261736963",
    "UNKNOWN",
    "NOT_REVIEWED",
    "https://",
  ]) {
    assert(de.includes(literal), literal);
    assert(en.includes(literal), literal);
  }
  assert.equal(
    de,
    exportLanguageComparisonMarkdown(ids, catalog, true, false, at, "de"),
  );
});
