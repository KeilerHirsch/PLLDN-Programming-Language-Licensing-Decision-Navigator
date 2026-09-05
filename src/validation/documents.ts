// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import formats from "ajv-formats";
import { asObject, parseStrictJson } from "./json.ts";
export const kinds = [
  "project-facts",
  "entity",
  "dimension",
  "source",
  "claim",
  "relation",
  "rule",
  "review",
  "snapshot",
  "decision-trace",
] as const;
const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
});
formats.default(ajv);
export const schemaBytes: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    ["common", ...kinds].map((name) => [
      name,
      readFileSync(
        new URL(`../../schemas/${name}.schema.json`, import.meta.url),
        "utf8",
      ),
    ]),
  ),
);
for (const raw of Object.values(schemaBytes))
  ajv.addSchema(asObject(parseStrictJson(raw)));
/** Validate against repository schemas only; never resolve a network reference. */
export function validateDocument(kind: string, data: unknown): void {
  if (!(kinds as readonly string[]).includes(kind))
    throw new Error("Unsupported document kind");
  const validate = ajv.getSchema(
    `https://plldn.invalid/schemas/${kind}.schema.json`,
  );
  if (!validate?.(data))
    throw new Error(`Invalid ${kind}: ${ajv.errorsText(validate?.errors)}`);
}
const validateTimestamp = ajv.compile({ type: "string", format: "date-time" });
/** Require an offset-bearing RFC3339 instant before using the host clock parser. */
export function evaluationTime(at: string): number {
  if (!validateTimestamp(at) || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(at))
    throw new Error("Explicit valid evaluation time required");
  const time = Date.parse(at);
  if (!Number.isFinite(time)) throw new Error("Unsupported evaluation time");
  return time;
}
export interface Document {
  kind: string;
  record: Record<string, unknown>;
}
/** Reject wrapper extensions so candidate input cannot carry trust metadata. */
export function parseDocument(raw: string): Document {
  const wrapper = asObject(parseStrictJson(raw));
  if (
    Object.keys(wrapper).sort().join(",") !== "kind,record" ||
    typeof wrapper.kind !== "string"
  )
    throw new Error("Invalid document envelope");
  validateDocument(wrapper.kind, wrapper.record);
  return { kind: wrapper.kind, record: asObject(wrapper.record) };
}
