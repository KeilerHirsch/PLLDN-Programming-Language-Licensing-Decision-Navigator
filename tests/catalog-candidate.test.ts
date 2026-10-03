// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  buildKnowledgeCandidate,
  type CandidateSnapshotIdentity,
} from "../src/knowledge/candidate.ts";

const root = new URL(
  "../knowledge/candidate/catalog-2026-10-03/",
  import.meta.url,
);
const at = "2026-10-03T21:00:00Z";
const identity: CandidateSnapshotIdentity = {
  knowledgeSnapshot: "candidate.language-license-catalog.2026-10-03",
  rulesSnapshot: "candidate.language-license-catalog.rules.2026-10-03",
};

function files(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const child = new URL(`${dir.name}/`, root);
    for (const name of readdirSync(child).filter((x) => x.endsWith(".json"))) {
      out[`${dir.name}/${name}`] = readFileSync(new URL(name, child), "utf8");
    }
  }
  return out;
}

test("broad candidate catalog is structurally valid without self-approved assertions", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  assert.equal(built.documents.length, 61);
  assert.equal(built.reviewedAssertions, 0);
  assert.equal(built.partialAssertions, 0);
  assert.equal(
    built.manifest.knowledge_snapshot,
    "candidate.language-license-catalog.2026-10-03",
  );
  assert.equal(
    built.manifest.rules_snapshot,
    "candidate.language-license-catalog.rules.2026-10-03",
  );
  assert.equal(
    built.documents.some((doc) =>
      ["claim", "relation", "rule"].includes(doc.kind),
    ),
    false,
  );
});

test("candidate catalog contains 35 languages without invented current versions", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const languages = built.documents.filter(
    (doc) =>
      doc.kind === "entity" && doc.record.entity_type === "language",
  );
  assert.equal(languages.length, 35);
  assert(
    languages.every(
      (doc) =>
        JSON.stringify(doc.record.version_scope) ===
        JSON.stringify(["unspecified"]),
    ),
  );
  assert(
    languages.every(
      (doc) =>
        JSON.stringify(doc.record.target_scope) === JSON.stringify(["general"]),
    ),
  );
  assert.deepEqual(
    languages.map((doc) => doc.record.canonical_name).sort(),
    [
      "Ada",
      "Bash",
      "C",
      "C#",
      "C++",
      "Clojure",
      "COBOL",
      "Dart",
      "Elixir",
      "Erlang",
      "F#",
      "Fortran",
      "Go",
      "Haskell",
      "Java",
      "JavaScript",
      "Julia",
      "Kotlin",
      "Lua",
      "Nim",
      "Objective-C",
      "OCaml",
      "PHP",
      "Perl",
      "PowerShell",
      "Python",
      "R",
      "Ruby",
      "Rust",
      "Scala",
      "Solidity",
      "Swift",
      "TypeScript",
      "Visual Basic .NET",
      "Zig",
    ].sort(),
  );
});

test("candidate catalog contains every license identity currently admitted by the entity schema", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const ids = built.documents
    .filter(
      (doc) =>
        doc.kind === "entity" && doc.record.entity_type === "license",
    )
    .map((doc) => doc.record.license_id)
    .sort();
  assert.deepEqual(ids, [
    "0BSD",
    "AGPL-3.0-only",
    "AGPL-3.0-or-later",
    "Apache-2.0",
    "BSD-3-Clause",
    "CC0-1.0",
    "EUPL-1.2",
    "GPL-2.0-only",
    "GPL-2.0-or-later",
    "GPL-3.0-only",
    "GPL-3.0-or-later",
    "LGPL-3.0-only",
    "LGPL-3.0-or-later",
    "MIT",
    "MPL-2.0",
  ]);
});

test("candidate catalog defines comparison vocabularies without assigning candidate values", async () => {
  const built = await buildKnowledgeCandidate(files(), at, identity);
  const dimensions = built.documents
    .filter((doc) => doc.kind === "dimension")
    .map((doc) => doc.record.dimension_id)
    .sort();
  assert.deepEqual(dimensions, [
    "dimension.bare-metal-support",
    "dimension.c-ffi-support",
    "dimension.concurrency-models",
    "dimension.execution-model",
    "dimension.license-explicit-patent-grant",
    "dimension.license-family",
    "dimension.memory-management-model",
    "dimension.official-package-manager",
    "dimension.runtime-targets",
    "dimension.type-checking-model",
    "dimension.webassembly-support",
  ]);
  assert.equal(
    built.documents.some((doc) => doc.kind === "claim"),
    false,
  );
});
