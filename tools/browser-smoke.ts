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


  async function checkProfileHistory(kind, id) {
    const view = document.querySelector('[data-action="catalog-view"]');
    view.value = "list";
    view.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(() => document.querySelector(".catalog-view-list"), "changed profile view");
    window.history.back();
    await waitFor(() => new URLSearchParams(window.location.search).get(kind) === id &&
      document.querySelector(".catalog-view-cards"), "Back restores detailed profile route");
    const selected = kind === "candidate"
      ? [...document.querySelectorAll(".identity-profile")].find(el => el.dataset.candidateId === id && el.open)?.closest("[data-catalog-entry]")
      : [...document.querySelectorAll("[data-catalog-entry]")].find(el => el.dataset.entityId === id);
    assert(selected && !selected.hidden, "Back must reveal the original pinned profile");
    window.history.forward();
    await waitFor(() => !new URLSearchParams(window.location.search).has(kind) &&
      document.querySelector(".catalog-view-list"), "Forward restores changed view");
  }

  try {

    if (new URLSearchParams(window.location.search).get("probe") === "reader") {
      await waitFor(() => document.querySelectorAll(".language-reader-profile").length === 194, "complete reader corpus");
      let cards = [...document.querySelectorAll("[data-catalog-entry]")];
      const scenario = document.querySelector('#project-worksheet [data-action="worksheet-answer"][data-worksheet-key="hosting"]');
      assert(scenario && document.querySelector('#project-worksheet [data-action="export-worksheet"]'), "project license worksheet is available");
      scenario.value = "yes";
      scenario.dispatchEvent(new Event("change", { bubbles: true }));
      await waitFor(() => new URLSearchParams(location.search).get("ws_hosting") === "yes" &&
        document.querySelector("#project-worksheet h3")?.textContent.includes("UNKNOWN") &&
        document.querySelector('#project-worksheet [data-worksheet-key="hosting"]') !== scenario, "scenario URL and abstention");
      assert(document.querySelector(".worksheet-filter-trace")?.textContent.includes("licenseSaas=yes"),
        "the applied Preview filter must be visibly disclosed, without a legal verdict");
      assert(document.querySelector('#project-worksheet .worksheet-primary-sources a[href="https://www.gnu.org/licenses/agpl-3.0.html"]'),
        "SaaS scenario provides scoped primary-source reading link without licensing permission");
      const resetScenario = document.querySelector('#project-worksheet [data-action="worksheet-answer"][data-worksheet-key="hosting"]');
      resetScenario.value = "unspecified";
      resetScenario.dispatchEvent(new Event("change", { bubbles: true }));
      await waitFor(() => !new URLSearchParams(location.search).has("ws_hosting") &&
        document.querySelector('#project-worksheet [data-worksheet-key="hosting"]') !== resetScenario, "scenario reset");
      cards = [...document.querySelectorAll("[data-catalog-entry]")];
      assert(cards.length === 194 && cards.every(card => card.querySelector(".language-reader-brief") &&
        card.querySelectorAll(".language-reader-profile [data-reader-section]").length === 8),
        "editorial and unassessed identities need the same complete reader shape");
      for (const card of cards) {
        for (const section of card.querySelectorAll(".language-reader-profile [data-reader-section]")) {
          assert(section.querySelector(".reader-citation"), "every reader section needs adjacent sources");
        }
      }
      const basicId = "candidate.language.6261736963";
      const basic = cards.find(card => card.dataset.catalogName === "BASIC");
      assert(basic?.dataset.catalogStatus === "unassessed" && !basic.querySelector(".decision-profile"),
        "complete BASIC reader must not inherit an editorial rating");
      const evidence = basic.querySelector(".profile-evidence-overview");
      assert(evidence?.textContent.includes("NOT_REVIEWED") &&
        evidence.querySelector("a[href*='issues/new']")?.href.includes("candidate.language"),
        "pending reader evidence and reviewable public feedback link");
      const basicReader = basic.querySelector(".language-reader-profile");
      basicReader.open = true;
      basicReader.querySelector("summary").focus();
      assert(document.activeElement === basicReader.querySelector("summary"), "reader summary is keyboard focusable");
      assert(basicReader.querySelector("pre code")?.textContent.length > 0,
        "BASIC needs a concrete documented example");
      const status = basicReader.querySelector("[data-reader-example-status]");
      assert(["documented", "executed"].includes(status?.dataset.readerExampleStatus), "example status must be explicit");
      if (status.dataset.readerExampleStatus === "documented")
        assert(status.textContent.includes("not executed"), "documented must not claim execution");

      while (document.querySelectorAll("[data-catalog-entry]:not([hidden])").length < 194) {
        const more = document.querySelector("[data-identity-more]");
        assert(more && !more.hidden, "all comparison controls must be reachable through pagination");
        more.click();
      }

      const toggle = async (id, expected) => {
        const control = document.querySelector('#catalog [data-action="toggle-compare"][data-entity-id="' + id + '"]');
        assert(control && !control.disabled, "canonical comparison button missing " + id);
        control.focus();
        control.click();
        await waitFor(() => document.querySelector("#compare h2")?.textContent.includes("(" + expected + "/4)"), "mixed comparison " + expected);
        assert(document.activeElement?.dataset.entityId === id, "mixed comparison must retain exact button focus");
      };
      await toggle(basicId, 1);
      const saveProfile = () => document.querySelector('#catalog [data-action="toggle-shortlist"][data-entity-id="' + basicId + '"]');
      assert(saveProfile()?.getAttribute("aria-pressed") === "false", "local shortlist starts empty");
      saveProfile().click();
      await waitFor(() => saveProfile()?.getAttribute("aria-pressed") === "true" &&
        document.querySelector("#shortlist a")?.href.includes(encodeURIComponent(basicId)), "local shortlist add");
      document.querySelector('#shortlist [data-action="clear-shortlist"]').click();
      await waitFor(() => document.querySelector("#shortlist h2")?.textContent.includes("(0)") &&
        saveProfile()?.getAttribute("aria-pressed") === "false", "local shortlist clear");
      await toggle("language.rust", 2);
      const differencesControl = () => document.querySelector('#compare [data-action="toggle-compare-differences"]');
      assert(differencesControl()?.getAttribute("aria-pressed") === "false", "differences toggle starts inactive");
      const unresolvedControl = () => document.querySelector('#compare [data-action="toggle-compare-unresolved"]');
      assert(unresolvedControl()?.getAttribute("aria-pressed") === "false", "unresolved-first toggle starts inactive");
      unresolvedControl().click();
      await waitFor(() => unresolvedControl()?.getAttribute("aria-pressed") === "true", "unresolved-first toggle enabled");
      assert(document.querySelector("#compare tbody tr th")?.textContent === "Evidence tier" || document.querySelector("#compare tbody tr th")?.textContent === "Throughput potential", "unresolved-first keeps evidence explicit");
      unresolvedControl().click();
      await waitFor(() => unresolvedControl()?.getAttribute("aria-pressed") === "false", "unresolved-first toggle disabled");
      const fullRowCount = document.querySelectorAll("#compare tbody tr").length;
      differencesControl().click();
      await waitFor(() => differencesControl()?.getAttribute("aria-pressed") === "true", "differences toggle enabled");
      const differenceRows = [...document.querySelectorAll("#compare tbody tr")];
      assert(differenceRows.length < fullRowCount, "only differences must omit equal known rows");
      assert(differenceRows.some(item => item.querySelector("th")?.textContent === "Throughput potential" &&
        item.querySelector("td .compare-row-value")?.textContent === "UNKNOWN"),
        "unassessed values remain visible in differences mode");
      differencesControl().click();
      await waitFor(() => differencesControl()?.getAttribute("aria-pressed") === "false" &&
        document.querySelectorAll("#compare tbody tr").length === fullRowCount,
        "differences toggle restores all comparison rows");
      const rows = [...document.querySelectorAll("#compare tbody tr")];
      for (const label of ["Prerequisites", "Execution workflow", "Example code", "Implementation and runtime licenses"]) {
        const row = rows.find(item => item.querySelector("th")?.textContent === label);
        assert(row?.querySelectorAll("td").length === 2, "mixed reader row missing " + label);
        assert([...row.querySelectorAll("td")].every(cell => cell.textContent.length && cell.querySelector(".compare-reader-sources a")),
          "reader comparison cells must include values and sources");
      }
      for (const label of ["Throughput potential", "Learning curve", "Deployment complexity", "Ecosystem breadth"]) {
        const row = rows.find(item => item.querySelector("th")?.textContent === label);
        assert(row?.querySelector("td .compare-row-value")?.textContent === "UNKNOWN",
          "BASIC rating must remain UNKNOWN in mixed comparison: " + label);
      }
      assert(document.querySelector("#compare [data-action=export-language-compare]"), "mixed CSV action must exist");
      assert(document.querySelector("#compare [data-action=export-language-markdown]"), "sourced Markdown report download must exist");
      assert(document.querySelector("#compare [data-action=copy-language-compare]"), "clipboard report control must exist");
      assert(document.querySelector("#compare [data-action=print-language-compare]"), "browser print control must exist");
      const matrix = document.querySelector("#compare .compare-table-wrap");
      assert(matrix?.getAttribute("tabindex") === "0" && matrix?.getAttribute("role") === "region",
        "scrolling matrix must be accessible by keyboard");
      const glossary = document.querySelector("#glossary");
      assert(glossary?.tagName === "DETAILS" && glossary.querySelector("summary"), "accessible terminology glossary must exist");
      assert(glossary.querySelectorAll("dt").length >= 11, "glossary must explain key evidence and license terms");
      await toggle("language.go", 3);
      await toggle("language.python", 4);
      assert(document.querySelector('#catalog [data-action="toggle-compare"][data-entity-id="language.java"]')?.disabled,
        "mixed catalogue comparison still enforces four distinct identities");
      await toggle(basicId, 3);
      assert(!document.querySelector('#catalog [data-action="toggle-compare"][data-entity-id="language.java"]')?.disabled,
        "removing a pinned identity releases its comparison slot");

      const licenseLink = document.querySelector(".reader-license-catalog");
      assert(licenseLink, "an exact known SPDX component license must link to the catalogue");
      const href = new URL(licenseLink.href);
      assert(href.origin === window.location.origin, "reader license link must be internal");
      window.history.pushState(null, "", href.href);
      window.dispatchEvent(new PopStateEvent("popstate"));
      await waitFor(() => document.querySelector('#catalog h2')?.textContent === "License navigator", "component license navigation");
      const visibleLicenses = [...document.querySelectorAll("[data-catalog-entry]:not([hidden])")];
      const targetProfile = href.searchParams.get("profile"), targetCandidate = href.searchParams.get("candidate");
      assert(visibleLicenses.some(card => card.dataset.entityId === targetProfile ||
        card.querySelector(".identity-profile")?.dataset.candidateId === targetCandidate),
        "license route must resolve its exact canonical identity");
      window.history.back();
      await waitFor(() => document.querySelectorAll(".language-reader-profile").length === 194, "Back restores language reader catalogue");
      const deutsch = document.querySelector('[data-action="set-ui-language"][data-locale="de"]');
      assert(deutsch && deutsch.getAttribute("aria-pressed") === "false", "English is initial UI locale");
      deutsch.click();
      await waitFor(() => new URLSearchParams(location.search).get("lang") === "de" &&
        document.querySelector(".product-hero h1")?.textContent === "Wähle das Fundament vor dem ersten Commit." &&
        document.querySelector('[data-action="set-ui-language"][data-locale="de"]')?.getAttribute("aria-pressed") === "true", "DE locale changes UI and URL only");
      assert(document.querySelector("#project-worksheet h3")?.textContent.includes("UNKNOWN"), "unresolved assessment marker stays unchanged in DE");
      assert(document.querySelector(".language-reader-profile [data-reader-section=fit] h4")?.textContent === "Eignung und Grenzen",
        "reader disclosure headings translate without changing sourced facts");
      document.querySelector('[data-action="set-ui-language"][data-locale="en"]').click();
      await waitFor(() => !new URLSearchParams(location.search).has("lang") &&
        document.querySelector(".product-hero h1")?.textContent === "Choose the foundation before the first commit.", "English locale restored");
      if (window.innerWidth <= 760) assert(document.documentElement.scrollWidth <= window.innerWidth + 2,
        "full reader and mixed comparison must not overflow mobile horizontally");
      output.textContent = "PASS: complete readers, sourced examples, mixed UNKNOWN comparison, limits, license routes and mobile";
      return;
    }

    if (new URLSearchParams(window.location.search).get("probe") === "discovery") {
      await waitFor(() => document.querySelector("[data-catalog-visible-count]")?.textContent.includes("194 languages found"), "language information runtime");
      const cards = [...document.querySelectorAll("[data-catalog-entry]")];
      assert(cards.every(card => card.querySelector(".language-information-summary")?.textContent.length > 40 &&
        card.querySelector(".language-information-uses")?.textContent.length &&
        card.querySelector(".language-information-sources a")?.href.startsWith("https://")),
        "all 194 languages need useful sourced information");
      const basic = cards.find(card => card.dataset.catalogName === "BASIC");
      assert(basic?.textContent.includes("1964") &&
        [...basic.querySelectorAll(".language-information-sources a")].some(link => link.href.includes("dartmouth.edu")) &&
        basic.querySelector(".identity-profile")?.textContent.includes("UNKNOWN"),
        "BASIC needs sourced history while ratings remain UNKNOWN");
      assert(cards.filter(card => card.dataset.catalogStatus === "unassessed").every(card =>
        card.querySelector(".identity-profile")?.textContent.includes("UNKNOWN") &&
        !card.querySelector(".decision-profile")),
        "descriptions never promote candidate assessments");
      const change = async (selector, value, label) => {
        const control = document.querySelector(selector);
        assert(control, label + " control missing");
        control.focus();
        control.value = value;
        control.dispatchEvent(new Event("change", { bubbles: true }));
        await waitFor(() => document.querySelector(selector) !== control &&
          document.querySelector(selector)?.value === value, label);
        assert(document.activeElement === document.querySelector(selector),
          label + " keyboard focus must survive rerender");
      };
      const discovery = key => '[data-action="language-discovery"][data-discovery-key="' + key + '"]';
      const visible = () => [...document.querySelectorAll("[data-catalog-entry]:not([hidden])")];
      await change('[data-action="catalog-order"]', "common", "common ordering");
      assert(visible()[0]?.dataset.catalogName === "TypeScript", "common order uses the named 2025 report");
      await change(discovery("usage"), "ranked", "ranked language filter");
      assert(visible().length === 9 && visible().every(card => Number(card.dataset.languageRank) > 0),
        "only exact catalogue identities from the top-ten report match, never inferred Bash from Shell");
      assert(visible()[0]?.dataset.catalogName === "TypeScript", "ranked language order is deterministic");
      const share = new URL(document.querySelector(".catalog-share").href);
      assert(share.searchParams.get("usage") === "ranked" && share.searchParams.get("order") === "common",
        "discovery sort and usage must be shareable");
      await change(discovery("era"), "classic", "classic era filter");
      assert(visible().length > 0 && visible().every(card => card.dataset.languageEra === "classic"),
        "era intersects usage without introducing assessments");
      window.history.back();
      await waitFor(() => document.querySelector(discovery("era"))?.value === "any" &&
        visible().length === 9, "Back restores usage and era");
      window.history.forward();
      await waitFor(() => document.querySelector(discovery("era"))?.value === "classic" &&
        visible().every(card => card.dataset.languageEra === "classic"), "Forward restores era intersection");
      await change(discovery("usage"), "any", "all usage");
      assert(visible().some(card => card.dataset.catalogName === "BASIC"),
        "BASIC remains discoverable as a classic language");
      await change(discovery("era"), "any", "all eras");
      await change(discovery("lifecycle"), "maintained", "maintained implementation filter");
      assert(visible().length > 0 && visible().every(card => card.dataset.languageLifecycle === "maintained"),
        "lifecycle uses sourced implementation status");
      await change(discovery("lifecycle"), "unknown", "unknown implementation status");
      assert(visible().length > 0 && visible().every(card => card.dataset.languageLifecycle === "unknown"),
        "unverified lifecycle must be explicitly searchable");
      await change(discovery("lifecycle"), "any", "all lifecycle values");
      for (const order of ["oldest", "newest", "lifecycle"]) {
        await change('[data-action="catalog-order"]', order, order + " ordering");
        assert(document.querySelector("[data-catalog-visible-count]").textContent.includes("194 languages found"),
          "sorting never removes identities");
      }
      for (const control of document.querySelectorAll(".catalog-layout > .catalog-filter-grid select, .catalog-layout > .catalog-filter-grid button, .catalog-layout > .catalog-filter-grid a")) {
        control.focus();
        await sleep(50);
        const rect = control.getBoundingClientRect();
        assert(rect.top >= 0 && rect.bottom <= window.innerHeight + 2,
          "focused sidebar control must be reachable: " + (control.dataset.discoveryKey ?? control.textContent) +
          ", top " + rect.top + ", bottom " + rect.bottom + ", height " + window.innerHeight);
      }
      document.querySelector('[data-action="reset-product-filters"]').click();
      await waitFor(() => document.querySelector('[data-action="catalog-order"]')?.value === "asc" &&
        [...document.querySelectorAll('[data-action="language-discovery"]')].every(control => control.value === "any"),
        "reset clears discovery and order");
      await change(discovery("era"), "classic", "classic before switching mode");
      action("catalog-mode", "mode", "licenses").click();
      await waitFor(() => document.querySelector("[data-catalog-visible-count]")?.textContent.includes("714 licenses found"),
        "language discovery resets on license switch");
      const licenseShare = new URL(document.querySelector(".catalog-share").href);
      assert(!document.querySelector('[data-action="language-discovery"]') &&
        ["usage", "era", "lifecycle", "order"].every(key => !licenseShare.searchParams.has(key)),
        "language discovery must not leak into license controls or URLs");
      action("catalog-mode", "mode", "languages").click();
      await waitFor(() => document.querySelector("[data-catalog-visible-count]")?.textContent.includes("194 languages found"),
        "switching back restores all languages");
      if (window.innerWidth <= 760) assert(document.documentElement.scrollWidth <= window.innerWidth + 2,
        "new language information and discovery controls must not overflow mobile");
      output.textContent = "PASS: sourced language information, discovery facets, sorting, history and reset";
      return;
    }
    if (new URLSearchParams(window.location.search).get("probe") === "focus") {
      await waitFor(() => document.querySelector("[data-catalog-visible-count]")?.textContent.includes("194 languages found"), "focus runtime");
      const focusStatus = document.querySelector('[data-action="catalog-status"]');
      focusStatus.value = "editorial";
      focusStatus.dispatchEvent(new Event("change", { bubbles: true }));
      await waitFor(() => document.querySelector("[data-catalog-visible-count]").textContent.includes("35 languages found"), "visible editorial focus targets");
      const guide = action("select-use-case", "use-case-id", "web-backend");
      guide.focus();
      guide.click();
      await waitFor(() => document.querySelector(".use-case-result"), "focused use-case selection");
      assert(document.activeElement?.dataset.useCaseId === "web-backend", "use-case keyboard focus must remain on the chosen guide");
      const selector = '[data-action="toggle-compare"][data-entity-id="language.go"]';
      const catalogButton = document.querySelector("#catalog " + selector);
      catalogButton.focus();
      catalogButton.click();
      await waitFor(() => document.querySelector("#catalog " + selector)?.textContent === "Remove from compare", "catalogue comparison");
      assert(document.activeElement === document.querySelector("#catalog " + selector), "focus must remain on the exact catalogue comparison button");
      const shortlistButton = document.querySelector(".use-case-result " + selector);
      assert(shortlistButton, "duplicate shortlist comparison target must exist");
      shortlistButton.focus();
      shortlistButton.click();
      await waitFor(() => document.querySelector(".use-case-result " + selector)?.textContent === "Add to compare", "shortlist comparison removal");
      assert(document.activeElement === document.querySelector(".use-case-result " + selector), "focus must preserve the shortlist origin for duplicate entity buttons");
      output.textContent = "PASS: stable keyboard focus across use-case and duplicate catalogue controls";
      return;
    }
    const requested = new URLSearchParams(window.location.search).get("candidate");
    if (requested) {
      await waitFor(
        () => [...document.querySelectorAll(".identity-profile")].some(
          (entry) => entry.dataset.candidateId === requested && entry.open
        ),
        "pinned candidate direct link",
      );
      const selected = [...document.querySelectorAll(".identity-profile")]
        .find((entry) => entry.dataset.candidateId === requested);
      assert(selected?.closest("[data-catalog-entry]")?.dataset.catalogStatus === "unassessed",
        "deep link must resolve an unassessed catalogue card");
      assert(!selected?.closest("[data-catalog-entry]")?.hidden,
        "deep link must reveal the requested identity");
      assert(selected?.textContent?.includes("UNKNOWN"),
        "deep link must preserve UNKNOWN assessment boundary");
      const expectedMode = requested.startsWith("candidate.language.") ? "languages" : "licenses";
      assert(
        document.querySelector('[data-action="catalog-mode"][aria-pressed="true"]')?.dataset.mode === expectedMode,
        "deep link must route to the correct catalogue mode",
      );
      assert([...document.querySelectorAll('[data-action="language-discovery"]')].every(control => control.value === "any") &&
        document.querySelector('[data-action="catalog-order"]')?.value === "asc",
        "candidate permalink must reset discovery facets and ordering");
      if (expectedMode === "languages") {
        const reader = selected.closest("[data-catalog-entry]").querySelector(".language-reader-profile");
        assert(reader?.open && document.activeElement === reader.querySelector("summary"),
          "language candidate permalink must open and focus its full reader");
      }
      await checkProfileHistory("candidate", requested);
      if (expectedMode === "languages") {
        window.history.back();
        await waitFor(() => new URLSearchParams(window.location.search).get("candidate") === requested,
          "candidate restored before changing search");
        const search = document.querySelector('[data-action="catalog-search"]');
        search.value = "Rust";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        assert(!new URLSearchParams(window.location.search).has("candidate"),
          "search must release the pinned identity immediately");
        assert([...document.querySelectorAll("[data-catalog-entry]:not([hidden])")]
          .some(card => card.dataset.catalogName === "Rust"),
          "first search input after a permalink must immediately reveal Rust");
      }
      output.textContent = "PASS: pinned candidate permalink and Back/Forward";
      return;
    }
    const linked = new URLSearchParams(window.location.search);
    if(linked.has("profile") || linked.has("catalog")) {
      await waitFor(()=>document.querySelector("[data-catalog-visible-count]")?.textContent.includes("found"),"direct catalogue navigation");
      const visible = [...document.querySelectorAll("[data-catalog-entry]:not([hidden])")];
      if(linked.has("profile")) {
        assert(visible.some(card=>card.dataset.entityId===linked.get("profile")),"editorial permalink must resolve only a real profile");
        assert(document.querySelector(".catalog-view-cards"),"direct profile must reveal the detailed card view");
        assert([...document.querySelectorAll('[data-action="language-discovery"]')].every(control => control.value === "any") &&
          document.querySelector('[data-action="catalog-order"]')?.value === "asc",
          "editorial permalink must reset discovery facets and ordering");
        if (linked.get("profile").startsWith("language.")) {
          const reader = visible.find(card => card.dataset.entityId === linked.get("profile"))?.querySelector(".language-reader-profile");
          assert(reader?.open && document.activeElement === reader.querySelector("summary"),
            "editorial language permalink must open and focus the same full reader");
        }
        await checkProfileHistory("profile", linked.get("profile"));
      } else if (linked.get("usage") === "ranked" && linked.get("order") === "common") {
        assert(visible.length === 9 && visible[0]?.dataset.catalogName === "TypeScript" &&
          visible.every(card => Number(card.dataset.languageRank) > 0),
          "initial shared discovery route must restore ranked common ordering");
        assert(document.querySelector('[data-action="language-discovery"][data-discovery-key="usage"]')?.value === "ranked",
          "initial shared discovery control must reflect the URL");
        const share = new URL(document.querySelector(".catalog-share").href);
        assert(share.searchParams.get("usage") === "ranked" && share.searchParams.get("order") === "common",
          "initial discovery route must remain shareable");
      } else if(linked.has("q")) {
        assert(visible.length===1 && visible[0].dataset.catalogStatus==="unassessed","shared search must restore the real unassessed result");
        const share = new URL(document.querySelector(".catalog-share").href);
        for(const key of ["catalog","q","status","order"]) assert(share.searchParams.get(key)===linked.get(key),"shared state lost "+key);
      } else {
        const expected = linked.get("catalog") === "licenses" ? 714 : 194;
        assert(document.querySelectorAll("[data-catalog-entry]").length===expected,"direct catalogue must contain every pinned identity");
        assert(visible.length>0,"irrelevant mode-specific URL flags must not hide all results");
      }
      output.textContent = "PASS: direct catalogue, profile and shared filter navigation";
      return;
    }
    await waitFor(
      () => document.querySelector(".product-experience") &&
        document.querySelector("[data-catalog-visible-count]").textContent.includes("194 languages found"),
      "trusted Pages runtime and language catalogue",
    );

    assert(document.querySelectorAll("[data-catalog-entry]").length===194 && document.querySelectorAll("[data-identity-entry]").length===159,"all language identities must be first-class results");
    assert(document.querySelectorAll("[data-catalog-grid]").length===1,"one combined result grid");
    const status = document.querySelector('[data-action="catalog-status"]');
    status.value = "editorial";
    status.dispatchEvent(new Event("change",{bubbles:true}));
    await waitFor(()=>document.querySelector("[data-catalog-visible-count]").textContent.includes("35 languages found"),"editorial status filter");
    const heroStats = document.querySelector(".product-stats")?.textContent ?? "";
    for (const expected of [
      "194 language identities",
      "714 license identities",
      "194 reader profiles",
      "35 editorial language previews",
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

    const languageBandBadges = [...document.querySelectorAll(
      '[data-language-band-evidence="unverified"]',
    )];
    assert(
      languageBandBadges.length === 35 &&
        languageBandBadges.every((note) =>
          note.textContent?.includes("not benchmark results")),
      "all Editorial language cards must disclose unverified heuristic bands",
    );

    const workloadEvidence = document.querySelectorAll("[data-workload-evidence]");
    assert(workloadEvidence.length === 1,
      "only the measured JavaScript identity may expose workload observations");
    const workloadDetails = workloadEvidence[0];
    assert(workloadDetails?.tagName === "DETAILS" && !workloadDetails.open,
      "measured workload evidence must be a separate collapsed disclosure");
    workloadDetails.open = true;
    assert(workloadDetails.querySelectorAll("[data-workload-run]").length === 2,
      "exactly two genuine archived runs must be visible without pooling");
    assert(workloadDetails.textContent.includes("19.81 ms") &&
      workloadDetails.textContent.includes("20.70 ms") &&
      workloadDetails.textContent.includes("Different CPU models") &&
      workloadDetails.textContent.includes("not a language ranking") &&
      workloadDetails.textContent.includes("MAD") &&
      workloadDetails.textContent.includes("No confidence interval"),
      "measurement scope, dispersion and unavailable uncertainty must be explicit");
    assert([...workloadDetails.querySelectorAll("a")].every((link) =>
      link.href.startsWith("https://github.com/KeilerHirsch/") &&
      link.rel.includes("noopener") && link.rel.includes("noreferrer")),
      "measured evidence links must remain on the known public repository");
    if (window.innerWidth <= 760) {
      assert(document.documentElement.scrollWidth <= window.innerWidth + 2,
        "expanded measured workload evidence must fit the mobile viewport");
    }

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
      document.querySelector("#compare .compare-table")?.textContent?.includes(
        "Performance / complexity evidence status",
      ) &&
        document.querySelector("#compare .compare-table")?.textContent?.includes(
          "not measured cross-language rankings",
        ),
      "language comparison must preserve the unverified band disclaimer",
    );
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
      evidence.some((entry) =>
        entry.querySelector(".preview-provenance-disclosure")
          ?.textContent?.includes("Internal classification seed only")),
      "language comparison must identify seed-only references rather than primary proof",
    );
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

    const allStatus = document.querySelector('[data-action="catalog-status"]');
    allStatus.focus();
    allStatus.value = "all";
    allStatus.dispatchEvent(new Event("change",{bubbles:true}));
    await waitFor(()=>document.querySelector("[data-catalog-visible-count]").textContent.includes("194 languages found"),"all language identities");
    assert(document.activeElement?.dataset.action==="catalog-status","status filter must retain keyboard focus after rerender");
    const search = document.querySelector('[data-action="catalog-search"]');
    assert(document.querySelectorAll("[data-catalog-entry]:not([hidden])").length===60,"one unified page of 60 results");
    action("identity-more","identity-more","true").click();
    assert(document.querySelectorAll("[data-catalog-entry]:not([hidden])").length===120,"load more must reveal next 60 unified results");
    assert(document.querySelectorAll("[data-identity-entry]").length===159,"exactly all 159 unassessed languages, without new ratings");
    search.value = "agda";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    assert(
      document.querySelector("[data-catalog-visible-count]").textContent.includes("1 language found") && document.querySelector("[data-catalog-visible-count]").textContent.includes("0 editorial"),
      "unassessed language search must count a real identity without inventing a rated profile",
    );
    assert(
      Array.from(document.querySelectorAll("[data-identity-entry]:not([hidden])"))
        .some((entry) =>
          entry.querySelector("h3")?.textContent === "Agda" &&
          entry.querySelector(".identity-profile")?.dataset.candidateId ===
            "candidate.language.61676461" &&
          entry.textContent?.includes("UNKNOWN"),
        ),
      "identity search must expose Agda with a pinned unassessed profile",
    );
    const agdaLink = [...document.querySelectorAll(".identity-profile")]
      .find((entry) => entry.dataset.candidateId === "candidate.language.61676461")
      ?.querySelector("[data-candidate-permalink]");
    assert(
      agdaLink && new URL(agdaLink.href).searchParams.get("candidate") === "candidate.language.61676461" &&
        new URL(agdaLink.href).origin === window.location.origin &&
        new URL(agdaLink.href).hash === "#catalog",
      "Agda permalink must remain same-origin and point to the pinned identity",
    );
    assert(
      document.querySelector("[data-catalog-search-empty]").hidden,
      "an identity-only match is still a real search result",
    );
    search.value = "plldn-no-match-zzxyy";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    assert(
      document.querySelector("[data-catalog-visible-count]").textContent.includes("0 languages found"),
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
      document.querySelector("[data-catalog-visible-count]").textContent.includes("194 languages found"),
      "clearing a search must restore all languages",
    );

    action("catalog-mode", "mode", "licenses").click();
    await waitFor(
      () => document.querySelector("#catalog h2").textContent === "License navigator" &&
        document.querySelector("[data-catalog-visible-count]").textContent.includes("714 licenses found"),
      "switching to license mode",
    );

    const licenseCards = [...document.querySelectorAll(".license-profile-card")];
    assert(
      licenseCards.some((card) => card.textContent.includes("MPL-2.0 §§1.10") &&
        card.textContent.includes("server-side")),
      "MPL editorial card must qualify distribution vs hosted functionality",
    );
    assert(
      licenseCards.some((card) => card.textContent.includes("EUPL-1.2 Arts. 1, 3, 5") &&
        card.textContent.includes("essential functionality")),
      "EUPL editorial card must disclose network communication scope",
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
      licensedEvidence.some((entry) =>
        entry.querySelector(".preview-provenance-disclosure")
          ?.textContent?.includes("Internal classification seed only")),
      "license comparison must identify internal seed-only references",
    );
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

    assert(document.querySelectorAll("[data-identity-entry]").length===682 && document.querySelectorAll("[data-catalog-entry]").length===714,"all pinned license identities must share the main catalogue");
    const editorialStatus = document.querySelector('[data-action="catalog-status"]');
    editorialStatus.value = "editorial";
    editorialStatus.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(() => document.querySelector("[data-catalog-visible-count]").textContent.includes("32 licenses found"), "editorial license source-flag baseline");
    const editorialFlag = document.querySelector('[data-action="identity-osi"]');
    editorialFlag.value = "yes";
    editorialFlag.dispatchEvent(new Event("change", { bubbles: true }));
    const flaggedEditorial = [...document.querySelectorAll("[data-catalog-entry]:not([hidden])")];
    assert(flaggedEditorial.length > 0 && flaggedEditorial.some(card => card.dataset.entityId === "license.mit"), "SPDX source flag must include real editorial MIT identity");
    assert(flaggedEditorial.every(card => card.dataset.identityOsiApproved === "true"), "editorial source flag must use pinned SPDX metadata");
    editorialFlag.value = "any";
    editorialFlag.dispatchEvent(new Event("change", { bubbles: true }));
    const restoreAll = document.querySelector('[data-action="catalog-status"]');
    restoreAll.value = "all";
    restoreAll.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(() => document.querySelector("[data-catalog-visible-count]").textContent.includes("714 licenses found"), "restore all license identities");
    const osiFilter = document.querySelector('[data-action="identity-osi"]');
    osiFilter.value = "yes";
    osiFilter.dispatchEvent(new Event("change",{bubbles:true}));
    assert(document.querySelectorAll("[data-catalog-entry]:not([hidden])").length > 0 && [...document.querySelectorAll("[data-catalog-entry]:not([hidden])")].every(entry=>entry.dataset.identityOsiApproved==="true"),"SPDX flag filter must use recorded source metadata");
    osiFilter.value = "no";
    osiFilter.dispatchEvent(new Event("change",{bubbles:true}));
    assert(document.querySelectorAll("[data-catalog-entry]:not([hidden])").length > 0 && [...document.querySelectorAll("[data-catalog-entry]:not([hidden])")].every(entry=>entry.dataset.identityOsiApproved==="false"),"non-approved source flags must remain discoverable");
    osiFilter.value = "any";
    osiFilter.dispatchEvent(new Event("change",{bubbles:true}));
    const licenseSearch = document.querySelector('[data-action="catalog-search"]');
    licenseSearch.value = "Artistic-2.0";
    licenseSearch.dispatchEvent(new Event("input",{bubbles:true}));
    const artistic = [...document.querySelectorAll("[data-identity-entry]:not([hidden])")].find(entry=>entry.querySelector(".identity-profile")?.dataset.candidateId==="candidate.license.artistic-2.0");
    assert(artistic?.textContent.includes("UNKNOWN") && artistic.querySelector(".identity-profile a")?.href==="https://spdx.org/licenses/Artistic-2.0.html","license search must preserve UNKNOWN and canonical pinned SPDX provenance");
    const artisticLink = [...document.querySelectorAll(".identity-profile")]
      .find((entry) => entry.dataset.candidateId === "candidate.license.artistic-2.0")
      ?.querySelector("[data-candidate-permalink]");
    assert(
      artisticLink &&
        new URL(artisticLink.href).searchParams.get("candidate") === "candidate.license.artistic-2.0",
      "license permalink must use its stable SPDX identity ID",
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
      document.querySelector("[data-catalog-visible-count]").textContent.includes(filtered + " licenses found"),
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

    for (const [width, suffix] of [
      [1280, "?candidate=candidate.language.6a"],
      [390, "?candidate=candidate.language.696f"],
      [390, "?candidate=candidate.language.76"],
      [1280, "?probe=reader"],
      [390, "?probe=reader"],
      [1280, "?probe=discovery"],
      [390, "?probe=discovery"],
      [1280, "?catalog=languages&usage=ranked&order=common"],
      [390, "?catalog=languages&usage=ranked&order=common"],
      [1280, "?probe=focus"],
      [1280, ""],
      [390, ""],
      [1280, "?catalog=licenses"],
      [390, "?catalog=languages&spdx=yes"],
      [390, "?profile=language.rust"],
      [1280, "?profile=license.mit"],
      [1280, "?catalog=languages&q=Agda&status=unassessed&order=desc"],
      [390, "?catalog=licenses&q=Artistic-2.0&status=unassessed&order=desc"],
      [1280, "?candidate=candidate.language.61676461"],
      [1280, "?candidate=candidate.license.artistic-2.0"],
      [
        1280,
        "?candidate=candidate.language.6261736963&usage=ranked&era=modern&lifecycle=retired&order=newest",
      ],
      [
        1280,
        "?profile=language.rust&usage=unranked&era=classic&lifecycle=retired&order=oldest",
      ],
    ] as const) {
      const { stdout, stderr } = await execFileAsync(
        browser,
        [
          "--headless=new",
          "--no-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-background-networking",
          "--no-first-run",
          `--user-data-dir=${join(root, "chrome-profile")}`,
          "--force-device-scale-factor=1",
          `--window-size=${width},844`,
          "--virtual-time-budget=20000",
          "--dump-dom",
          `http://127.0.0.1:${address.port}/index.html${suffix}`,
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
    await rm(root, {
      recursive: true,
      force: true,
      maxRetries: 12,
      retryDelay: 150,
    });
  }
}

await main();
