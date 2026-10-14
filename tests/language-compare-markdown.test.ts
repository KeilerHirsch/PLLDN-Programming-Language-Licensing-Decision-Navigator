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
