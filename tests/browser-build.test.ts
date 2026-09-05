// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildBrowser } from "../tools/build-browser.ts";

async function bytes(dir: string): Promise<Record<string, Buffer>> {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(dir))
        .sort()
        .map(async (name) => [name, await readFile(join(dir, name))]),
    ),
  );
}

test("browser build is deterministic and browser-only", async () => {
  const out = await mkdtemp(join(tmpdir(), "plldn-browser-"));
  try {
    await buildBrowser(out);
    const first = await bytes(out);
    assert.deepEqual(Object.keys(first).sort(), [
      "app.css",
      "app.js",
      "index.html",
    ]);
    const js = first["app.js"]?.toString("utf8") ?? "";
    for (const forbidden of [
      "node:",
      "readFileSync",
      "language.alpha",
      "language.beta",
      "language.gamma",
    ]) {
      assert.equal(js.includes(forbidden), false, forbidden);
    }
    assert.match(first["index.html"]?.toString("utf8") ?? "", /id="app"/);
    assert.match(first["index.html"]?.toString("utf8") ?? "", /app\.js/);

    await buildBrowser(out);
    assert.deepEqual(await bytes(out), first);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
