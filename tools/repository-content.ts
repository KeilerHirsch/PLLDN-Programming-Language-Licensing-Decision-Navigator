// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { TextDecoder } from "node:util";

const utf8 = new TextDecoder("utf-8", { fatal: true });

export function decodeRepositoryText(bytes: Uint8Array): string | null {
  if (bytes.includes(0)) return null;
  return utf8.decode(bytes);
}
