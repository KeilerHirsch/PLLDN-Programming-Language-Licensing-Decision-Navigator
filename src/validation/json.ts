// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { visit } from "jsonc-parser";

const MAX_BYTES = 1_048_576;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);
function checkString(value: string): void {
  if (
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
      value,
    )
  )
    throw new Error("Unpaired Unicode surrogate");
}
/** Parse bounded strict JSON without duplicate keys or unsafe numeric values. */
export function parseStrictJson(raw: string): unknown {
  if (new TextEncoder().encode(raw).length > MAX_BYTES)
    throw new Error("JSON exceeds byte limit");
  const objects: Set<string>[] = [];
  let depth = 0;
  const begin = () => {
    if (++depth > 64) throw new Error("JSON exceeds depth limit");
  };
  visit(
    raw,
    {
      onObjectBegin() {
        begin();
        objects.push(new Set());
      },
      onObjectProperty(key) {
        checkString(key);
        const keys = objects.at(-1);
        if (!keys || keys.has(key) || unsafeKeys.has(key))
          throw new Error("Duplicate or unsafe JSON key");
        keys.add(key);
      },
      onObjectEnd() {
        objects.pop();
        depth--;
      },
      onArrayBegin: begin,
      onArrayEnd() {
        depth--;
      },
      onLiteralValue(value: unknown) {
        if (
          typeof value === "number" &&
          (!Number.isFinite(value) ||
            (Number.isInteger(value) && !Number.isSafeInteger(value)))
        )
          throw new Error("Unsafe JSON number");
        if (typeof value === "string") checkString(value);
      },
      onError() {
        throw new Error("Invalid strict JSON");
      },
    },
    {
      disallowComments: true,
      allowTrailingComma: false,
      allowEmptyContent: false,
    },
  );
  return JSON.parse(raw) as unknown;
}
/** Narrow a checked object without silently accepting null or arrays. */
export function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Object required");
  return value as Record<string, unknown>;
}
