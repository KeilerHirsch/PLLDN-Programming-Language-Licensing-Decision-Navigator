// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import {
  type Document,
  parseDocument,
  validateDocument,
} from "../validation/documents.ts";
import { asObject, parseStrictJson } from "../validation/json.ts";
import { validateReferences } from "../validation/references.ts";
import { type Manifest, schemaDigest, sha256 } from "./manifest.ts";
/** Caller supplies protected approval pins and explicit time, never candidate metadata. */
export async function verifySnapshot(
  raw: string,
  files: Readonly<Record<string, string>>,
  trusted: readonly string[],
  at: string,
): Promise<Document[]> {
  const digest = await sha256(raw);
  if (!trusted.includes(digest))
    throw new Error("Snapshot has no trusted approval");
  const parsed = asObject(parseStrictJson(raw));
  validateDocument("snapshot", parsed);
  const manifest = parsed as unknown as Manifest;
  if (manifest.schema_sha256 !== (await schemaDigest()))
    throw new Error("Schema baseline mismatch");
  const paths = manifest.documents.map((d) => d.path);
  if (
    new Set(paths).size !== paths.length ||
    paths.length !== Object.keys(files).length ||
    paths.some((p) => !Object.hasOwn(files, p))
  )
    throw new Error("Snapshot file set mismatch");
  const documents: Document[] = [];
  for (const ref of manifest.documents) {
    const content = files[ref.path]!;
    if ((await sha256(content)) !== ref.sha256)
      throw new Error("Snapshot document digest mismatch");
    const doc = parseDocument(content);
    if (
      ["claim", "relation", "rule"].includes(doc.kind) &&
      doc.record.review_status !== "Reviewed"
    )
      throw new Error("Snapshot assertion is not reviewed");
    documents.push(doc);
  }
  validateReferences(documents, at);
  return documents;
}
