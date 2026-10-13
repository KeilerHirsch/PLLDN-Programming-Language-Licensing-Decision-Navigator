// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import type { LanguageReaderProfile } from "../src/product/language-reader-validation.ts";
import {
  renderLanguageReaderBrief,
  renderLanguageReaderProfile,
} from "../src/ui/language-reader-profile.ts";

class ElementFixture {
  className = "";
  textContent = "";
  href = "";
  rel = "";
  title = "";
  target = "";
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: ElementFixture[] = [];
  readonly tagName: string;
  constructor(tagName: string) {
    this.tagName = tagName;
  }
  append(...children: ElementFixture[]): void {
    this.children.push(...children);
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}
function descendants(node: ElementFixture): ElementFixture[] {
  return [node, ...node.children.flatMap(descendants)];
}
function textOf(node: ElementFixture): string {
  return descendants(node)
    .map((child) => child.textContent)
    .join("\n");
}
function documentFixture(t: { after(fn: () => void): void }): void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: (tag: string) => new ElementFixture(tag) },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  });
}
// Synthetic rendering values; never included in the public reader corpus.
function fixture(): LanguageReaderProfile {
  const fact = (text: string) => ({ text, source_ids: ["book"] });
  return {
    name: "Rust",
    implementation: {
      name: "Rendering fixture",
      version_scope: "Fixture scope",
      source_ids: ["book"],
    },
    sources: [
      {
        id: "book",
        label: "Rust book source link fixture",
        url: "https://doc.rust-lang.org/book/ch01-02-hello-world.html",
        checked_on: "2026-10-13",
      },
    ],
    sections: {
      fit: fact("Fixture fit text"),
      prerequisites: fact("Fixture prerequisites text"),
      execution: fact("Fixture execution text"),
      behavior: fact("Fixture behavior text"),
      tooling: fact("Fixture tooling text"),
      maintenance: fact("Fixture maintenance text"),
      costs: fact("Fixture costs text"),
    },
    example: {
      kind: "program",
      filename: "hello.rs",
      code: 'fn main() { println!("literal <script>alert(1)</script>"); }',
      run_instructions: "Fixture instructions shown as text only",
      expected_result: "literal <script>alert(1)</script>",
      source_ids: ["book"],
      try_url: null,
      verification: { status: "documented", toolchain: null, checked_on: null },
    },
    licenses: [
      {
        component: "Fixture component",
        role: "implementation",
        spdx_expression: "MIT",
        source_ids: ["book"],
        scope: "Fixture component only",
        notice: "A fixture notice; no compatibility recommendation.",
      },
    ],
  };
}
const options = {
  licenseHref: (id: string) =>
    id === "MIT"
      ? "?profile=license.mit#catalog"
      : id === "Apache-2.0"
        ? "?profile=license.apache-2.0#catalog"
        : null,
  exampleStatus: {
    status: "documented" as const,
    toolchain: null,
    checked_on: null,
  },
};
test("reader has eight useful sections, adjacent sources and text-only example content", (t) => {
  documentFixture(t);
  const profile = fixture();
  const view = renderLanguageReaderProfile(
    profile,
    options,
  ) as unknown as ElementFixture;
  assert.equal(view.tagName, "details");
  assert.equal(view.dataset.readerName, "Rust");
  assert.deepEqual(
    descendants(view)
      .filter((node) => node.dataset.readerSection)
      .map((node) => node.dataset.readerSection),
    [
      "fit",
      "prerequisites",
      "execution",
      "behavior",
      "tooling",
      "maintenance",
      "costs",
      "example",
    ],
  );
  for (const key of Object.keys(profile.sections)) {
    const section = descendants(view).find(
      (node) => node.dataset.readerSection === key,
    );
    assert(section);
    assert(
      descendants(section).some((node) =>
        node.className.split(" ").includes("reader-citation"),
      ),
    );
  }
  assert(
    descendants(view).some(
      (node) =>
        node.tagName === "code" && node.textContent === profile.example.code,
    ),
  );
  assert(textOf(view).includes("not executed"));
  assert(!textOf(view).includes("Execution recorded"));
  assert(
    descendants(view)
      .filter((node) => node.tagName === "a" && node.href.startsWith("https:"))
      .every(
        (node) =>
          node.rel.includes("noopener") && node.rel.includes("noreferrer"),
      ),
  );
  assert(textOf(view).includes("Fixture scope"));
  assert(textOf(view).includes("2026-10-13"));
  const brief = renderLanguageReaderBrief(profile) as unknown as ElementFixture;
  assert(textOf(brief).includes("Fixture fit text"));
  assert(textOf(brief).includes("Fixture prerequisites text"));
  assert(descendants(brief).filter((node) => node.tagName === "a").length >= 2);
});
test("license expressions stay literal while each exact known license token has a catalogue link", (t) => {
  documentFixture(t);
  const profile = fixture();
  const exact = renderLanguageReaderProfile(
    profile,
    options,
  ) as unknown as ElementFixture;
  assert(
    descendants(exact).some(
      (node) => node.href === "?profile=license.mit#catalog",
    ),
  );
  const firstLicense = profile.licenses[0];
  assert(firstLicense);
  for (const [literal, expectedLinks] of [
    [
      "MIT OR (Apache-2.0 AND MIT)",
      ["?profile=license.mit#catalog", "?profile=license.apache-2.0#catalog"],
    ],
    ["Apache-2.0 WITH LLVM-exception", ["?profile=license.apache-2.0#catalog"]],
    ["MIT_UNKNOWN OR DocumentRef-fixture:MIT OR LicenseRef-fixture", []],
  ] as const) {
    const compound = {
      ...profile,
      licenses: [{ ...firstLicense, spdx_expression: literal }],
    };
    const expression = renderLanguageReaderProfile(
      compound,
      options,
    ) as unknown as ElementFixture;
    assert(textOf(expression).includes(literal));
    const links = descendants(expression).filter(
      (node) => node.className === "reader-license-catalog",
    );
    assert.deepEqual(
      links.map((node) => node.href),
      [...expectedLinks],
      literal,
    );
    assert(textOf(expression).includes("no compatibility recommendation"));
  }
});
test("reference-only workflows expose their reason and cannot masquerade as runnable or verified code", (t) => {
  documentFixture(t);
  const profile = fixture();
  const reference: LanguageReaderProfile = {
    ...profile,
    example: {
      ...profile.example,
      kind: "reference",
      code: null,
      filename: null,
      run_instructions: "No documented executable fixture is available.",
      expected_result: "Consult the bound reference instead.",
    },
  };
  const view = renderLanguageReaderProfile(
    reference,
    options,
  ) as unknown as ElementFixture;
  const example = descendants(view).find(
    (node) => node.dataset.readerSection === "example",
  );
  assert(example);
  assert(
    textOf(example).includes("No documented executable fixture is available."),
  );
  assert(!descendants(example).some((node) => node.tagName === "pre"));
  assert(textOf(example).includes("not executed"));
});
test("reader rejects unsafe or unbound source references instead of silently presenting unsupported facts", (t) => {
  documentFixture(t);
  const profile = fixture();
  const firstSource = profile.sources[0];
  assert(firstSource);
  const unsafe = {
    ...profile,
    sources: [{ ...firstSource, url: "javascript:alert(1)" }],
  };
  assert.throws(() => renderLanguageReaderProfile(unsafe, options));
  const unbound = {
    ...profile,
    sections: {
      ...profile.sections,
      fit: { ...profile.sections.fit, source_ids: ["missing-source"] },
    },
  };
  assert.throws(() => renderLanguageReaderBrief(unbound));
});
