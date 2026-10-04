// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_PRODUCT_UI_STATE,
  renderProductExperience,
} from "../src/ui/product.ts";
import type { CatalogPreviewView } from "../src/ui/types.ts";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

test("Product Model UI exposes explore, compare, catalogue and license guidance", () => {
  const product = source("src/ui/product.ts");
  for (const required of [
    "Choose the foundation before the first commit.",
    "What are you building?",
    "Compare languages",
    "Language catalogue",
    "License navigator",
    "Editorial Preview",
    "Good for",
    "Watch for",
    "Build",
    "Preview facts",
    "Performance & complexity",
    "Throughput potential",
    "Learning curve",
    "Deployment complexity",
    "Rights, restrictions & compliance",
    "Commercial use",
    "SaaS / hosting",
    "Competitive use",
    "Canonical terms",
    "Throughput",
    "Learning",
    "Deployment",
    "Ecosystem",
    "Commercial",
    "SaaS",
    "Compete",
    "OSI",
    "Reset filters",
  ]) {
    assert(product.includes(required), required);
  }
});

test("Product Model UI stays on safe DOM APIs", () => {
  const product = source("src/ui/product.ts");
  for (const forbidden of [
    "innerHTML",
    "insertAdjacentHTML",
    "eval(",
    "new Function",
  ]) {
    assert.equal(product.includes(forbidden), false, forbidden);
  }
  for (const required of [
    'createElement("button")',
    'createElement("table")',
    'createElement("details")',
    ".textContent",
  ]) {
    assert(product.includes(required), required);
  }
});

test("browser places Product Model ahead of the Reviewed decision lab", () => {
  const main = source("src/ui/main.ts");
  for (const required of [
    "renderProductExperience",
    "installProductExperience",
    "Reviewed decision lab",
    'action === "select-use-case"',
    'action === "toggle-compare"',
    'action === "catalog-mode"',
    'action === "clear-compare"',
    'action === "reset-product-filters"',
    'action === "product-filter"',
  ]) {
    assert(main.includes(required), required);
  }
  assert(
    main.indexOf("renderProductExperience") <
      main.indexOf('decision.className = "decision-lab"'),
  );
});

test("catalogue decision filters are rendered as explicit select controls", () => {
  const product = source("src/ui/product.ts");
  for (const required of [
    "languageCategory",
    "languageThroughput",
    "languageLearning",
    "languageEcosystem",
    "licenseModel",
    "licenseCommercial",
    "licenseSaas",
    "licenseCompetitive",
    "licenseOsi",
    'select.dataset.action = "product-filter"',
    'count.dataset.catalogVisibleCount = "true"',
  ]) {
    assert(product.includes(required), required);
  }
});

test("catalogue search and structured filters share one visible-result counter", () => {
  const main = source("src/ui/main.ts");
  for (const required of [
    "let visible = 0",
    "data-catalog-visible-count",
    "productState.filters",
    "DEFAULT_PRODUCT_UI_STATE.filters",
  ]) {
    assert(main.includes(required), required);
  }
});

class TestElement {
  className = "";
  textContent = "";
  dataset: Record<string, string> = {};
  children: TestElement[] = [];
  attributes = new Map<string, string>();
  tagName: string;

  constructor(tagName: string) {
    this.tagName = tagName;
  }
  append(...children: TestElement[]): void {
    this.children.push(...children);
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

function descendants(root: TestElement): TestElement[] {
  return [root, ...root.children.flatMap(descendants)];
}

function withClass(root: TestElement, name: string): TestElement[] {
  return descendants(root).filter((node) =>
    node.className.split(" ").includes(name),
  );
}

function cardNamed(root: TestElement, name: string): TestElement {
  const card = withClass(root, "product-card").find((node) =>
    descendants(node).some(
      (child) => child.tagName === "h3" && child.textContent === name,
    ),
  );
  assert(card, name);
  return card;
}

function assertBadge(
  card: TestElement,
  rowClass: string,
  label: string,
  value: string,
  tone: string,
  symbol: string,
): void {
  const row = withClass(card, rowClass).find(
    (node) => node.children[0]?.textContent === label,
  );
  assert(row, label);
  const badge = row.children[1];
  assert(badge, label);
  assert(badge.className.split(" ").includes(`metric-badge--${tone}`));
  assert.equal(badge.textContent, `${symbol} ${value}`);
  assert.equal(badge.attributes.get("role"), "img");
  assert.equal(
    badge.attributes.get("aria-label"),
    `${value}: ${tone} trade-off`,
  );
}

test("rendered metrics keep paired rows and reuse quick-fact tones without color-only meaning", (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: (tagName: string) => new TestElement(tagName) },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  });
  const catalog: CatalogPreviewView = {
    knowledge_snapshot: "candidate.test",
    status: "Preview",
    languages: [],
    licenses: [],
  };
  const languages = renderProductExperience(
    catalog,
    DEFAULT_PRODUCT_UI_STATE,
  ) as unknown as TestElement;
  assert.equal(withClass(languages, "decision-profile").length, 35);
  for (const profile of withClass(languages, "decision-profile")) {
    assert.equal(withClass(profile, "metric-row").length, 15);
    assert.equal(withClass(profile, "metric-row-label").length, 15);
    assert.equal(withClass(profile, "metric-badge").length, 15);
    assert.equal(
      descendants(profile).some((node) => ["dt", "dd"].includes(node.tagName)),
      false,
    );
  }
  const ada = cardNamed(languages, "Ada");
  for (const [label, value, tone, symbol] of [
    ["Throughput", "High", "favorable", "+"],
    ["Learning", "High", "unfavorable", "−"],
    ["Deployment", "Low", "favorable", "+"],
    ["Ecosystem", "Niche", "unfavorable", "−"],
  ]) {
    assert(label && value && tone && symbol);
    assertBadge(ada, "decision-quick-fact", label, value, tone, symbol);
  }
  assertBadge(
    ada,
    "metric-row",
    "Throughput potential",
    "High",
    "favorable",
    "+",
  );
  assertBadge(ada, "metric-row", "Learning curve", "High", "unfavorable", "−");
  assertBadge(ada, "metric-row", "Runtime overhead", "Low", "favorable", "+");
  assertBadge(
    cardNamed(languages, "C"),
    "decision-quick-fact",
    "Learning",
    "Medium",
    "mixed",
    "±",
  );
  assert(
    descendants(languages).some((node) =>
      node.textContent.includes("+ Favorable"),
    ),
  );

  const licenses = renderProductExperience(catalog, {
    ...DEFAULT_PRODUCT_UI_STATE,
    mode: "licenses",
  }) as unknown as TestElement;
  assert.equal(withClass(licenses, "license-profile-card").length, 32);
  const noncommercial = cardNamed(licenses, "PolyForm Noncommercial 1.0.0");
  assertBadge(
    noncommercial,
    "decision-quick-fact",
    "Commercial",
    "No",
    "unfavorable",
    "−",
  );
  assertBadge(
    noncommercial,
    "decision-quick-fact",
    "Model",
    "Source Available",
    "neutral",
    "·",
  );
  assertBadge(
    cardNamed(licenses, "CC0-1.0"),
    "decision-quick-fact",
    "OSI",
    "Not Approved",
    "neutral",
    "·",
  );
  assertBadge(
    cardNamed(licenses, "PolyForm Countdown 1.0.0"),
    "decision-quick-fact",
    "OSI",
    "Not Applicable",
    "neutral",
    "·",
  );
});
