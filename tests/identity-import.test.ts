// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  gitBlobSha,
  importIdentities,
  parseLinguistProgrammingNames,
  type IdentitySelection,
} from "../tools/import-identity-sources.ts";

const selection: IdentitySelection = {
  schema_version: 1,
  source_pins: {
    linguist_commit: "a".repeat(40),
    linguist_blob_sha: "b".repeat(40),
    spdx_commit: "c".repeat(40),
    spdx_blob_sha: "d".repeat(40),
    spdx_version: "3.29.0",
  },
  language_names: ["Foo", "Bar"],
};

const linguist = [
  "# top-level language names",
  "Foo:",
  "  type: programming",
  "  extensions:",
  "  - .foo",
  "'Bar':",
  "  type: programming",
  "  color: '#ffffff'",
  "Note:",
  "  type: prose",
  "  extensions:",
  "  - .txt",
  "",
].join("\n");

function licenseSource() {
  return JSON.stringify({
    licenseListVersion: "3.29.0",
    licenses: [
      {
        licenseId: "Alpha-1.0",
        name: "Alpha",
        reference: "https://spdx.org/licenses/Alpha-1.0.html",
        isOsiApproved: true,
        isDeprecatedLicenseId: false,
      },
      {
        licenseId: "Beta-2.0",
        name: "Beta",
        reference: "https://spdx.org/licenses/Beta-2.0.html",
        isOsiApproved: false,
        isDeprecatedLicenseId: false,
      },
      {
        licenseId: "Old-1.0",
        name: "Old",
        reference: "https://spdx.org/licenses/Old-1.0.html",
        isOsiApproved: false,
        isDeprecatedLicenseId: true,
      },
    ],
  });
}

test("Linguist parser accepts only explicit programming identities", () => {
  assert.deepEqual(parseLinguistProgrammingNames(linguist), ["Foo", "Bar"]);
});

test("SPDX importer preserves OSI flag and excludes deprecated identities", () => {
  const actual = importIdentities(linguist, licenseSource(), selection);
  assert.deepEqual(actual.languages, ["Foo", "Bar"]);
  assert.deepEqual(actual.licenses, [
    {
      id: "Alpha-1.0",
      name: "Alpha",
      reference: "https://spdx.org/licenses/Alpha-1.0.html",
      osiApproved: true,
    },
    {
      id: "Beta-2.0",
      name: "Beta",
      reference: "https://spdx.org/licenses/Beta-2.0.html",
      osiApproved: false,
    },
  ]);
  assert.match(actual.source.languages, /blob\/a{40}\//u);
  assert.match(actual.source.licenses, /blob\/c{40}\//u);
});

test("import rejects missing names, repeated selection and mismatched version", () => {
  assert.throws(
    () => importIdentities(linguist, licenseSource(), {
      ...selection,
      language_names: ["Absent"],
    }),
    /language missing/u,
  );
  assert.throws(
    () => importIdentities(linguist, licenseSource(), {
      ...selection,
      language_names: ["Foo", "foo"],
    }),
    /duplicate selected/u,
  );
  assert.throws(
    () => importIdentities(linguist, licenseSource(), {
      ...selection,
      source_pins: { ...selection.source_pins, spdx_version: "9.9.9" },
    }),
    /SPDX version/u,
  );
});

test("import rejects malformed or duplicated active SPDX IDs", () => {
  const source = JSON.parse(licenseSource());
  source.licenses.push({ ...source.licenses[0] });
  assert.throws(
    () => importIdentities(linguist, JSON.stringify(source), selection),
    /duplicate SPDX/u,
  );
  source.licenses.pop();
  source.licenses[0].reference = "https://invalid.example/";
  assert.throws(
    () => importIdentities(linguist, JSON.stringify(source), selection),
    /invalid SPDX/u,
  );
});

test("selection and generated snapshot agree exactly on names and source pins", () => {
  const actualSelection = JSON.parse(
    readFileSync("catalog/identity-selection.json", "utf8"),
  ) as IdentitySelection;
  const generated = JSON.parse(
    readFileSync("catalog/identity-data.json", "utf8"),
  ) as { source: { spdx_version: string; languages: string; licenses: string }; languages: string[] };
  assert.deepEqual(generated.languages, actualSelection.language_names);
  assert.equal(generated.source.spdx_version, actualSelection.source_pins.spdx_version);
  assert(generated.source.languages.includes(actualSelection.source_pins.linguist_commit));
  assert(generated.source.licenses.includes(actualSelection.source_pins.spdx_commit));
});

test("Git blob verification uses Git's blob framing", () => {
  assert.equal(
    gitBlobSha(Buffer.from("hello\n", "utf8")),
    "ce013625030ba8dba906f756967f9e9ca394464a",
  );
});
