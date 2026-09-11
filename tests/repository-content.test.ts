// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { decodeRepositoryText } from "../tools/repository-content.ts";

test("binary repository content is not decoded as policy text", () => {
  const webpLike = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0, 0x57, 0x45, 0x42, 0x50,
  ]);
  assert.equal(decodeRepositoryText(webpLike), null);
});

test("repository text remains strict UTF-8 input", () => {
  assert.equal(
    decodeRepositoryText(Buffer.from("alpha\nbeta\n", "utf8")),
    "alpha\nbeta\n",
  );
  assert.throws(() => decodeRepositoryText(Buffer.from([0xff, 0xfe, 0xfd])));
});
