// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import candidates from "../catalog/unassessed-candidates.v0.2.json" with {
  type: "json",
};
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import { exportCsvCell } from "../src/product/unassessed-export.ts";
import {
  exportCatalogLanguageCompareCsv,
  exportEditorialLanguageCompareCsv,
} from "../src/ui/language-compare-export.ts";
import {
  catalogLanguageComparisonRows,
  DEFAULT_PRODUCT_UI_STATE,
  renderProductExperience,
  selectCatalogLanguages,
  selectEditorialLanguages,
} from "../src/ui/product.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

const preview: CatalogPreviewView = {
  knowledge_snapshot: "reader-ui-test-preview",
  status: "Preview",
  languages: [],
  licenses: [],
};
const basic = "candidate.language.6261736963";
test("one comparison selects canonical editorial and pinned unassessed languages without invented IDs", () => {
  const selected = selectCatalogLanguages(["language.rust", basic]);
  assert.deepEqual(
    selected.map((language) => language.label),
    ["Rust", "BASIC"],
  );
  assert(selected[0]?.editorial);
  assert.equal(selected[1]?.editorial, null);
  assert.throws(() => selectCatalogLanguages([basic, basic]));
  assert.throws(() => selectCatalogLanguages(["candidate.language.made-up"]));
  assert.throws(() =>
    selectCatalogLanguages(["candidate.license.artistic-2.0"]),
  );
  assert.throws(() =>
    selectCatalogLanguages([
      "language.rust",
      basic,
      "language.go",
      "language.python",
      "language.java",
    ]),
  );
  assert.throws(() => selectEditorialLanguages([basic]));
  assert.throws(() => exportEditorialLanguageCompareCsv([basic], preview));
});
test("mixed reader comparison supplies useful rows and keeps every unassessed rating UNKNOWN", () => {
  const selected = selectCatalogLanguages(["language.rust", basic]);
  const rows = catalogLanguageComparisonRows(preview);
  const unassessed = selected[1];
  assert(unassessed);
  for (const label of [
    "Implementation",
    "Prerequisites",
    "Execution workflow",
    "Example code",
    "Example status",
    "Implementation and runtime licenses",
  ]) {
    const row = rows.find((candidate) => candidate.label === label);
    assert(row, label);
    assert(row.value(unassessed), label);
    assert(row.sources(unassessed).length > 0, `${label} sources`);
  }
  for (const row of rows.filter((candidate) => candidate.assessment)) {
    assert.equal(row.value(unassessed), "UNKNOWN", row.label);
  }
  for (const row of rows.filter((candidate) => candidate.dimensionId)) {
    assert.equal(row.value(unassessed), "UNKNOWN", row.label);
  }
});
test("new CSV matches every presentation row and provenance and retains spreadsheet protection", () => {
  const selected = selectCatalogLanguages(["language.rust", basic]);
  const rows = catalogLanguageComparisonRows(preview);
  const expected = `${[
    ["Attribute", ...selected.map((language) => language.label)],
    ...rows.flatMap((row) => [
      [row.label, ...selected.map((language) => row.value(language))],
      [
        `Sources: ${row.label}`,
        ...selected.map(
          (language) =>
            row
              .sources(language)
              .map((source) => source.url)
              .join(" | ") || "UNKNOWN",
        ),
      ],
      ...(row.previewFact
        ? [
            [
              `Preview claim ID: ${row.label}`,
              ...selected.map(
                (language) =>
                  row.previewFact?.(language)?.claim_id ?? "UNKNOWN",
              ),
            ],
            [
              `Preview review status: ${row.label}`,
              ...selected.map(
                (language) =>
                  row.previewFact?.(language)?.review_status ?? "UNKNOWN",
              ),
            ],
          ]
        : []),
    ]),
  ]
    .map((row) => row.map(exportCsvCell).join(","))
    .join("\n")}\n`;
  assert.equal(
    exportCatalogLanguageCompareCsv(["language.rust", basic], preview),
    expected,
  );
  assert.equal(exportCsvCell("=1+1"), JSON.stringify("'=1+1"));
  assert.throws(() => exportCatalogLanguageCompareCsv([], preview));
  assert.throws(() =>
    exportCatalogLanguageCompareCsv([basic], {
      ...preview,
      knowledge_snapshot: "",
    }),
  );
});

class ReaderTestElement {
  className = "";
  textContent = "";
  href = "";
  rel = "";
  dataset: Record<string, string> = {};
  children: ReaderTestElement[] = [];
  attributes = new Map<string, string>();
  readonly tagName: string;
  constructor(tagName: string) {
    this.tagName = tagName;
  }
  append(...children: ReaderTestElement[]): void {
    this.children.push(...children);
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}
function descendants(node: ReaderTestElement): ReaderTestElement[] {
  return [node, ...node.children.flatMap(descendants)];
}
function hasClass(node: ReaderTestElement, value: string): boolean {
  return node.className.split(" ").includes(value);
}
function documentFixture(t: { after(fn: () => void): void }): void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: (tag: string) => new ReaderTestElement(tag) },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  });
}
test("all 194 canonical languages render the same sourced reader and comparison action without promoting candidates", (t) => {
  documentFixture(t);
  const view = renderProductExperience(preview, {
    ...DEFAULT_PRODUCT_UI_STATE,
  }) as unknown as ReaderTestElement;
  const cards = descendants(view).filter((node) => node.dataset.catalogEntry);
  const expectedIds = [
    ...PRODUCT_MODEL.languages.map((profile) => profile.entity_id),
    ...candidates.records
      .filter((record) => record.kind === "language")
      .map((record) => record.id),
  ];
  assert.equal(cards.length, 194);
  assert.deepEqual(
    new Set(cards.map((card) => card.dataset.entityId)),
    new Set(expectedIds),
  );
  assert.equal(
    cards.filter((card) => card.dataset.catalogStatus === "unassessed").length,
    159,
  );
  for (const card of cards) {
    const nodes = descendants(card);
    const reader = nodes.find((node) =>
      hasClass(node, "language-reader-profile"),
    );
    assert(reader, card.dataset.catalogName);
    assert.equal(reader.dataset.readerEntityId, card.dataset.entityId);
    assert(nodes.some((node) => hasClass(node, "language-reader-brief")));
    assert(
      nodes.some(
        (node) =>
          node.tagName === "button" &&
          node.dataset.action === "toggle-compare" &&
          node.dataset.entityId === card.dataset.entityId,
      ),
    );
    const sections = descendants(reader).filter(
      (node) => node.dataset.readerSection,
    );
    assert.equal(sections.length, 8);
    assert(
      sections.every((section) =>
        descendants(section).some((node) => hasClass(node, "reader-citation")),
      ),
    );
    if (card.dataset.catalogStatus === "unassessed") {
      assert(!nodes.some((node) => hasClass(node, "decision-profile")));
      assert(nodes.some((node) => node.textContent.includes("UNKNOWN")));
    }
  }
  assert(
    descendants(view).some(
      (node) => node.textContent === "194 reader profiles",
    ),
  );
});
test("the rendered mixed table uses each shared comparison value and the same adjacent source URLs as CSV", (t) => {
  documentFixture(t);
  const ids = ["language.rust", basic];
  const selected = selectCatalogLanguages(ids);
  const expected = catalogLanguageComparisonRows(preview);
  const view = renderProductExperience(preview, {
    ...DEFAULT_PRODUCT_UI_STATE,
    compareLanguageIds: ids,
  }) as unknown as ReaderTestElement;
  const table = descendants(view).find((node) =>
    hasClass(node, "compare-table"),
  );
  assert(table);
  const body = table.children.find((node) => node.tagName === "tbody");
  assert(body);
  assert.equal(body.children.length, expected.length);
  for (const [index, row] of expected.entries()) {
    const rendered: ReaderTestElement | undefined = body.children[index];
    assert(rendered);
    assert.equal(rendered.children[0]?.textContent, row.label);
    for (const [column, language] of selected.entries()) {
      const cell: ReaderTestElement | undefined = rendered.children[column + 1];
      assert(cell);
      assert.equal(
        cell.children[0]?.textContent,
        row.value(language),
        row.label,
      );
      const sourceLinks: ReaderTestElement | undefined = cell.children.find(
        (node) => hasClass(node, "compare-reader-sources"),
      );
      assert.deepEqual(
        sourceLinks?.children.map((link) => link.href) ?? [],
        row.sources(language).map((source) => source.url),
        row.label,
      );
    }
  }
});
