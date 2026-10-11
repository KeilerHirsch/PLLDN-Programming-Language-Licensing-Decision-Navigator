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

    const heroStats = document.querySelector(".product-stats")?.textContent ?? "";
    for (const expected of [
      "194 language identities",
      "714 license identities",
      "35 detailed languages",
      "32 detailed licenses",
      "345 Preview facts",
    ]) {
      assert(heroStats.includes(expected), "hero count mismatch: " + expected);
    }

    const inventory = document.querySelector("#evidence-inventory");
    assert(
      inventory?.querySelector("summary")?.textContent.includes("345 recorded Preview claims"),
      "inventory must count recorded Preview facts without promotion",
    );
    inventory.open = true;
    const invLanguages = inventory.querySelector('[data-inventory-kind="languages"]');
    const invLicenses = inventory.querySelector('[data-inventory-kind="licenses"]');
    assert(
      invLanguages?.textContent.includes("with recorded references") &&
      invLicenses?.textContent.includes("without recorded references") &&
      inventory.textContent.includes("not independently verified claims"),
      "source inventory must distinguish presence of links from verification",
    );

    action("select-use-case", "use-case-id", "web-backend").click();
    await waitFor(() => document.querySelectorAll(".shortlist-card").length >= 5, "use-case shortlist");

    assert(
      document.querySelectorAll("[data-action=select-use-case]").length === 30,
      "all thirty editorial guides must be available",
    );
    const moreGuides = document.querySelector("[data-use-case-more]");
    assert(moreGuides && !moreGuides.open, "extra task cards start collapsed");
    moreGuides.open = true;
    action("select-use-case", "use-case-id", "game-engine").click();
    await waitFor(
      () => document.querySelector(".use-case-result h3")?.textContent ===
        "Game or simulation engine" && document.querySelector("[data-use-case-more]").open,
      "additional use-case selection remains visible",
    );
    action("select-use-case", "use-case-id", "web-backend").click();
    await waitFor(() => document.querySelectorAll(".shortlist-card").length >= 5, "return to web backend");

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
    const evidence = [...document.querySelectorAll("#compare [data-compare-evidence]")];
    assert(evidence.length === 36, "nine dimensions times four languages require source drilldowns");
    assert(
      evidence.every((entry) => entry.querySelector("code")?.textContent &&
        entry.querySelector("summary")?.textContent?.includes("Preview evidence")),
      "every Preview comparison cell must identify its recorded claim and review status",
    );
    assert(
      evidence.flatMap((entry) => [...entry.querySelectorAll("a")])
        .every((link) => link.href.startsWith("https://") &&
          link.rel.includes("noopener") && link.rel.includes("noreferrer")),
      "source drilldowns must use validated HTTPS links",
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

    assert(
      document.querySelector("#compare [data-action=export-language-compare]")?.textContent ===
        "Export selected comparison (CSV)",
      "language comparison must expose a real CSV download control",
    );
    assert(
      document.querySelector("#compare .compare-table tbody tr")?.querySelectorAll("td").length === 3,
      "language comparison must still render after removal",
    );

    const search = document.querySelector('[data-action="catalog-search"]');
    const languageIndex = document.querySelector("[data-identity-index]");
    languageIndex.open = true;
    assert(
      document.querySelectorAll("[data-identity-entry]:not([hidden])").length === 60,
      "identity catalogue should show one initial page of 60",
    );
    action("identity-more", "identity-more", "true").click();
    assert(
      document.querySelectorAll("[data-identity-entry]:not([hidden])").length === 120,
      "show-more must reveal the next 60, not recalculate assessments",
    );
    assert(
      document.querySelectorAll("[data-identity-entry]").length > 65,
      "expanded language identities should exist without being rated",
    );
    search.value = "agda";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    assert(
      document.querySelector("[data-catalog-visible-count]").textContent.includes("0 languages shown"),
      "unassessed language search should not invent profiled matches",
    );
    assert(
      document.querySelector("[data-identity-index]").open &&
      Array.from(document.querySelectorAll("[data-identity-entry]:not([hidden])"))
        .some((entry) =>
          entry.querySelector("span")?.textContent === "Agda" &&
          entry.querySelector(".identity-profile")?.dataset.candidateId ===
            "candidate.language.61676461" &&
          entry.textContent?.includes("UNKNOWN"),
        ),
      "identity search must expose Agda with a pinned unassessed profile",
    );
    assert(
      document.querySelector("[data-catalog-search-empty]").hidden,
      "an identity-only match is still a real search result",
    );
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

    const compareLicenses = [
      "license.mit",
      "license.apache-2.0",
      "license.gpl-3.0-only",
      "license.polyform-noncommercial-1.0.0",
    ];
    for (let i = 0; i < compareLicenses.length; i += 1) {
      const control = action("toggle-license-compare", "entity-id", compareLicenses[i]);
      assert(control && !control.disabled, "missing license comparison control");
      control.click();
      await waitFor(
        () => document.querySelector("#compare-licenses h2")?.textContent.includes("(" + (i + 1) + "/4)"),
        "license comparison step " + (i + 1),
      );
    }
    assert(
      document.querySelectorAll("#compare-licenses .compare-table thead th").length === 5,
      "four license columns required",
    );
    assert(
      document.querySelector("#compare-licenses [data-action=export-license-compare]")?.textContent ===
        "Export selected comparison (CSV)",
      "selected license comparison must expose a CSV download action",
    );
    const rows = Array.from(document.querySelectorAll("#compare-licenses .compare-table tbody tr"));
    const licensedEvidence = [...document.querySelectorAll("#compare-licenses [data-compare-evidence]")];
    assert(licensedEvidence.length > 0,
      "selected detailed licenses must offer source-linked Preview claim inspection");
    assert(
      licensedEvidence.every((details) =>
        details.querySelector("code")?.textContent &&
        details.querySelector("summary")?.textContent?.includes("Preview evidence")),
      "all recorded license comparison claims must expose IDs and review statuses",
    );
    assert(
      licensedEvidence.flatMap((details) => [...details.querySelectorAll("a")])
        .every((link) => link.href.startsWith("https://") &&
          link.rel.includes("noopener") && link.rel.includes("noreferrer")),
      "license evidence links must be trusted HTTPS references",
    );
    const saas = rows.find((row) => row.querySelector("th")?.textContent === "SaaS / hosting");
    assert(saas && saas.querySelectorAll("td").length === 4,
      "comparison must present sourced hosting rights");
    assert(
      document.querySelectorAll("#compare-licenses .compare-table thead a").length === 4 &&
        Array.from(document.querySelectorAll("#compare-licenses .compare-table thead a"))
          .every((link) => link.href.startsWith("https://") && link.textContent === "Canonical terms"),
      "comparison canonical terms links missing",
    );
    assert(
      action("toggle-license-compare", "entity-id", "license.bsd-3-clause").disabled,
      "fifth license must be disabled",
    );
    action("toggle-license-compare", "entity-id", "license.mit").click();
    await waitFor(
      () => document.querySelector("#compare-licenses h2")?.textContent.includes("(3/4)"),
      "license comparison removal",
    );
    assert(
      !action("toggle-license-compare", "entity-id", "license.bsd-3-clause").disabled,
      "removing license must free a comparison slot",
    );

    const licenseIndex = document.querySelector("[data-identity-index]");
    licenseIndex.open = true;
    assert(
      document.querySelectorAll("[data-identity-entry]").length === 682 &&
      document.querySelectorAll("[data-identity-entry]:not([hidden])").length === 60,
      "active SPDX identities must paginate independently of detailed profiles",
    );
    const osiFilter = document.querySelector('[data-action="identity-osi"]');
    osiFilter.value = "yes";
    osiFilter.dispatchEvent(new Event("change", { bubbles: true }));
    assert(
      document.querySelector("[data-identity-count]").textContent.includes("of 121") &&
      Array.from(document.querySelectorAll("[data-identity-entry]:not([hidden])"))
        .every((entry) => entry.dataset.identityOsiApproved === "true"),
      "OSI filter must use pinned SPDX flags, not invented license analysis",
    );
    osiFilter.value = "no";
    osiFilter.dispatchEvent(new Event("change", { bubbles: true }));
    assert(
      document.querySelector("[data-identity-count]").textContent.includes("of 561"),
      "non-OSI-flagged SPDX entries must remain discoverable",
    );
    osiFilter.value = "any";
    osiFilter.dispatchEvent(new Event("change", { bubbles: true }));

    const licenseSearch = document.querySelector('[data-action="catalog-search"]');
    licenseSearch.value = "Artistic-2.0";
    licenseSearch.dispatchEvent(new Event("input", { bubbles: true }));
    assert(
      document.querySelector("[data-identity-index]").open &&
      Array.from(document.querySelectorAll("[data-identity-entry]:not([hidden]) a"))
        .some((link) => link.textContent === "Artistic-2.0" &&
          link.href === "https://spdx.org/licenses/Artistic-2.0.html"),
      "license identity search must show canonical SPDX link",
    );
    assert(
      Array.from(document.querySelectorAll("[data-identity-entry]:not([hidden])"))
        .some((entry) =>
          entry.querySelector(".identity-profile")?.dataset.candidateId ===
            "candidate.license.artistic-2.0" &&
          entry.textContent?.includes("UNKNOWN") &&
          entry.querySelector(".identity-profile a")?.href ===
            "https://spdx.org/licenses/Artistic-2.0.html",
        ),
      "license detail must preserve UNKNOWN and pinned SPDX provenance",
    );
    licenseSearch.value = "";
    licenseSearch.dispatchEvent(new Event("input", { bubbles: true }));

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
    if (!index?.includes("</body>")) throw new Error("Pages HTML body missing");
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
