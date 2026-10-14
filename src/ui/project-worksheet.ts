// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

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
  title.textContent = "Project and licensing worksheet";
  const intro = document.createElement("p");
  intro.textContent =
    "Record your scenario; share the URL to revisit it. These answers are navigation context only, not Reviewed evidence or legal advice.";
  section.append(title, intro);
  const grid = document.createElement("div");
  grid.className = "catalog-filter-grid";
  for (const key of WORKSHEET_KEYS) {
    const label = document.createElement("label");
    label.className = "catalog-filter";
    const name = document.createElement("span");
    name.textContent = WORKSHEET_FIELDS[key].label;
    const select = document.createElement("select");
    select.dataset.action = "worksheet-answer";
    select.dataset.worksheetKey = key;
    for (const value of WORKSHEET_FIELDS[key].options) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value.replaceAll("-", " ");
      option.selected = worksheet[key] === value;
      select.append(option);
    }
    label.append(name, select);
    grid.append(label);
  }
  section.append(grid);
  const result = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = "Licensing result: UNKNOWN — verification required";
  result.append(heading);
  const list = document.createElement("ul");
  for (const topic of summarizeWorksheet(worksheet).topics) {
    const item = document.createElement("li");
    item.textContent = topic;
    list.append(item);
  }
  result.append(list);
  const source = document.createElement("a");
  source.href = "https://spdx.org/licenses/";
  source.rel = "noopener noreferrer";
  source.textContent = "SPDX license identities and canonical source links";
  result.append(source);
  const note = document.createElement("p");
  note.textContent =
    "No automatic license-pair compatibility verdict. Candidate identities may have NOT_REVIEWED assessments; consult their exact terms and qualified advice where needed.";
  result.append(note);
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.dataset.action = "export-worksheet";
  exportButton.textContent = "Download Preview worksheet (Markdown)";
  result.append(exportButton);
  const browse = document.createElement("button");
  browse.type = "button";
  browse.dataset.action = "worksheet-browse-license-previews";
  browse.textContent = "Browse license Preview filters for this scenario";
  result.append(browse);
  const qualifier = document.createElement("p");
  qualifier.textContent =
    "Preview filters narrow descriptions only; they are not compatibility checks. Unknown identities may be excluded by a selected filter.";
  result.append(qualifier);
  section.append(result);
  return section;
}

/** Unrated, deterministic Preview worksheet that can be saved locally. */
export function exportWorksheetMarkdown(
  worksheet: WorksheetState,
  guide: string | null,
): string {
  const plain = (value: string) => value.replace(/[\r\n|<>]/gu, " ");
  const lines = [
    "# PLLDN project and license scenario — Preview only",
    "",
    "Result: UNKNOWN — no reviewed compatibility determination.",
    "This worksheet records user intent. It is not legal advice or a substitute for checking canonical licenses.",
    `Project guide: ${plain(guide ?? "unspecified")}`,
    "",
    "## Selected context",
  ];
  for (const key of WORKSHEET_KEYS)
    lines.push(`- ${WORKSHEET_FIELDS[key].label}: ${plain(worksheet[key])}`);
  lines.push("", "## Questions requiring evidence");
  for (const topic of summarizeWorksheet(worksheet).topics)
    lines.push(`- ${topic}`);
  lines.push(
    "",
    "## Starting sources",
    "- SPDX license identities: https://spdx.org/licenses/",
    "- Open the selected license's pinned source in the PLLDN catalogue and inspect version, exceptions, linking, network and distribution obligations.",
    "",
    "Review status: NOT_REVIEWED for unassessed candidate identities. Nothing in this report is a Reviewed recommendation.",
  );
  return `${lines.join("\n")}\n`;
}
