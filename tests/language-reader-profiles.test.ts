// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  type ReaderFact,
  type ReaderSectionKey,
  type ReaderSource,
  readerDate,
  readerSafeHttps,
  validateReaderProfiles,
} from "../src/product/language-reader-validation.ts";

function fixture() {
  const fact = {
    text: "A small explicitly scoped programming example.",
    source_ids: ["guide"],
  };
  const record = {
    name: "Example",
    implementation: {
      name: "Example implementation",
      version_scope: "Documented implementation; version not pinned.",
      source_ids: ["guide"],
    },
    sources: [
      {
        id: "guide",
        label: "Implementation documentation",
        url: "https://example.org/guide",
        checked_on: "2026-10-13",
      },
      {
        id: "license",
        label: "Implementation license",
        url: "https://example.org/LICENSE",
        checked_on: "2026-10-13",
      },
    ],
    sections: Object.fromEntries(
      [
        "fit",
        "prerequisites",
        "execution",
        "behavior",
        "tooling",
        "maintenance",
        "costs",
      ].map((key) => [key, structuredClone(fact)]),
    ),
    example: {
      kind: "program",
      filename: "hello.ex",
      code: 'print("PLLDN")',
      run_instructions:
        "Run hello.ex with the documented Example implementation.",
      expected_result: "Prints PLLDN followed by a newline.",
      source_ids: ["guide"],
      try_url: null,
      verification: { status: "documented", toolchain: null, checked_on: null },
    },
    licenses: [
      {
        component: "Example implementation",
        role: "implementation",
        spdx_expression: "MIT",
        source_ids: ["license"],
        scope: "This implementation only.",
        notice: "Read the original terms for this component.",
      },
    ],
  };
  return {
    ...record,
    sources: record.sources as [ReaderSource, ReaderSource],
    sections: record.sections as Record<ReaderSectionKey, ReaderFact>,
    licenses: record.licenses as [(typeof record.licenses)[number]],
  };
}
test("reader profile validator preserves a complete scoped record and exact identities", () => {
  const record = fixture();
  const result = validateReaderProfiles([record], ["Example"]);
  assert.deepEqual(result, [record]);
  assert.throws(() => validateReaderProfiles([record], ["Other"]));
  assert.throws(() => validateReaderProfiles([record, record], ["Example"]));
  assert.throws(() => validateReaderProfiles([], ["Example"]));
});
test("every fact must resolve its own source references", () => {
  for (const key of [
    "fit",
    "prerequisites",
    "execution",
    "behavior",
    "tooling",
    "maintenance",
    "costs",
  ] as const) {
    const record = fixture();
    record.sections[key].source_ids = ["missing"];
    assert.throws(() => validateReaderProfiles([record], ["Example"]), key);
  }
  const record = fixture();
  record.sources[1].id = "guide";
  assert.throws(() => validateReaderProfiles([record], ["Example"]));
});
test("strict structure rejects missing sections and unexpected assessment fields", () => {
  const record = fixture();
  delete (record.sections as Partial<typeof record.sections>).costs;
  assert.throws(() => validateReaderProfiles([record], ["Example"]));
  const promoted = { ...fixture(), review_status: "Reviewed" };
  assert.throws(() => validateReaderProfiles([promoted], ["Example"]));
});
test("source URLs reject credential, protocol, whitespace and port attacks", () => {
  for (const url of [
    "javascript:alert(1)",
    "http://example.org",
    "https://user:password@example.org",
    "https://example.org:8443",
    "https://example.org/\n",
  ]) {
    const record = fixture();
    record.sources[0].url = url;
    assert.throws(() => validateReaderProfiles([record], ["Example"]), url);
  }
});
test("source and example fields validate real dates, references and file names", () => {
  const record = fixture();
  record.sources[0].checked_on = "2026-02-30";
  assert.throws(() => validateReaderProfiles([record], ["Example"]));
  for (const name of ["../secret.ex", "C:/secret.ex", "folder\\secret.ex"]) {
    const bad = fixture();
    bad.example.filename = name;
    assert.throws(() => validateReaderProfiles([bad], ["Example"]));
  }
  const bad = fixture();
  bad.example.source_ids = [];
  assert.throws(() => validateReaderProfiles([bad], ["Example"]));
});
test("descriptive records cannot self-certify execution evidence", () => {
  const record = fixture();
  Object.assign(record.example.verification, {
    status: "executed",
    toolchain: "imaginary",
    checked_on: "2026-10-13",
  });
  assert.throws(() => validateReaderProfiles([record], ["Example"]));
});
test("unavailable textual examples remain explicit references", () => {
  const record = fixture();
  Object.assign(record.example, {
    kind: "reference",
    code: null,
    filename: null,
    run_instructions:
      "Follow the documented graphical workflow in the named host.",
    expected_result:
      "A graphical result; no executable text example is established.",
  });
  assert.equal(
    validateReaderProfiles([record], ["Example"])[0]?.example.code,
    null,
  );
  record.example.kind = "program";
  assert.throws(() => validateReaderProfiles([record], ["Example"]));
});
test("component licenses preserve unknown identities and reject malformed expressions", () => {
  const record = fixture();
  Object.assign(record.licenses[0], { spdx_expression: null });
  assert.equal(
    validateReaderProfiles([record], ["Example"])[0]?.licenses[0]
      ?.spdx_expression,
    null,
  );
  Object.assign(record.licenses[0], { spdx_expression: "MIT OR Apache-2.0" });
  assert.equal(
    validateReaderProfiles([record], ["Example"])[0]?.licenses[0]
      ?.spdx_expression,
    "MIT OR Apache-2.0",
  );
  Object.assign(record.licenses[0], { source_ids: ["not-a-license-source"] });
  assert.throws(() => validateReaderProfiles([record], ["Example"]));
});

test("source primitives reject invalid dates, URLs and excessive values", () => {
  for (const value of [
    null,
    1,
    "",
    "not-a-url",
    `https://${"x".repeat(2050)}`,
    "https://host/a b",
  ])
    assert.equal(readerSafeHttps(value), false);
  assert.equal(readerSafeHttps("https://docs.example.org/a#section"), true);
  for (const value of [null, 12, "today", "2026-13-01", "2026-02-29"])
    assert.equal(readerDate(value), false);
  assert.equal(readerDate("2024-02-29"), true);
});
test("strict descriptive bounds reject partial, empty and malformed records", () => {
  assert.throws(() => validateReaderProfiles(null, ["Example"]));
  assert.throws(() => validateReaderProfiles([fixture()], []));
  assert.throws(() =>
    validateReaderProfiles([fixture()], ["Example", "Example"]),
  );
  const transforms: ((record: ReturnType<typeof fixture>) => void)[] = [
    (record) => {
      record.sections.fit.text = "";
    },
    (record) => {
      record.sections.fit.text = "x".repeat(901);
    },
    (record) => {
      record.sections.fit.text = "text\u0000";
    },
    (record) => {
      record.sections.fit.source_ids = ["guide", "guide"];
    },
    (record) => {
      record.sources[0].id = "Bad ID";
    },
    (record) => {
      record.sources[0].label = "";
    },
    (record) => {
      record.implementation.name = "";
    },
    (record) => {
      record.implementation.source_ids = ["unknown"];
    },
    (record) => {
      record.example.kind = "shell-eval";
    },
    (record) => {
      record.example.run_instructions = "";
    },
    (record) => {
      record.example.try_url = "javascript:alert(1)" as never;
    },
    (record) => {
      record.example.code = "";
    },
    (record) => {
      record.example.code = "bad\u0001";
    },
    (record) => {
      record.licenses[0].role = "guessed-role";
    },
    (record) => {
      record.licenses[0].scope = "";
    },
    (record) => {
      Object.assign(record, {
        licenses: [record.licenses[0], record.licenses[0]],
      });
    },
    (record) => {
      Object.assign(record, { sources: [] });
    },
    (record) => {
      Object.assign(record, { licenses: [] });
    },
  ];
  for (const transform of transforms) {
    const record = fixture();
    transform(record);
    assert.throws(() => validateReaderProfiles([record], ["Example"]));
  }
});
test("SPDX syntax retains choices and exceptions and rejects incomplete operators", () => {
  for (const expression of [
    "MIT OR (Apache-2.0 AND BSD-3-Clause)",
    "GPL-3.0-or-later WITH GCC-exception-3.1",
  ]) {
    const record = fixture();
    record.licenses[0].spdx_expression = expression;
    assert.equal(
      validateReaderProfiles([record], ["Example"])[0]?.licenses[0]
        ?.spdx_expression,
      expression,
    );
  }
  for (const expression of [
    "MIT OR",
    "AND MIT",
    "MIT Apache-2.0",
    "(MIT OR Apache-2.0",
    "MIT WITH",
    "MIT OR (Apache-2.0 AND)",
    "MIT;alert()",
    "MIT WITH OR",
    "(MIT) WITH LLVM-exception",
  ]) {
    const record = fixture();
    record.licenses[0].spdx_expression = expression;
    assert.throws(
      () => validateReaderProfiles([record], ["Example"]),
      expression,
    );
  }
});

test("enum fields reject JSON arrays and objects without string coercion", () => {
  for (const kind of [
    ["program"],
    ["configuration"],
    { name: "program" },
    null,
    1,
  ]) {
    const record = fixture();
    Object.assign(record.example, { kind });
    assert.throws(() => validateReaderProfiles([record], ["Example"]));
  }
  for (const role of [
    ["runtime"],
    ["implementation"],
    { name: "runtime" },
    null,
    1,
  ]) {
    const record = fixture();
    Object.assign(record.licenses[0], { role });
    assert.throws(() => validateReaderProfiles([record], ["Example"]));
  }
});
