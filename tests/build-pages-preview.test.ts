// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildPages } from "../tools/build-pages.ts";

test("Pages build embeds Preview catalog beside the approved Reviewed runtime", async () => {
  const out = await mkdtemp(join(tmpdir(), "plldn-pages-preview-"));
  try {
    await buildPages(out);
    const [runtime, html] = await Promise.all([
      readFile(join(out, "runtime.js"), "utf8"),
      readFile(join(out, "index.html"), "utf8"),
    ]);
    assert(runtime.includes('"catalogPreview"'));
    assert(
      runtime.includes("candidate.language-license-catalog.2026-10-03"),
    );
    assert(runtime.includes("language.rust"));
    assert(
      runtime.includes(
        "a1e9533605e402339b0b473076cce68cdf60e758455831b891fbdda16473d4ec",
      ),
    );
    assert(html.indexOf("./runtime.js") < html.indexOf("./app.js"));
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
