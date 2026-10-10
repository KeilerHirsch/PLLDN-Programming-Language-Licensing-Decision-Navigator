// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { buildPages } from "./build-pages.ts";

const execFileAsync = promisify(execFile);

// Deliberately executed by a real Chromium engine, not by a DOM mock.
// This probe is served only on loopback and is never included in Pages output.
const smokeProbe = `
(async () => {
  const output = document.createElement("output");
  output.id = "browser-smoke-result";
  document.body.append(output);

  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function waitFor(predicate, label) {
    for (let i = 0; i < 100; i += 1) {
      if (predicate()) return;
      await sleep(50);
    }
    throw new Error("Timed out: " + label);
  }
  const action = (name, field, value) =>
    document.querySelector('[data-action="' + name + '"][data-' + field + '="' + value + '"]');

  try {
    await waitFor(
      () => document.querySelector(".product-experience") &&
        document.querySelector("[data-catalog-visible-count]").textContent.includes("35 languages shown"),
      "trusted Pages runtime and language catalogue",
    );

    action("select-use-case", "use-case-id", "web-backend").click();
    await waitFor(() => document.querySelectorAll(".shortlist-card").length >= 5, "use-case shortlist");

    const ids = ["language.go", "language.typescript", "language.python", "language.elixir"];
    for (let i = 0; i < ids.length; i += 1) {
      const control = action("toggle-compare", "entity-id", ids[i]);
      assert(control && !control.disabled, "compare control must be available: " + ids[i]);
      control.click();
      await waitFor(
        () => document.querySelector("#compare h2").textContent.includes("(" + (i + 1) + "/4)"),
        "comparison update " + (i + 1),
      );
    }
    assert(
      action("toggle-compare", "entity-id", "language.java").disabled,
      "fifth language must visibly be disabled at the comparison limit",
    );
    assert(
      document.querySelectorAll(".compare-table thead th").length === 5,
      "comparison table must have four language columns",
    );
    action("toggle-compare", "entity-id", "language.go").click();
    await waitFor(
      () => document.querySelector("#compare h2").textContent.includes("(3/4)"),
      "comparison removal",
    );
    assert(
      !action("toggle-compare", "entity-id", "language.java").disabled,
      "removing a language must re-enable the fifth candidate",
    );

    const search = document.querySelector('[data-action="catalog-search"]');
    search.value = "plldn-no-match-zzxyy";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    assert(
      document.querySelector("[data-catalog-visible-count]").textContent.includes("0 languages shown"),
      "zero-match language count",
    );
    assert(
      !document.querySelector("[data-catalog-search-empty]").hidden,
      "a search with zero matches must explain the empty state",
    );
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    assert(
      document.querySelector("[data-catalog-search-empty]").hidden,
      "clearing a search must hide the empty state",
    );
    assert(
      document.querySelector("[data-catalog-visible-count]").textContent.includes("35 languages shown"),
      "clearing a search must restore all languages",
    );

    action("catalog-mode", "mode", "licenses").click();
    await waitFor(
      () => document.querySelector("#catalog h2").textContent === "License navigator" &&
        document.querySelector("[data-catalog-visible-count]").textContent.includes("32 licenses shown"),
      "switching to license mode",
    );

    const filter = action("product-filter", "filter-key", "licenseModel");
    assert(filter && !filter.disabled, "license-model filter must exist");
    filter.value = "source-available";
    filter.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(
      () => {
        const count = document.querySelectorAll("#catalog [data-catalog-entry]").length;
        return count > 0 && count < 32;
      },
      "structured license filter",
    );
    const filtered = document.querySelectorAll("#catalog [data-catalog-entry]").length;
    assert(
      document.querySelector("[data-catalog-visible-count]").textContent.includes(filtered + " licenses shown"),
      "license result counter must reflect the structured filter",
    );

    if (window.innerWidth <= 760) {
      assert(
        document.documentElement.scrollWidth <= window.innerWidth + 2,
        "mobile page must not overflow horizontally (viewport " + window.innerWidth +
          ", document " + document.documentElement.scrollWidth + ", suspected: " +
          Array.from(document.querySelectorAll("body *"))
            .filter((element) =>
              element.scrollWidth > element.clientWidth + 3 &&
              getComputedStyle(element).overflowX === "visible"
            )
            .slice(0, 8)
            .map((element) => element.tagName + "." + element.className)
            .join(", ") + ")",
      );
    }

    output.textContent = "PASS: runtime, use case, compare limit, search, licenses, filters, layout";
  } catch (error) {
    output.textContent = "FAIL: " + (error instanceof Error ? error.stack : String(error));
  }
})();
`;

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "plldn-browser-smoke-"));
  const browser = process.env.CHROME_BIN ?? "google-chrome";
  let server: ReturnType<typeof createServer> | null = null;
  try {
    await buildPages(root);
    const allowed = ["index.html", "runtime.js", "app.js", "app.css"];
    const files = new Map<string, Buffer>(
      await Promise.all(
        allowed.map(
          async (name) =>
            [`/${name}`, await readFile(join(root, name))] as const,
        ),
      ),
    );
    const index = files.get("/index.html")?.toString("utf8");
    if (!index?.includes("</body>"))
      throw new Error("Pages HTML body missing");
    files.set(
      "/index.html",
      Buffer.from(
        index.replace(
          "</body>",
          '<script src="./browser-smoke.js"></script>\n</body>',
        ),
      ),
    );
    files.set("/browser-smoke.js", Buffer.from(smokeProbe));

    server = createServer((request, response) => {
      const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      const path = pathname === "/" ? "/index.html" : pathname;
      const data = files.get(path);
      if (!data) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const type = path.endsWith(".js")
        ? "text/javascript"
        : path.endsWith(".css")
          ? "text/css"
          : "text/html";
      response.writeHead(200, {
        "Content-Type": `${type}; charset=utf-8`,
        "Cache-Control": "no-store",
      });
      response.end(data);
    });
    await new Promise<void>((resolve, reject) => {
      server?.once("error", reject);
      server?.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Loopback server address unavailable");

    for (const width of [1280, 390]) {
      const { stdout, stderr } = await execFileAsync(
        browser,
        [
          "--headless=new",
          "--no-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-background-networking",
          "--no-first-run",
          "--force-device-scale-factor=1",
          `--window-size=${width},844`,
          "--virtual-time-budget=20000",
          "--dump-dom",
          `http://127.0.0.1:${address.port}/index.html`,
        ],
        { timeout: 60000, maxBuffer: 16 * 1024 * 1024 },
      );
      const mark = stdout.match(
        /<output id="browser-smoke-result">([^<]*)<\/output>/u,
      )?.[1];
      if (!mark?.startsWith("PASS:")) {
        throw new Error(
          `Chromium ${width}px smoke failed: ${mark ?? "missing result marker"}\nBrowser stderr: ${stderr.slice(-2000)}`,
        );
      }
      process.stdout.write(`Chromium ${width}px: ${mark}\n`);
    }
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await rm(root, { recursive: true, force: true });
  }
}

await main();
