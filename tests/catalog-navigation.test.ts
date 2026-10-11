// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PRODUCT_FILTERS } from "../src/product/catalog-filters.ts";
import { readCatalogNavigation, catalogNavigationHref, compareCatalogNames, candidateMatchesFilters } from "../src/ui/catalog-navigation.ts";

test("catalogue URLs round-trip search, mode, status, sort and structured filters", () => {
  const state = readCatalogNavigation("?catalog=licenses&q=Artistic+2.0&status=unassessed&order=desc&licenseCommercial=unknown");
  assert.equal(state.mode, "licenses");
  assert.equal(state.query, "Artistic 2.0");
  assert.equal(state.status, "unassessed");
  assert.equal(state.order, "desc");
  assert.equal(state.filters.licenseCommercial, "unknown");
  assert.deepEqual(readCatalogNavigation(catalogNavigationHref(state).split("#")[0]), state);
});
test("untrusted catalogue URL values cannot invent modes or assessments", () => {
  const state = readCatalogNavigation("?catalog=javascript:alert(1)&status=reviewed&order=random&languageThroughput=fast&__proto__=evil");
  assert.equal(state.mode, "languages");
  assert.equal(state.status, "all");
  assert.equal(state.order, "asc");
  assert.deepEqual(state.filters, DEFAULT_PRODUCT_FILTERS);
  assert.equal(Object.hasOwn(state.filters, "__proto__"), false);
  assert.equal(readCatalogNavigation("?q=" + "a".repeat(1000)).query.length, 200);
});
test("UNKNOWN candidates match only any/unknown assessment filters", () => {
  assert.equal(candidateMatchesFilters("languages", DEFAULT_PRODUCT_FILTERS), true);
  assert.equal(candidateMatchesFilters("languages", {...DEFAULT_PRODUCT_FILTERS, languageThroughput:"unknown"}), true);
  assert.equal(candidateMatchesFilters("languages", {...DEFAULT_PRODUCT_FILTERS, languageThroughput:"high"}), false);
  assert.equal(candidateMatchesFilters("licenses", {...DEFAULT_PRODUCT_FILTERS, licenseCommercial:"yes"}), false);
  assert.equal(candidateMatchesFilters("languages", {...DEFAULT_PRODUCT_FILTERS, licenseCommercial:"yes"}), true);
});
test("A-Z and Z-A order are stable and handle punctuation and Unicode", () => {
  const names = ["Rust", "C++", "Agda", "C#", "Élan"];
  assert.deepEqual([...names].sort((a,b)=>compareCatalogNames(a,b,"asc")), ["Agda","C#","C++","Élan","Rust"]);
  assert.deepEqual([...names].sort((a,b)=>compareCatalogNames(a,b,"desc")), ["Rust","Élan","C++","C#","Agda"]);
});
