// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { Operator, Truth, TypedValue } from "./types.ts";

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}
export function equalValue(a: TypedValue, b: TypedValue): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "set" && b.type === "set") return sameSet(a.value, b.value);
  if (a.type === "quantity" && b.type === "quantity")
    return a.unit === b.unit && a.value === b.value;
  return a.value === b.value;
}
function numericCompare(
  actual: TypedValue,
  expected: TypedValue,
  operator: "GTE" | "LTE",
): boolean {
  if (actual.type === "integer" && expected.type === "integer")
    return operator === "GTE"
      ? actual.value >= expected.value
      : actual.value <= expected.value;
  if (
    actual.type === "quantity" &&
    expected.type === "quantity" &&
    actual.unit === expected.unit
  )
    return operator === "GTE"
      ? actual.value >= expected.value
      : actual.value <= expected.value;
  throw new Error("Ordered comparison requires compatible numeric values");
}
export function compareValue(
  actual: TypedValue,
  operator: Operator,
  expected: TypedValue,
): boolean {
  if (operator === "EQ") return equalValue(actual, expected);
  if (operator === "NEQ") return !equalValue(actual, expected);
  if (operator === "GTE" || operator === "LTE")
    return numericCompare(actual, expected, operator);
  if (operator === "IN") {
    if (actual.type !== "set" || expected.type !== "set")
      throw new Error("IN comparison requires set values");
    const available = new Set(actual.value);
    return expected.value.every((value) => available.has(value));
  }
  throw new Error("Unsupported comparison operator");
}

export function assertionTruth(
  state: string,
  value: TypedValue | undefined,
  operator: Operator,
  expected: TypedValue,
): Truth {
  if (state === "UNKNOWN") return "UNKNOWN";
  if (state === "NOT_APPLICABLE") return "FALSE";
  if (state === "CONDITIONAL") return "UNKNOWN";
  if (value === undefined)
    throw new Error("Resolved assertion requires a value");
  if (state === "TRUE")
    return compareValue(value, operator, expected) ? "TRUE" : "FALSE";
  if (state !== "FALSE") throw new Error("Unsupported assertion state");
  if (value.type === "boolean") {
    const actual: TypedValue = { type: "boolean", value: !value.value };
    return compareValue(actual, operator, expected) ? "TRUE" : "FALSE";
  }
  if (operator === "EQ" && equalValue(value, expected)) return "FALSE";
  if (operator === "NEQ" && equalValue(value, expected)) return "TRUE";
  return "UNKNOWN";
}

export function typedValue(value: unknown): TypedValue {
  return value as TypedValue;
}
