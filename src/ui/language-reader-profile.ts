// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { readerExampleStatus } from "../product/language-reader-profiles.ts";
import {
  type LanguageReaderProfile,
  type ReaderFact,
  type ReaderSectionKey,
  type ReaderSource,
  readerSafeHttps,
} from "../product/language-reader-validation.ts";

export const READER_SECTION_LABELS: Readonly<Record<ReaderSectionKey, string>> =
  {
    fit: "Fit and limitations",
    prerequisites: "Prerequisites",
    execution: "Execution workflow",
    behavior: "Language behavior",
    tooling: "Tools and ecosystem",
    maintenance: "Maintenance and deployment",
    costs: "Costs and obligations",
  };
export interface LanguageReaderRenderOptions {
  licenseHref: (exactSpdxId: string) => string | null;
  exampleStatus: ReturnType<typeof readerExampleStatus>;
}
function paragraph(text: string): HTMLParagraphElement {
  const node = document.createElement("p");
  node.textContent = text;
  return node;
}
function heading(text: string): HTMLHeadingElement {
  const node = document.createElement("h4");
  node.textContent = text;
  return node;
}
/** Resolve cited sources exactly; a missing or unsafe reference is a rendering failure. */
export function readerSources(
  profile: LanguageReaderProfile,
  ids: readonly string[],
): readonly ReaderSource[] {
  return [...new Set(ids)].map((id) => {
    const source = profile.sources.find((item) => item.id === id);
    if (!source || !readerSafeHttps(source.url))
      throw new Error(`Reader source is missing or unsafe: ${id}`);
    return source;
  });
}
function sourceLink(source: ReaderSource): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "reader-citation";
  link.href = source.url;
  link.rel = "noopener noreferrer";
  link.textContent = source.label;
  link.title = `Source checked ${source.checked_on}`;
  return link;
}
function citations(
  profile: LanguageReaderProfile,
  ids: readonly string[],
): HTMLElement {
  const list = document.createElement("span");
  list.className = "reader-citations";
  for (const source of readerSources(profile, ids))
    list.append(sourceLink(source));
  return list;
}
function factBlock(
  profile: LanguageReaderProfile,
  fact: ReaderFact,
): HTMLElement {
  const block = document.createElement("div");
  block.className = "reader-fact";
  block.append(paragraph(fact.text), citations(profile, fact.source_ids));
  return block;
}
export function renderLanguageReaderBrief(
  profile: LanguageReaderProfile,
): HTMLElement {
  const brief = document.createElement("div");
  brief.className = "language-reader-brief";
  for (const [label, fact] of [
    ["Fits when", profile.sections.fit],
    ["Before you start", profile.sections.prerequisites],
  ] as const) {
    const block = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = label;
    block.append(title, factBlock(profile, fact));
    brief.append(block);
  }
  return brief;
}
export function readerExampleStatusLabel(
  status: ReturnType<typeof readerExampleStatus>,
): string {
  return status.status === "executed"
    ? `Execution recorded · ${status.toolchain} · ${status.checked_on}`
    : "Documented example · not executed by PLLDN.";
}
function exampleSection(
  profile: LanguageReaderProfile,
  options: LanguageReaderRenderOptions,
): HTMLElement {
  const example = profile.example;
  const section = document.createElement("section");
  section.dataset.readerSection = "example";
  section.className = "reader-example";
  section.append(
    heading(example.kind === "reference" ? "Reference workflow" : "Example"),
  );
  const status = paragraph(readerExampleStatusLabel(options.exampleStatus));
  status.dataset.readerExampleStatus = options.exampleStatus.status;
  status.className = "reader-example-status";
  section.append(status, paragraph(`Example type: ${example.kind}`));
  if (example.filename !== null) {
    const filename = document.createElement("code");
    filename.className = "reader-example-filename";
    filename.textContent = example.filename;
    section.append(filename);
  }
  if (example.code !== null) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = example.code;
    pre.setAttribute("tabindex", "0");
    pre.setAttribute("aria-label", `${profile.name} ${example.kind} example`);
    pre.append(code);
    section.append(pre);
  }
  section.append(
    heading("How to use this example"),
    paragraph(example.run_instructions),
    heading("Expected result"),
    paragraph(example.expected_result),
    citations(profile, example.source_ids),
  );
  if (example.try_url !== null) {
    if (!readerSafeHttps(example.try_url))
      throw new Error("Unsafe reader playground URL");
    const tryLink = document.createElement("a");
    tryLink.className = "reader-try-link";
    tryLink.href = example.try_url;
    tryLink.rel = "noopener noreferrer";
    tryLink.textContent = "Try in the official browser environment";
    section.append(tryLink);
  }
  return section;
}
function licenseBlock(
  profile: LanguageReaderProfile,
  options: LanguageReaderRenderOptions,
): HTMLElement {
  const block = document.createElement("div");
  block.className = "reader-license-block";
  block.append(
    heading("Implementation, runtime and standard-library licenses"),
    paragraph(
      "License scope belongs to each named component and version. Expressions are shown literally; no project-license or compatibility conclusion is inferred.",
    ),
  );
  const list = document.createElement("ul");
  for (const license of profile.licenses) {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = `${license.component} · ${license.role}`;
    const expression = document.createElement("code");
    expression.textContent =
      license.spdx_expression ?? "License expression not established";
    item.append(name, paragraph(license.scope), expression);
    // Token links navigate to known licenses without interpreting the expression.
    const tokens = new Set(license.spdx_expression?.split(/[\s()]+/) ?? []);
    for (const token of tokens) {
      if (!token || ["AND", "OR", "WITH"].includes(token)) continue;
      const href = options.licenseHref(token);
      if (href === null) continue;
      const target = new URL(href, "https://plldn.invalid/");
      if (!href.startsWith("?") || target.origin !== "https://plldn.invalid")
        throw new Error("Reader license route must remain in the catalogue");
      const link = document.createElement("a");
      link.className = "reader-license-catalog";
      link.href = href;
      link.textContent = `Open ${token} in the license catalogue`;
      item.append(link);
    }
    item.append(
      paragraph(license.notice),
      citations(profile, license.source_ids),
    );
    list.append(item);
  }
  block.append(list);
  return block;
}
/** Render documented material as text and links; code and instructions are never executed. */
export function renderLanguageReaderProfile(
  profile: LanguageReaderProfile,
  options: LanguageReaderRenderOptions,
): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "language-reader-profile";
  details.dataset.readerName = profile.name;
  const title = document.createElement("summary");
  title.textContent = `Read ${profile.name}: fit, setup and example`;
  details.append(
    title,
    paragraph(`Implementation: ${profile.implementation.name}`),
    paragraph(`Scope: ${profile.implementation.version_scope}`),
    citations(profile, profile.implementation.source_ids),
  );
  for (const [key, label] of Object.entries(READER_SECTION_LABELS) as [
    ReaderSectionKey,
    string,
  ][]) {
    const section = document.createElement("section");
    section.dataset.readerSection = key;
    section.append(heading(label), factBlock(profile, profile.sections[key]));
    details.append(section);
  }
  details.append(
    exampleSection(profile, options),
    licenseBlock(profile, options),
  );
  const inventory = document.createElement("div");
  inventory.className = "reader-source-inventory";
  inventory.append(heading("Sources and check dates"));
  for (const source of profile.sources) {
    if (!readerSafeHttps(source.url))
      throw new Error("Unsafe reader inventory URL");
    const row = paragraph(`Checked ${source.checked_on} · `);
    row.append(sourceLink(source));
    inventory.append(row);
  }
  details.append(inventory);
  return details;
}
