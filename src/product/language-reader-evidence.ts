// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

import type { LanguageReaderProfile } from "./language-reader-validation.ts";
import { readerDate } from "./language-reader-validation.ts";

export interface ReaderExampleEvidence {
  name: "JavaScript" | "TypeScript";
  producer: "node-console-v1" | "typescript-console-v1";
  filename: string;
  code: string;
  run_instructions: string;
  expected_result: string;
  stdout: string;
  toolchain: string;
  checked_on: string;
}
export interface ReaderExampleStatus {
  status: "documented" | "executed";
  toolchain: string | null;
  checked_on: string | null;
}
const keys = [
  "name",
  "producer",
  "filename",
  "code",
  "run_instructions",
  "expected_result",
  "stdout",
  "toolchain",
  "checked_on",
];
function plain(
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid example receipt object");
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== fields.length ||
    fields.some((key) => !Object.hasOwn(record, key))
  )
    throw new Error("Invalid example receipt fields");
  return record;
}
function bounded(value: unknown, limit: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= limit
  );
}
/** Maintained receipts belong to a fixed verifier; profile metadata cannot certify itself. */
export function validateExampleEvidence(
  input: unknown,
): ReaderExampleEvidence[] {
  const envelope = plain(input, ["schema_version", "records"]);
  if (
    envelope.schema_version !== 1 ||
    !Array.isArray(envelope.records) ||
    envelope.records.length > 2
  )
    throw new Error("Invalid example evidence envelope");
  const seen = new Set<string>();
  for (const value of envelope.records) {
    const record = plain(value, keys);
    const js = record.name === "JavaScript";
    const ts = record.name === "TypeScript";
    if ((!js && !ts) || seen.has(String(record.name)))
      throw new Error("Unknown or duplicate execution receipt");
    seen.add(String(record.name));
    const toolchain = js
      ? /^Node\.js \d+\.\d+\.\d+$/u
      : /^Node\.js \d+\.\d+\.\d+ \/ TypeScript \d+\.\d+\.\d+$/u;
    if (
      record.producer !== (js ? "node-console-v1" : "typescript-console-v1") ||
      record.filename !== (js ? "hello.js" : "hello.ts") ||
      !bounded(record.code, 8000) ||
      !bounded(record.run_instructions, 1800) ||
      !bounded(record.expected_result, 900) ||
      record.stdout !== "PLLDN\n" ||
      typeof record.toolchain !== "string" ||
      !toolchain.test(record.toolchain) ||
      !readerDate(record.checked_on)
    )
      throw new Error("Invalid execution receipt");
  }
  return structuredClone(envelope.records) as ReaderExampleEvidence[];
}
export function exampleExecutionStatus(
  profile: LanguageReaderProfile,
  records: readonly ReaderExampleEvidence[],
): ReaderExampleStatus {
  const matching = records.find(
    (record) =>
      record.name === profile.name &&
      record.filename === profile.example.filename &&
      record.code === profile.example.code &&
      record.run_instructions === profile.example.run_instructions &&
      record.expected_result === profile.example.expected_result,
  );
  return matching
    ? {
        status: "executed",
        toolchain: matching.toolchain,
        checked_on: matching.checked_on,
      }
    : { status: "documented", toolchain: null, checked_on: null };
}
