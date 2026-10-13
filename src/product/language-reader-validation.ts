// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
export const READER_SECTION_KEYS = [
  "fit",
  "prerequisites",
  "execution",
  "behavior",
  "tooling",
  "maintenance",
  "costs",
] as const;
export type ReaderSectionKey = (typeof READER_SECTION_KEYS)[number];
export interface ReaderFact {
  text: string;
  source_ids: string[];
}
export interface ReaderSource {
  id: string;
  label: string;
  url: string;
  checked_on: string;
}
export interface LanguageReaderProfile {
  name: string;
  implementation: { name: string; version_scope: string; source_ids: string[] };
  sources: ReaderSource[];
  sections: Record<ReaderSectionKey, ReaderFact>;
  example: {
    kind: "program" | "configuration" | "query" | "markup" | "reference";
    filename: string | null;
    code: string | null;
    run_instructions: string;
    expected_result: string;
    source_ids: string[];
    try_url: string | null;
    verification: { status: "documented"; toolchain: null; checked_on: null };
  };
  licenses: {
    component: string;
    role: "implementation" | "runtime" | "standard-library";
    spdx_expression: string | null;
    source_ids: string[];
    scope: string;
    notice: string;
  }[];
}
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Reader profile: ${message}`);
}
function object(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  requireValue(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "expected object",
  );
  const record = value as Record<string, unknown>;
  requireValue(
    Object.keys(record).length === keys.length &&
      keys.every((key) => Object.hasOwn(record, key)),
    "unexpected or missing fields",
  );
  return record;
}
function text(value: unknown, max = 900): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max &&
    !/\p{Cc}/u.test(value)
  );
}
export function readerSafeHttps(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /[\p{Cc}\s]/u.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}
export function readerDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value))
    return false;
  const date = new Date(value);
  return (
    Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}
function refs(value: unknown, sources: ReadonlySet<string>): void {
  requireValue(
    Array.isArray(value) &&
      value.length > 0 &&
      value.length <= 12 &&
      value.every((id) => typeof id === "string" && sources.has(id)) &&
      new Set(value).size === value.length,
    "unresolved or duplicate source reference",
  );
}
function expression(value: unknown): value is string {
  if (!text(value, 250) || !/^[A-Za-z0-9.+() -]+$/u.test(value)) return false;
  const tokens = value.match(/[A-Za-z0-9][A-Za-z0-9.+-]*|\(|\)/gu) ?? [];
  if (tokens.join("") !== value.replaceAll(" ", "")) return false;
  let position = 0;
  const isId = (token: string | undefined) =>
    token !== undefined &&
    /^[A-Za-z0-9][A-Za-z0-9.+-]*$/u.test(token) &&
    !["AND", "OR", "WITH"].includes(token);
  function term(): boolean {
    if (tokens[position] === "(") {
      position++;
      if (!either() || tokens[position++] !== ")") return false;
      return true;
    }
    if (!isId(tokens[position++])) return false;
    if (tokens[position] === "WITH") {
      position++;
      if (!isId(tokens[position++])) return false;
    }
    return true;
  }
  function both(): boolean {
    if (!term()) return false;
    while (tokens[position] === "AND") {
      position++;
      if (!term()) return false;
    }
    return true;
  }
  function either(): boolean {
    if (!both()) return false;
    while (tokens[position] === "OR") {
      position++;
      if (!both()) return false;
    }
    return true;
  }
  return either() && position === tokens.length;
}
/** Validate descriptive facts without creating assessments or executable instructions. */
export function validateReaderProfiles(
  input: unknown,
  expectedNames: readonly string[],
): LanguageReaderProfile[] {
  const names = new Set(expectedNames);
  requireValue(
    names.size > 0 && names.size === expectedNames.length,
    "invalid expected identities",
  );
  requireValue(
    Array.isArray(input) && input.length === names.size,
    "incomplete identity coverage",
  );
  const seen = new Set<string>();
  for (const entry of input) {
    const record = object(entry, [
      "name",
      "implementation",
      "sources",
      "sections",
      "example",
      "licenses",
    ]);
    requireValue(
      typeof record.name === "string" &&
        names.has(record.name) &&
        !seen.has(record.name),
      "unknown or duplicate identity",
    );
    seen.add(record.name);
    requireValue(
      Array.isArray(record.sources) &&
        record.sources.length > 0 &&
        record.sources.length <= 20,
      "missing sources",
    );
    const sourceIds = new Set<string>();
    for (const value of record.sources) {
      const source = object(value, ["id", "label", "url", "checked_on"]);
      requireValue(
        typeof source.id === "string" &&
          /^[a-z][a-z0-9_.-]{0,60}$/u.test(source.id) &&
          !sourceIds.has(source.id) &&
          text(source.label, 200) &&
          readerSafeHttps(source.url) &&
          readerDate(source.checked_on),
        "invalid source",
      );
      sourceIds.add(source.id);
    }
    const implementation = object(record.implementation, [
      "name",
      "version_scope",
      "source_ids",
    ]);
    requireValue(
      text(implementation.name, 200) && text(implementation.version_scope),
      "missing implementation scope",
    );
    refs(implementation.source_ids, sourceIds);
    const sections = object(record.sections, READER_SECTION_KEYS);
    for (const key of READER_SECTION_KEYS) {
      const fact = object(sections[key], ["text", "source_ids"]);
      requireValue(text(fact.text), "missing descriptive fact");
      refs(fact.source_ids, sourceIds);
    }
    const example = object(record.example, [
      "kind",
      "filename",
      "code",
      "run_instructions",
      "expected_result",
      "source_ids",
      "try_url",
      "verification",
    ]);
    requireValue(
      typeof example.kind === "string" &&
        ["program", "configuration", "query", "markup", "reference"].includes(
          example.kind,
        ),
      "invalid example kind",
    );
    requireValue(
      text(example.run_instructions, 1800) && text(example.expected_result),
      "missing example workflow",
    );
    refs(example.source_ids, sourceIds);
    requireValue(
      example.try_url === null || readerSafeHttps(example.try_url),
      "unsafe try URL",
    );
    if (example.kind === "reference") {
      requireValue(
        example.filename === null && example.code === null,
        "reference example must not pretend to contain executable text",
      );
    } else {
      requireValue(
        typeof example.filename === "string" &&
          /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/u.test(example.filename),
        "invalid example filename",
      );
      requireValue(
        typeof example.code === "string" &&
          example.code.trim().length > 0 &&
          example.code.length <= 8000 &&
          !/\p{Cc}/u.test(
            example.code.replaceAll("\n", "").replaceAll("\t", ""),
          ),
        "invalid example code",
      );
    }
    const verification = object(example.verification, [
      "status",
      "toolchain",
      "checked_on",
    ]);
    requireValue(
      verification.status === "documented" &&
        verification.toolchain === null &&
        verification.checked_on === null,
      "execution evidence is owned by the controlled verifier",
    );
    requireValue(
      Array.isArray(record.licenses) &&
        record.licenses.length > 0 &&
        record.licenses.length <= 8,
      "missing component license scope",
    );
    const components = new Set<string>();
    for (const value of record.licenses) {
      const license = object(value, [
        "component",
        "role",
        "spdx_expression",
        "source_ids",
        "scope",
        "notice",
      ]);
      requireValue(
        text(license.component, 200) &&
          typeof license.role === "string" &&
          ["implementation", "runtime", "standard-library"].includes(
            license.role,
          ) &&
          (license.spdx_expression === null ||
            expression(license.spdx_expression)) &&
          text(license.scope) &&
          text(license.notice),
        "invalid component license",
      );
      requireValue(
        !components.has(`${String(license.role)}:${license.component}`),
        "duplicate component license",
      );
      components.add(`${String(license.role)}:${license.component}`);
      refs(license.source_ids, sourceIds);
    }
  }
  return structuredClone(input) as LanguageReaderProfile[];
}
