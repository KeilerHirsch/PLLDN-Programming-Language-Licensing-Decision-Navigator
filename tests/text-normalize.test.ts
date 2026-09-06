// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeText } from "../src/text/normalize.ts";

test("normalization applies NFKC and locale-independent lowercase", () => {
  const normalized = normalizeText("ＭＵＳＴ ﬃ TypPrüfung");
  assert.deepEqual(
    normalized.tokens.map((token) => token.value),
    ["must", "ffi", "typprüfung"],
  );
});

test("tokenization uses Unicode letters and numbers across punctuation", () => {
  const normalized = normalizeText("GC-required; Rust/2026 — Größe42");
  assert.deepEqual(
    normalized.tokens.map((token) => token.value),
    ["gc", "required", "rust", "2026", "größe42"],
  );
});

test("tokens preserve exact original UTF-16 source spans", () => {
  const input = "  MUST—GC  ";
  const normalized = normalizeText(input);
  assert.deepEqual(normalized.tokens, [
    { value: "must", start: 2, end: 6 },
    { value: "gc", start: 7, end: 9 },
  ]);
  for (const token of normalized.tokens) {
    assert.equal(input.slice(token.start, token.end).length > 0, true);
  }
});

test("combining marks normalize while retaining the whole original span", () => {
  const input = "Cafe\u0301";
  const normalized = normalizeText(input);
  assert.deepEqual(normalized.tokens, [
    { value: "café", start: 0, end: input.length },
  ]);
  assert.equal(input.slice(0, normalized.tokens[0]?.end), input);
});

test("empty input is valid abstention input", () => {
  assert.deepEqual(normalizeText(""), { original: "", tokens: [] });
});

test("16 KiB UTF-8 boundary is accepted and overflow fails closed", () => {
  const atLimit = "a".repeat(16 * 1024);
  assert.equal(normalizeText(atLimit).tokens.length, 1);
  assert.throws(() => normalizeText(`${atLimit}a`), /16 kib|limit|bytes/i);
});

test("unpaired Unicode surrogates fail closed", () => {
  assert.throws(() => normalizeText("bad\uD800text"), /unicode|surrogate/i);
});
