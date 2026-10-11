// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { PRODUCT_MODEL } from "../product/catalog.ts";
import { LICENSE_DECISION_PROFILES } from "../product/license-decision-profiles.ts";
import type {
  LicenseDecisionProfile,
  LicenseProductProfile,
} from "../product/types.ts";
import {
  licensePreviewClaimRows,
  previewFactText,
  renderPreviewClaimEvidence,
} from "./preview-evidence.ts";
import type { CatalogPreviewView } from "./types.ts";

export type LicenseComparisonRow = {
  label: string;
  value: (profile: LicenseProductProfile) => string;
};

const decision = (profile: LicenseProductProfile) =>
  LICENSE_DECISION_PROFILES[profile.entity_id];

const text = (value: string | undefined): string =>
  value
    ? value.replaceAll("-", " ").replace(/\b\w/gu, (s) => s.toUpperCase())
    : "Unknown";

const right = (
  profile: LicenseProductProfile,
  key: keyof LicenseDecisionProfile["rights"],
): string => text(decision(profile)?.rights[key]);

const obligation = (
  profile: LicenseProductProfile,
  key: keyof LicenseDecisionProfile["obligations"],
): string => text(decision(profile)?.obligations[key]);

/** A presentation matrix of existing Editorial Preview assertions, never Reviewed. */
export function licenseComparisonRows(): LicenseComparisonRow[] {
  return [
    { label: "Editorial summary", value: (p) => p.tagline },
    { label: "License family", value: (p) => text(p.family) },
    { label: "Good when", value: (p) => p.good_when },
    { label: "Watch for", value: (p) => p.watch_for },
    { label: "License model", value: (p) => text(decision(p)?.model) },
    { label: "SPDX ID", value: (p) => decision(p)?.spdx_id ?? "Unknown" },
    {
      label: "OSI status (Preview)",
      value: (p) => text(decision(p)?.osi_status),
    },
    { label: "Use", value: (p) => right(p, "use") },
    { label: "Modify", value: (p) => right(p, "modify") },
    { label: "Redistribute", value: (p) => right(p, "redistribute") },
    { label: "Commercial use", value: (p) => right(p, "commercial_use") },
    {
      label: "Internal business use",
      value: (p) => right(p, "internal_business_use"),
    },
    { label: "SaaS / hosting", value: (p) => right(p, "saas_hosting") },
    { label: "Competitive use", value: (p) => right(p, "competitive_use") },
    {
      label: "Source disclosure",
      value: (p) => obligation(p, "source_disclosure"),
    },
    { label: "Notice", value: (p) => obligation(p, "notice") },
    { label: "Patent grant", value: (p) => obligation(p, "patent_grant") },
    { label: "Time rule", value: (p) => obligation(p, "time_rule") },
    {
      label: "Compliance complexity",
      value: (p) => text(decision(p)?.compliance_complexity),
    },
    {
      label: "Business-model friction",
      value: (p) => text(decision(p)?.business_model_friction),
    },
  ];
}

/** Fail closed on unknown IDs: index-only identities are not editorial assessments. */
export function selectEditorialLicenses(
  ids: readonly string[],
): LicenseProductProfile[] {
  if (ids.length > 4 || new Set(ids).size !== ids.length)
    throw new Error("License comparison requires at most four distinct IDs");
  const entries = new Map(PRODUCT_MODEL.licenses.map((p) => [p.entity_id, p]));
  return ids.map((id) => {
    const entry = entries.get(id);
    if (!entry || !decision(entry))
      throw new Error(
        "License comparison is restricted to Editorial Preview profiles",
      );
    return entry;
  });
}

export function renderLicenseComparison(
  ids: readonly string[],
  catalog: CatalogPreviewView,
): HTMLElement {
  const selected = selectEditorialLicenses(ids);
  const section = document.createElement("section");
  section.className = "compare-section";
  section.id = "compare-licenses";
  const header = document.createElement("div");
  header.className = "section-heading-row";
  const copy = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = `Compare licenses (${selected.length}/4)`;
  const caveat = document.createElement("p");
  caveat.textContent =
    "Editorial Preview only: not legal advice or a compatibility verdict. Index-only identities have no assessed rights.";
  copy.append(title, caveat);
  header.append(copy);
  if (selected.length > 0) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.dataset.action = "clear-license-compare";
    clear.textContent = "Clear comparison";
    header.append(clear);
    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.dataset.action = "export-license-compare";
    exportButton.textContent = "Export selected comparison (CSV)";
    header.append(exportButton);
  }
  section.append(header);
  if (selected.length === 0) {
    const empty = document.createElement("p");
    empty.className = "compare-empty";
    empty.textContent =
      "Add up to four Editorial Preview licenses from the catalogue.";
    section.append(empty);
    return section;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "compare-table-wrap";
  const table = document.createElement("table");
  table.className = "compare-table";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  const label = document.createElement("th");
  label.scope = "col";
  label.textContent = "Attribute";
  headRow.append(label);
  for (const profile of selected) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = profile.label;
    const source = decision(profile)?.canonical_source;
    if (source) {
      const href = new URL(source);
      if (href.protocol !== "https:")
        throw new Error("Canonical license source must be HTTPS");
      const link = document.createElement("a");
      link.href = href.href;
      link.rel = "noopener noreferrer";
      link.textContent = "Canonical terms";
      th.append(link);
    }
    headRow.append(th);
  }
  head.append(headRow);
  table.append(head);
  const body = document.createElement("tbody");
  for (const row of licenseComparisonRows()) {
    const tr = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = row.label;
    tr.append(heading);
    for (const profile of selected) {
      const td = document.createElement("td");
      td.textContent = row.value(profile);
      tr.append(td);
    }
    body.append(tr);
  }
  const previewRows = licensePreviewClaimRows(catalog, selected.map((p) => p.entity_id));
  if (previewRows.length > 0) {
    const subtitle = document.createElement("tr");
    const note = document.createElement("th");
    note.colSpan = selected.length + 1;
    note.scope = "row";
    note.textContent =
      "Recorded Preview claims below are separate from the editorial rights summary above. They are not a license-compatibility verdict.";
    subtitle.append(note);
    body.append(subtitle);
  }
  for (const record of previewRows) {
    const tr = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = `Preview fact: ${record.label}`;
    tr.append(label);
    for (const fact of record.facts) {
      const cell = document.createElement("td");
      cell.textContent = previewFactText(fact);
      cell.append(renderPreviewClaimEvidence(fact));
      tr.append(cell);
    }
    body.append(tr);
  }
  table.append(body);
  wrapper.append(table);
  section.append(wrapper);
  return section;
}
