// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PRODUCT_FILTERS } from "../src/product/catalog-filters.ts";
import {
  candidateMatchesFilters,
  catalogNavigationHref,
  compareCatalogNames,
  readCatalogNavigation,
} from "../src/ui/catalog-navigation.ts";

test("catalogue URLs round-trip search, mode, status, sort and structured filters", () => {
  const state = readCatalogNavigation(
    "?catalog=licenses&q=Artistic+2.0&status=unassessed&order=desc&licenseCommercial=unknown",
  );
  assert.equal(state.mode, "licenses");
  assert.equal(state.query, "Artistic 2.0");
  assert.equal(state.status, "unassessed");
  assert.equal(state.order, "desc");
  assert.equal(state.filters.licenseCommercial, "unknown");
  assert.deepEqual(
    readCatalogNavigation(catalogNavigationHref(state).replace(/#.*$/u, "")),
    state,
  );
});
test("untrusted catalogue URL values cannot invent modes or assessments", () => {
  const state = readCatalogNavigation(
    "?catalog=javascript:alert(1)&status=reviewed&order=random&languageThroughput=fast&__proto__=evil",
  );
  assert.equal(state.mode, "languages");
  assert.equal(state.status, "all");
  assert.equal(state.order, "asc");
  assert.deepEqual(state.filters, DEFAULT_PRODUCT_FILTERS);
  assert.equal(Object.hasOwn(state.filters, "__proto__"), false);
  assert.equal(
    readCatalogNavigation("?q=" + "a".repeat(1000)).query.length,
    200,
  );
});
test("SPDX source flag applies only to license catalogue URLs", () => {
  for (const flag of ["yes", "no"]) {
    assert.equal(
      readCatalogNavigation(`?catalog=languages&spdx=${flag}`).spdx,
      "any",
    );
    assert.equal(
      readCatalogNavigation(`?catalog=licenses&spdx=${flag}`).spdx,
      flag,
    );
  }
});
test("UNKNOWN candidates match only any/unknown assessment filters", () => {
  assert.equal(
    candidateMatchesFilters("languages", DEFAULT_PRODUCT_FILTERS),
    true,
  );
  assert.equal(
    candidateMatchesFilters("languages", {
      ...DEFAULT_PRODUCT_FILTERS,
      languageThroughput: "unknown",
    }),
    true,
  );
  assert.equal(
    candidateMatchesFilters("languages", {
      ...DEFAULT_PRODUCT_FILTERS,
      languageThroughput: "high",
    }),
    false,
  );
  assert.equal(
    candidateMatchesFilters("licenses", {
      ...DEFAULT_PRODUCT_FILTERS,
      licenseCommercial: "yes",
    }),
    false,
  );
  assert.equal(
    candidateMatchesFilters("languages", {
      ...DEFAULT_PRODUCT_FILTERS,
      licenseCommercial: "yes",
    }),
    true,
  );
});
test("A-Z and Z-A order are stable and handle punctuation and Unicode", () => {
  const names = ["Rust", "C++", "Agda", "C#", "Élan"];
  assert.deepEqual(
    [...names].sort((a, b) => compareCatalogNames(a, b, "asc")),
    ["Agda", "C#", "C++", "Élan", "Rust"],
  );
  assert.deepEqual(
    [...names].sort((a, b) => compareCatalogNames(a, b, "desc")),
    ["Rust", "Élan", "C++", "C#", "Agda"],
  );
});
test("language discovery URLs preserve independent usage, era and lifecycle facets", () => {
  for (const order of ["common", "oldest", "newest", "lifecycle"]) {
    const state = readCatalogNavigation(
      "?catalog=languages&usage=ranked&era=classic&lifecycle=maintained&order=" + order,
    );
    assert.deepEqual(state.discovery, {
      usage: "ranked",
      era: "classic",
      lifecycle: "maintained",
    });
    assert.equal(state.order, order);
    assert.deepEqual(
      readCatalogNavigation(catalogNavigationHref(state).replace(/#.*$/u, "")),
      state,
    );
  }
});
test("language discovery rejects invented classifications and does not leak into license URLs", () => {
  const invalid = readCatalogNavigation(
    "?usage=popular&era=forgotten&lifecycle=extinct&order=downloads",
  );
  assert.deepEqual(invalid.discovery, {
    usage: "any",
    era: "any",
    lifecycle: "any",
  });
  assert.equal(invalid.order, "asc");
  for (const order of ["common", "oldest", "newest", "lifecycle"]) {
    const license = readCatalogNavigation(
      "?catalog=licenses&usage=ranked&era=classic&lifecycle=retired&order=" + order,
    );
    assert.deepEqual(license.discovery, invalid.discovery);
    assert.equal(license.order, "asc");
    const href = catalogNavigationHref({
      ...license,
      order: order as typeof license.order,
      discovery: { usage: "ranked", era: "classic", lifecycle: "retired" },
    });
    for (const key of ["usage", "era", "lifecycle", "order"]) {
      assert.equal(new URL(href, "https://example.test/").searchParams.has(key), false);
    }
  }
  assert.equal(
    readCatalogNavigation("?catalog=licenses&order=desc").order,
    "desc",
  );
});
