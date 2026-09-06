// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildBrowser } from "../tools/build-browser.ts";
import { buildPages, serializePagesRuntime } from "../tools/build-pages.ts";

async function treeBytes(dir: string): Promise<Record<string, Buffer>> {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(dir))
        .sort()
        .map(async (name) => [name, await readFile(join(dir, name))]),
    ),
  );
}

const expectedPages = ["app.css", "app.js", "index.html", "runtime.js"];
const expectedBrowser = ["app.css", "app.js", "index.html"];
test("Pages build is deterministic and injects runtime before the app", async () => {
  const first = await mkdtemp(join(tmpdir(), "plldn-pages-a-"));
  const second = await mkdtemp(join(tmpdir(), "plldn-pages-b-"));
  const sourceHtml = await readFile(
    new URL("../web/index.html", import.meta.url),
    "utf8",
  );
  try {
    await buildPages(first);
    await buildPages(second);
    assert.deepEqual((await readdir(first)).sort(), expectedPages);
    assert.deepEqual(await treeBytes(first), await treeBytes(second));
    const html = await readFile(join(first, "index.html"), "utf8");
    assert(html.indexOf("runtime.js") >= 0);
    assert(html.indexOf("runtime.js") < html.indexOf("app.js"));
    assert.equal(
      await readFile(new URL("../web/index.html", import.meta.url), "utf8"),
      sourceHtml,
    );
    assert.equal(sourceHtml.includes("runtime.js"), false);
  } finally {
    await rm(first, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
  }
});
test("ordinary browser build remains untrusted and unchanged", async () => {
  const out = await mkdtemp(join(tmpdir(), "plldn-browser-control-"));
  try {
    await buildBrowser(out);
    assert.deepEqual((await readdir(out)).sort(), expectedBrowser);
    const html = await readFile(join(out, "index.html"), "utf8");
    const js = await readFile(join(out, "app.js"), "utf8");
    assert.equal(html.includes("runtime.js"), false);
    assert.equal(
      js.includes(
        "a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec",
      ),
      false,
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("runtime serializer rejects executable or ambiguous data strings", () => {
  for (const bad of [
    "</script><script>alert(1)</script>",
    "x\u2028y",
    "x\u2029y",
  ]) {
    assert.throws(
      () => serializePagesRuntime({ value: bad }),
      /runtime data/i,
      bad,
    );
  }
});
test("runtime serializer rejects non-JSON values and objects", () => {
  for (const bad of [
    { value: undefined },
    { value: () => "x" },
    { value: Symbol("x") },
    { value: 1n },
    { value: new Date("2026-09-06T00:00:00Z") },
  ]) {
    assert.throws(() => serializePagesRuntime(bad), /runtime data/i);
  }
});

test("runtime serializer adds only the page-load evaluation clock", () => {
  const script = serializePagesRuntime({ value: "safe" });
  assert.match(script, /^window\.PLLDN_RUNTIME=/);
  assert.match(script, /new Date\(\)\.toISOString\(\);\n$/);
  assert.equal(script.includes("eval("), false);
  assert.equal(script.includes("new Function"), false);
});
test("package exposes the deployment-only Pages build command", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as { scripts: Record<string, string> };
  assert.equal(pkg.scripts["build:pages"], "node tools/build-pages.ts");
});
