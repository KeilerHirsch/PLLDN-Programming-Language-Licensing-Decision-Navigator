// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildPages } from "../tools/build-pages.ts";

const SOURCE_SHA =
  "a363cca90f1730910cbb617edb029646fdfde9e8e44f7abbc0a879f9a6c763d5";
const RUNTIME_SHA =
  "a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec";

const allowedUrlHosts = new Set([
  "doc.rust-lang.org",
  "gist.github.com",
  "github.com",
  "go.dev",
  "json-schema.org",
  "mathiasbynens.be",
  "plldn.invalid",
  "raw.githubusercontent.com",
  "spec.openapis.org",
  "stackoverflow.com",
  "tools.ietf.org",
  "www.safaribooksonline.com",
  "www.typescriptlang.org",
  "www.w3.org",
]);
async function withSite(
  run: (runtime: string, app: string, combined: string) => Promise<void> | void,
): Promise<void> {
  const out = await mkdtemp(join(tmpdir(), "plldn-pages-security-"));
  try {
    await buildPages(out);
    const runtime = await readFile(join(out, "runtime.js"), "utf8");
    const app = await readFile(join(out, "app.js"), "utf8");
    await run(runtime, app, `${runtime}\n${app}`);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
}

test("generated Pages bytes contain no dynamic-code, network or credential surface", async () => {
  await withSite((_runtime, _app, combined) => {
    for (const forbidden of [
      "ghp_",
      "github_pat_",
      "C:\\\\Users\\\\",
      "eval(",
      "new Function",
      "fetch(",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
    ])
      assert.equal(combined.includes(forbidden), false, forbidden);
  });
});
test("Pages runtime exposes only the runtime approval digest", async () => {
  await withSite((runtime, _app, combined) => {
    assert.match(runtime, /new Date\(\)\.toISOString\(\)/);
    assert.equal(combined.includes(SOURCE_SHA), false);
    assert.equal(runtime.includes(RUNTIME_SHA), true);
  });
});

test("generated external URL literals stay inside the reviewed static host set", async () => {
  await withSite((_runtime, _app, combined) => {
    const urls = combined.match(/https?:\/\/[^"'`\\\s)]+/g) ?? [];
    assert(urls.length > 0);
    for (const literal of urls) {
      const normalized = literal.replace(/[#,;]+$/u, "");
      const host = new URL(normalized).hostname;
      assert(
        allowedUrlHosts.has(host),
        `Unexpected external URL host: ${host}`,
      );
    }
  });
});

test("repository policy requires the complete Pages trust pipeline", async () => {
  const policy = await readFile("tools/repository.ts", "utf8");
  for (const required of [
    "deployments/github-pages/runtime-profile.json",
    "deployments/github-pages/runtime-profile.schema.json",
    "tools/pages-profile.ts",
    "tools/pages-runtime.ts",
    "tools/build-pages.ts",
  ])
    assert(policy.includes(required), `Repository policy missing ${required}`);
});
