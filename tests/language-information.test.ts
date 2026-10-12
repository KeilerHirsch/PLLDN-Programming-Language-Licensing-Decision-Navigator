// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import candidates from "../catalog/unassessed-candidates.v0.2.json" with {
  type: "json",
};
import { PRODUCT_MODEL } from "../src/product/catalog.ts";
import { LANGUAGE_IDENTITIES } from "../src/product/identity-index.ts";
import {
  compareLanguageNames,
  DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
  LANGUAGE_INFORMATION,
  languageEra,
  languageInformationByName,
  languageMatchesDiscovery,
  languageRank,
  matchesLanguageInformation,
  validateLanguageInformation,
} from "../src/product/language-information.ts";

test("all 194 language identities have useful sourced information, without assessment promotion", () => {
  const expected = [
    ...new Set([
      ...LANGUAGE_IDENTITIES,
      ...PRODUCT_MODEL.languages.map((p) => p.label),
    ]),
  ].sort();
  assert.equal(expected.length, 194);
  assert.deepEqual(
    LANGUAGE_INFORMATION.records.map((r) => r.name).sort(),
    expected,
  );
  for (const record of LANGUAGE_INFORMATION.records) {
    assert(record.summary.length >= 50, record.name);
    assert(record.uses.length >= 2, record.name);
    assert(record.links.length >= 1, record.name);
    assert.equal(Object.hasOwn(record, "assessments"), false);
    assert.equal(Object.hasOwn(record, "review_status"), false);
  }
  const unassessed = candidates.records.filter((r) => r.kind === "language");
  assert.equal(unassessed.length, 159);
  for (const record of unassessed) {
    assert(languageInformationByName(record.name), record.name);
    assert.equal(record.review_status, "NOT_REVIEWED");
    assert.deepEqual(record.claim_refs, []);
    assert(Object.values(record.assessments).every((v) => v === "UNKNOWN"));
  }
});

test("BASIC has its own history and sources, separate from its modern descendants", () => {
  const basic = languageInformationByName("BASIC");
  assert(basic);
  assert.equal(basic.name, "BASIC");
  assert.equal(basic.introduced, 1964);
  assert.equal(languageEra(basic), "classic");
  assert(
    basic.links.some((link) =>
      new URL(link.url).hostname.endsWith("dartmouth.edu"),
    ),
  );
  assert.notEqual(
    basic.summary,
    languageInformationByName("FreeBASIC")?.summary,
  );
  assert.notEqual(
    basic.summary,
    languageInformationByName("Visual Basic .NET")?.summary,
  );
  assert.equal(languageInformationByName("BASIC<script>"), undefined);
});

test("dated GitHub ranks are exact identities, never inherited from Shell or other families", () => {
  assert.equal(LANGUAGE_INFORMATION.ranking.period, "August 2025");
  assert.equal(languageRank("TypeScript"), 1);
  assert.equal(languageRank("Python"), 2);
  assert.equal(languageRank("C++"), 8);
  assert.equal(languageRank("HCL"), 9);
  assert.equal(languageRank("Bash"), null);
  assert.equal(languageRank("BASIC"), null);
  const ranked = LANGUAGE_INFORMATION.records.filter((r) =>
    languageMatchesDiscovery(r.name, {
      ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
      usage: "ranked",
    }),
  );
  assert.equal(ranked.length, 9);
  assert.equal(
    languageMatchesDiscovery("BASIC", {
      ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
      usage: "unranked",
    }),
    true,
  );
});

test("historical origin and implementation maintenance are independent filters", () => {
  const basic = languageInformationByName("BASIC");
  assert(basic);
  const maintainedClassic = {
    ...basic,
    lifecycle: "maintained" as const,
    lifecycleNote: "Fixture implementation is supported.",
    lifecycleSource: basic.links[0]?.url ?? null,
  };
  assert.equal(
    matchesLanguageInformation(maintainedClassic, {
      ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
      era: "classic",
      lifecycle: "maintained",
    }),
    true,
  );
  const unknown = {
    ...basic,
    introduced: null,
    introducedSource: null,
    lifecycle: "unknown" as const,
    lifecycleNote: null,
    lifecycleSource: null,
  };
  assert.equal(languageEra(unknown), "unknown");
  assert.equal(
    matchesLanguageInformation(unknown, {
      ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
      lifecycle: "maintained",
    }),
    false,
  );
  assert.equal(
    matchesLanguageInformation(unknown, {
      ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
      era: "unknown",
      lifecycle: "unknown",
    }),
    true,
  );
  assert.equal(
    matchesLanguageInformation(basic, {
      ...DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
      era: "modern",
    }),
    false,
  );
  assert.equal(
    languageMatchesDiscovery(
      "Invented language",
      DEFAULT_LANGUAGE_DISCOVERY_FILTERS,
    ),
    false,
  );
});

test("language sorts are deterministic, with unknowns last and names breaking ties", () => {
  const names = ["BASIC", "Python", "TypeScript", "C++", "Bash"];
  assert.deepEqual(
    [...names].sort((a, b) => compareLanguageNames(a, b, "common")),
    ["TypeScript", "Python", "C++", "Bash", "BASIC"],
  );
  assert.deepEqual(
    [...names].sort((a, b) => compareLanguageNames(a, b, "asc")),
    ["Bash", "BASIC", "C++", "Python", "TypeScript"],
  );
  assert.deepEqual(
    [...names].sort((a, b) => compareLanguageNames(a, b, "desc")),
    ["TypeScript", "Python", "C++", "BASIC", "Bash"],
  );
  for (const order of ["oldest", "newest", "lifecycle"] as const) {
    const sorted = [...LANGUAGE_INFORMATION.records]
      .map((r) => r.name)
      .sort((a, b) => compareLanguageNames(a, b, order));
    assert.equal(sorted.length, 194);
    assert.equal(
      compareLanguageNames(sorted[0] ?? "", sorted[0] ?? "", order),
      0,
    );
    const unknown = sorted.findIndex((name) =>
      order === "lifecycle"
        ? languageInformationByName(name)?.lifecycle === "unknown"
        : languageInformationByName(name)?.introduced === null,
    );
    if (unknown >= 0)
      assert(
        sorted
          .slice(unknown)
          .every((name) =>
            order === "lifecycle"
              ? languageInformationByName(name)?.lifecycle === "unknown"
              : languageInformationByName(name)?.introduced === null,
          ),
      );
    const known = sorted.slice(0, unknown < 0 ? sorted.length : unknown);
    for (let i = 1; i < known.length; i += 1)
      assert(
        compareLanguageNames(known[i - 1] ?? "", known[i] ?? "", order) <= 0,
      );
  }
});

function firstRecord(data: typeof LANGUAGE_INFORMATION) {
  const record = data.records[0];
  assert(record, "dataset fixture requires a first record");
  return record;
}
function firstLink(data: typeof LANGUAGE_INFORMATION) {
  const link = firstRecord(data).links[0];
  assert(link, "dataset fixture requires a primary source");
  return link;
}
test("metadata validation rejects missing coverage, duplicate names and unsafe source links", () => {
  const expected = LANGUAGE_INFORMATION.records.map((r) => r.name);
  const mutate = (change: (data: typeof LANGUAGE_INFORMATION) => void) => {
    const data = structuredClone(LANGUAGE_INFORMATION);
    change(data);
    assert.throws(
      () => validateLanguageInformation(data, expected),
      /Language information/,
    );
  };
  mutate((data) => {
    data.records.pop();
  });
  mutate((data) => {
    data.records.push(firstRecord(data));
  });
  mutate((data) => {
    firstRecord(data).name = "Unlisted language";
  });
  for (const url of [
    "javascript:alert(1)",
    "http://example.org/",
    "https://user:secret@example.org/",
    "https://example.org:444/",
    "https://example.org/\u0000",
  ]) {
    mutate((data) => {
      firstLink(data).url = url;
    });
  }
  mutate((data) => {
    firstRecord(data).summary = "";
  });
  mutate((data) => {
    firstRecord(data).uses = [];
  });
  mutate((data) => {
    const name = data.ranking.ordered_names[0];
    assert(name);
    data.ranking.ordered_names.push(name);
  });
  mutate((data) => {
    data.checked_on = "2026-99-99";
  });
});

test("concrete lifecycle and origin claims must bind to a linked source", () => {
  const expected = LANGUAGE_INFORMATION.records.map((r) => r.name);
  for (const change of [
    (data: typeof LANGUAGE_INFORMATION) => {
      firstRecord(data).introduced = 1964;
      firstRecord(data).introducedSource = null;
    },
    (data: typeof LANGUAGE_INFORMATION) => {
      firstRecord(data).introduced = 1200;
    },
    (data: typeof LANGUAGE_INFORMATION) => {
      firstRecord(data).lifecycle = "maintained";
      firstRecord(data).lifecycleSource = null;
    },
    (data: typeof LANGUAGE_INFORMATION) => {
      firstRecord(data).lifecycle = "retired";
      firstRecord(data).lifecycleNote = null;
    },
    (data: typeof LANGUAGE_INFORMATION) => {
      firstRecord(data).introduced = null;
      firstRecord(data).introducedSource = "https://unbound.example/";
    },
    (data: typeof LANGUAGE_INFORMATION) => {
      Object.assign(firstRecord(data), {
        assessments: { performance: "HIGH" },
      });
    },
  ]) {
    const data = structuredClone(LANGUAGE_INFORMATION);
    change(data);
    assert.throws(
      () => validateLanguageInformation(data, expected),
      /Language information/,
    );
  }
});
