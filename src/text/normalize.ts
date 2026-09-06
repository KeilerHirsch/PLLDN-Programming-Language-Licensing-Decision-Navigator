// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { NormalizedText, NormalizedToken } from "./types.ts";

const MAX_INPUT_BYTES = 16 * 1024;
const letterOrNumber = /[\p{L}\p{N}]/u;
const mark = /\p{M}/u;
const unpairedSurrogate =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

interface SourceCluster {
  text: string;
  start: number;
  end: number;
}

function readCodePoint(input: string, start: number): SourceCluster {
  const point = input.codePointAt(start);
  if (point === undefined) throw new Error("Unicode code point required");
  const text = String.fromCodePoint(point);
  return { text, start, end: start + text.length };
}

function nextCluster(input: string, start: number): SourceCluster {
  const first = readCodePoint(input, start);
  let text = first.text;
  let end = first.end;
  while (end < input.length) {
    const next = readCodePoint(input, end);
    if (!mark.test(next.text)) break;
    text += next.text;
    end = next.end;
  }
  return { text, start, end };
}

export function normalizeText(input: string): NormalizedText {
  if (unpairedSurrogate.test(input)) {
    throw new Error("Invalid Unicode surrogate in text input");
  }
  if (new TextEncoder().encode(input).length > MAX_INPUT_BYTES) {
    throw new Error("Text input exceeds 16 KiB UTF-8 limit");
  }

  const tokens: NormalizedToken[] = [];
  let value = "";
  let tokenStart = -1;
  let tokenEnd = -1;

  const flush = () => {
    if (!value) return;
    tokens.push({ value, start: tokenStart, end: tokenEnd });
    value = "";
    tokenStart = -1;
    tokenEnd = -1;
  };

  let offset = 0;
  while (offset < input.length) {
    const cluster = nextCluster(input, offset);
    const normalized = cluster.text.normalize("NFKC").toLowerCase();
    for (const character of normalized) {
      if (letterOrNumber.test(character)) {
        if (!value) tokenStart = cluster.start;
        value += character;
        tokenEnd = cluster.end;
      } else {
        flush();
      }
    }
    offset = cluster.end;
  }
  flush();

  return { original: input, tokens };
}
