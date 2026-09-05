// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { schemaBytes, validateDocument } from "../validation/documents.ts";
import { parseStrictJson } from "../validation/json.ts";
/** PLLDN JSON encoding v0.1: sorted object keys, preserved arrays, UTF-8, final LF. */
export function encodeCanonical(data: unknown): string {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value !== null && typeof value === "object") {
      if (
        Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null
      )
        throw new Error("Plain JSON object required");
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, v]) => [k, normalize(v)]),
      );
    }
    if (
      value === undefined ||
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
    )
      throw new Error("Non-JSON value");
    if (
      typeof value === "number" &&
      (!Number.isFinite(value) || Object.is(value, -0))
    )
      throw new Error("Non-canonical number");
    return value;
  };
  const encoded = `${JSON.stringify(normalize(data))}\n`;
  parseStrictJson(encoded);
  return encoded;
}
/** Hash exact UTF-8 bytes; this does not assert reviewer identity. */
export async function sha256(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function schemaDigest(): Promise<string> {
  return sha256(
    encodeCanonical(
      Object.fromEntries(
        Object.entries(schemaBytes).map(([k, v]) => [k, parseStrictJson(v)]),
      ),
    ),
  );
}
export interface Manifest {
  schema_version: string;
  knowledge_snapshot: string;
  rules_snapshot: string;
  schema_sha256: string;
  documents: { path: string; sha256: string }[];
}
/** Build a candidate manifest. Generation never approves the candidate. */
export async function createManifest(
  files: Readonly<Record<string, string>>,
  knowledge: string,
  rules: string,
): Promise<Manifest> {
  const documents = await Promise.all(
    Object.entries(files)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(async ([path, content]) => ({
        path,
        sha256: await sha256(content),
      })),
  );
  const manifest = {
    schema_version: "0.1",
    knowledge_snapshot: knowledge,
    rules_snapshot: rules,
    schema_sha256: await schemaDigest(),
    documents,
  };
  validateDocument("snapshot", manifest);
  return manifest;
}
