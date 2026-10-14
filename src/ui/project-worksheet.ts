// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { tr, trForLocale, type UiLocale } from "./ui-locale.ts";

/** Navigation-only project intent. These are NEVER licensing conclusions. */
export const WORKSHEET_FIELDS = {
  platform: {
    label: "Target platform",
    options: ["unspecified", "web", "desktop", "server", "mobile", "embedded"],
  },
  team: {
    label: "Maintenance context",
    options: ["unspecified", "solo", "small-team", "enterprise", "regulated"],
  },
  usage: {
    label: "Planned use",
    options: ["unspecified", "internal", "public", "third-party"],
  },
  modification: {
    label: "Modify covered software?",
    options: ["unspecified", "yes", "no"],
  },
  distribution: {
    label: "Distribute software?",
    options: ["unspecified", "no", "source", "binary", "both"],
  },
  hosting: {
    label: "Offer network / SaaS access?",
    options: ["unspecified", "yes", "no"],
  },
  linking: {
    label: "How are libraries linked?",
    options: ["unspecified", "none", "static", "dynamic", "separate-process"],
  },
  commercial: {
    label: "Commercial purpose?",
    options: ["unspecified", "yes", "no"],
  },
  expression: {
    label: "License expression or exception?",
    options: ["unspecified", "single", "AND", "OR", "WITH", "unconfirmed"],
  },
} as const;

export type WorksheetKey = keyof typeof WORKSHEET_FIELDS;
export type WorksheetState = Record<WorksheetKey, string>;
export const WORKSHEET_KEYS = Object.keys(WORKSHEET_FIELDS) as WorksheetKey[];
export function defaultWorksheet(): WorksheetState {
  return Object.fromEntries(
    WORKSHEET_KEYS.map((key) => [key, "unspecified"]),
  ) as WorksheetState;
}
export function validWorksheetChoice(
  key: string,
  value: string,
): key is WorksheetKey {
  return (
    Object.hasOwn(WORKSHEET_FIELDS, key) &&
    (
      WORKSHEET_FIELDS[key as WorksheetKey].options as readonly string[]
    ).includes(value)
  );
}
export function readWorksheet(search: string): WorksheetState {
  const params = new URLSearchParams(search);
  const result = defaultWorksheet();
  for (const key of WORKSHEET_KEYS) {
    const value = params.get(`ws_${key}`);
    if (value && validWorksheetChoice(key, value)) result[key] = value;
  }
  return result;
}
export function writeWorksheet(
  params: URLSearchParams,
  worksheet: WorksheetState,
): void {
  for (const key of WORKSHEET_KEYS) {
    params.delete(`ws_${key}`);
    if (
      validWorksheetChoice(key, worksheet[key]) &&
      worksheet[key] !== "unspecified"
    ) {
      params.set(`ws_${key}`, worksheet[key]);
    }
  }
}

/** Exact mapping to the two EXISTING Editorial Preview facets; all other answers are context. */
export function worksheetPreviewFilterTrace(scenario: WorksheetState): {
  filters: { licenseCommercial: "yes" | "any"; licenseSaas: "yes" | "any" };
  rows: { key: WorksheetKey; answer: string; description: string }[];
} {
  const filters = {
    licenseCommercial:
      scenario.commercial === "yes" ? ("yes" as const) : ("any" as const),
    licenseSaas:
      scenario.hosting === "yes" ? ("yes" as const) : ("any" as const),
  };
  const rows = WORKSHEET_KEYS.filter(
    (key) => scenario[key] !== "unspecified",
  ).map((key) => {
    let description =
      "Context only — no automatic Reviewed or Preview filter mapping.";
    if (key === "commercial" && scenario[key] === "yes") {
      description =
        "Applies licenseCommercial=yes to Editorial Preview descriptions only; UNKNOWN profiles may be hidden. No license permission is established.";
    } else if (key === "hosting" && scenario[key] === "yes") {
      description =
        "Applies licenseSaas=yes to Editorial Preview descriptions only; UNKNOWN profiles may be hidden. No network-use permission is established.";
    } else if (
      (key === "commercial" || key === "hosting") &&
      scenario[key] === "no"
    ) {
      description =
        "No inverse filter is inferred from 'no'; all values remain visible.";
    }
    return { key, answer: scenario[key], description };
  });
  return { filters, rows };
}

/** Authoritative texts to inspect only IF the exact license/version governs a component.
 * Nothing here decides whether a license applies or any permission is granted. */
export interface WorksheetPrimarySource {
  id: string;
  title: string;
  section: string;
  url: string;
  why: string;
}

export function worksheetPrimarySources(
  scenario: WorksheetState,
): WorksheetPrimarySource[] {
  const sources: WorksheetPrimarySource[] = [];
  if (
    scenario.expression !== "unspecified" &&
    scenario.expression !== "single"
  ) {
    sources.push({
      id: "spdx-expression-3.0.1",
      title: "SPDX Specification 3.0.1",
      section: "Annex B — license expressions AND / OR / WITH",
      url: "https://spdx.github.io/spdx-spec/v3.0.1/annexes/spdx-license-expressions/",
      why: "If your component has a compound SPDX expression, read the exact operator/exception grammar. Syntax is not a compatibility verdict.",
    });
  }
  if (scenario.hosting === "yes") {
    sources.push({
      id: "agpl-3.0-section-13",
      title: "GNU Affero General Public License v3",
      section: "Section 13 — Remote Network Interaction",
      url: "https://www.gnu.org/licenses/agpl-3.0.html",
      why: "If your component is actually under AGPL-3.0, inspect section 13 and the exact modification/network interaction conditions. SaaS by itself proves nothing.",
    });
  }
  if (["source", "binary", "both"].includes(scenario.distribution)) {
    sources.push({
      id: "mpl-2.0-section-3",
      title: "Mozilla Public License 2.0",
      section: "Sections 3.1 and 3.2 — Source / Executable Form distribution",
      url: "https://www.mozilla.org/en-US/MPL/2.0/",
      why: "If your component is actually MPL-2.0-covered software, inspect section 3 for the particular form of distribution. Do not generalize to other licenses.",
    });
  }
  if (scenario.commercial === "yes" || scenario.commercial === "no") {
    sources.push({
      id: "polyform-noncommercial-1.0.0",
      title: "PolyForm Noncommercial License 1.0.0",
      section:
        "Copyright License; Noncommercial Purposes; Distribution License",
      url: "https://polyformproject.org/licenses/noncommercial/1.0.0",
      why: "If your component actually uses this exact PolyForm variant, inspect its defined permitted purposes. Other PolyForm variants have different grants.",
    });
  }
  if (scenario.usage === "internal") {
    sources.push({
      id: "polyform-internal-use-1.0.0",
      title: "PolyForm Internal Use License 1.0.0",
      section: "Copyright License; Internal Business Use",
      url: "https://polyformproject.org/licenses/internal-use/1.0.0",
      why: "If your component actually uses PolyForm Internal Use 1.0.0, inspect the internal-use definition and distribution restriction; do not apply those terms to other variants.",
    });
  }
  return sources;
}

/** Always abstain. A scenario is not evidence that a specific license permits it. */
export function summarizeWorksheet(scenario: WorksheetState): {
  status: "UNKNOWN";
  topics: string[];
} {
  const topics = [
    "Verify exact license version, provenance and scope against canonical text",
  ];
  if (scenario.distribution !== "no")
    topics.push(
      "Check distribution, source-offer and downstream notice obligations",
    );
  if (scenario.hosting !== "no")
    topics.push(
      "Check network-use and SaaS clauses separately from distribution",
    );
  if (scenario.modification !== "no")
    topics.push("Check modification and derivative-work obligations");
  if (scenario.linking !== "none")
    topics.push("Check library/linking boundaries and exceptions");
  if (scenario.commercial !== "no")
    topics.push("Check commercial, competitive and field-of-use restrictions");
  if (scenario.expression !== "single")
    topics.push(
      "Resolve SPDX AND / OR / WITH expressions and exceptions for the actual components",
    );
  topics.push(
    "Confirm patents, trademarks and deployment jurisdiction where relevant",
  );
  return { status: "UNKNOWN", topics };
}

export function renderProjectWorksheet(worksheet: WorksheetState): HTMLElement {
  const section = document.createElement("section");
  section.className = "project-worksheet";
  section.id = "project-worksheet";
  const title = document.createElement("h2");
  title.textContent = tr("Project and licensing worksheet");
  const intro = document.createElement("p");
  intro.textContent = tr(
    "Record your scenario; share the URL to revisit it. These answers are navigation context only, not Reviewed evidence or legal advice.",
  );
  section.append(title, intro);
  const grid = document.createElement("div");
  grid.className = "catalog-filter-grid";
  for (const key of WORKSHEET_KEYS) {
    const label = document.createElement("label");
    label.className = "catalog-filter";
    const name = document.createElement("span");
    name.textContent = tr(WORKSHEET_FIELDS[key].label);
    const select = document.createElement("select");
    select.dataset.action = "worksheet-answer";
    select.dataset.worksheetKey = key;
    for (const value of WORKSHEET_FIELDS[key].options) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = tr(value.replaceAll("-", " "));
      option.selected = worksheet[key] === value;
      select.append(option);
    }
    label.append(name, select);
    grid.append(label);
  }
  section.append(grid);
  const mapped = worksheetPreviewFilterTrace(worksheet);
  const mapping = document.createElement("details");
  mapping.className = "worksheet-filter-trace";
  const traceTitle = document.createElement("summary");
  traceTitle.textContent = tr(
    "How these answers affect existing Preview filters",
  );
  mapping.append(traceTitle);
  const traceNote = document.createElement("p");
  traceNote.textContent = tr(
    "Only explicit yes answers for commercial use and SaaS activate existing Editorial Preview filters. Other answers are context, not a Reviewed decision.",
  );
  mapping.append(traceNote);
  if (mapped.rows.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = tr("No answers recorded; no scenario filters applied.");
    mapping.append(empty);
  } else {
    const trace = document.createElement("dl");
    for (const row of mapped.rows) {
      const key = document.createElement("dt");
      key.textContent = `${tr(WORKSHEET_FIELDS[row.key].label)}: ${tr(row.answer.replaceAll("-", " "))}`;
      const description = document.createElement("dd");
      description.textContent = tr(row.description);
      trace.append(key, description);
    }
    mapping.append(trace);
  }
  section.append(mapping);
  const result = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = tr("Licensing result: UNKNOWN — verification required");
  result.append(heading);
  const list = document.createElement("ul");
  for (const topic of summarizeWorksheet(worksheet).topics) {
    const item = document.createElement("li");
    item.textContent = tr(topic);
    list.append(item);
  }
  result.append(list);
  const source = document.createElement("a");
  source.href = "https://spdx.org/licenses/";
  source.rel = "noopener noreferrer";
  source.textContent = tr("SPDX license identities and canonical source links");
  result.append(source);
  const note = document.createElement("p");
  note.textContent = tr(
    "No automatic license-pair compatibility verdict. Candidate identities may have NOT_REVIEWED assessments; consult their exact terms and qualified advice where needed.",
  );
  result.append(note);
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.dataset.action = "export-worksheet";
  exportButton.textContent = tr("Download Preview worksheet (Markdown)");
  result.append(exportButton);
  const browse = document.createElement("button");
  browse.type = "button";
  browse.dataset.action = "worksheet-browse-license-previews";
  browse.textContent = tr("Browse license Preview filters for this scenario");
  result.append(browse);
  const qualifier = document.createElement("p");
  qualifier.textContent = tr(
    "Preview filters narrow descriptions only; they are not compatibility checks. Unknown identities may be excluded by a selected filter.",
  );
  result.append(qualifier);
  const primary = worksheetPrimarySources(worksheet);
  if (primary.length > 0) {
    const details = document.createElement("details");
    details.className = "worksheet-primary-sources";
    const summary = document.createElement("summary");
    summary.textContent = tr("Official texts to check — examples only");
    const caution = document.createElement("p");
    caution.textContent = tr(
      "These links are conditional examples, not proof that any named license governs your project. Verify actual component, version and exception before applying any term.",
    );
    details.append(summary, caution);
    const sources = document.createElement("ul");
    for (const entry of primary) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = entry.url;
      link.rel = "noopener noreferrer";
      link.textContent = entry.title;
      const scope = document.createElement("p");
      scope.textContent = entry.section;
      const reason = document.createElement("p");
      reason.textContent = tr(entry.why);
      item.append(link, scope, reason);
      sources.append(item);
    }
    details.append(sources);
    result.append(details);
  }
  section.append(result);
  return section;
}

/** Unrated, deterministic Preview worksheet that can be saved locally. */
export function exportWorksheetMarkdown(
  worksheet: WorksheetState,
  guide: string | null,
  locale: UiLocale = "en",
): string {
  const plain = (value: string) => value.replace(/[\r\n|<>]/gu, " ");
  const label = (value: string) => trForLocale(value, locale);
  const lines = [
    `# ${label("PLLDN project and license scenario — Preview only")}`,
    "",
    label("Result: UNKNOWN — no reviewed compatibility determination."),
    label(
      "This worksheet records user intent. It is not legal advice or a substitute for checking canonical licenses.",
    ),
    `${label("Project guide")}: ${plain(guide ?? label("unspecified"))}`,
    "",
    `## ${label("Selected context")}`,
  ];
  for (const key of WORKSHEET_KEYS)
    lines.push(
      `- ${label(WORKSHEET_FIELDS[key].label)}: ${plain(label(worksheet[key]))}`,
    );
  lines.push("", `## ${label("Preview filter mapping")}`);
  const trace = worksheetPreviewFilterTrace(worksheet);
  if (trace.rows.length === 0)
    lines.push(
      `- ${label("No answers recorded; no scenario filters applied.")}`,
    );
  for (const row of trace.rows) {
    lines.push(
      `- ${label(WORKSHEET_FIELDS[row.key].label)} (${label(row.answer)}): ${label(row.description)}`,
    );
  }
  lines.push("", `## ${label("Questions requiring evidence")}`);
  for (const topic of summarizeWorksheet(worksheet).topics)
    lines.push(`- ${label(topic)}`);
  const primary = worksheetPrimarySources(worksheet);
  if (primary.length > 0) {
    lines.push("", `## ${label("Official texts to check — examples only")}`);
    lines.push(
      label(
        "These links are conditional examples, not proof that any named license governs your project. Verify actual component, version and exception before applying any term.",
      ),
    );
    for (const source of primary) {
      lines.push(`- ${source.title} — ${source.section}: ${source.url}`);
      lines.push(`  - ${label(source.why)}`);
    }
  }
  lines.push(
    "",
    `## ${label("Starting sources")}`,
    `- ${label("SPDX license identities")}: https://spdx.org/licenses/`,
    `- ${label("Open the selected license's pinned source in the PLLDN catalogue and inspect version, exceptions, linking, network and distribution obligations.")}`,
    "",
    label(
      "Review status: NOT_REVIEWED for unassessed candidate identities. Nothing in this report is a Reviewed recommendation.",
    ),
  );
  return `${lines.join("\n")}\n`;
}
