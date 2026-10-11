// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { CatalogPreviewFactView, CatalogPreviewView } from "./types.ts";

/** Display the recorded Preview claim, never infer a rights conclusion. */
export function previewFactText(fact: CatalogPreviewFactView | undefined): string {
  if (!fact || fact.state === "UNKNOWN") return "Unknown";
  if (fact.state === "NOT_APPLICABLE") return "Not applicable";
  if (fact.value === null) return fact.state;
  let value: string;
  switch (fact.value.type) {
    case "boolean":
      value = fact.value.value ? "Yes" : "No";
      break;
    case "integer":
    case "string":
    case "enum":
      value = String(fact.value.value);
      break;
    case "set":
      value = fact.value.value.join(", ");
      break;
    case "quantity":
      value = `${fact.value.value} ${fact.value.unit}`;
      break;
  }
  return fact.state === "CONDITIONAL" ? `${value} (conditional)` : value;
}

export interface LicensePreviewClaimRow {
  dimensionId: string;
  label: string;
  facts: readonly (CatalogPreviewFactView | undefined)[];
}

/** Only dimensions actually recorded for selected editorial licenses are shown. */
export function licensePreviewClaimRows(
  catalog: CatalogPreviewView,
  ids: readonly string[],
): LicensePreviewClaimRow[] {
  if (catalog.status !== "Preview") {
    throw new Error("License claim inspection requires Preview source data");
  }
  const entries = new Map(
    catalog.licenses.map((entry) => [entry.entity_id, entry]),
  );
  const dimensions = new Map<string, string>();
  for (const id of ids) {
    for (const fact of entries.get(id)?.facts ?? []) {
      dimensions.set(fact.dimension_id, fact.label);
    }
  }
  return [...dimensions].sort(([a], [b]) => a.localeCompare(b)).map(
    ([dimensionId, label]) => ({
      dimensionId,
      label,
      facts: ids.map((id) =>
        entries.get(id)?.facts.find((fact) => fact.dimension_id === dimensionId),
      ),
    }),
  );
}

function safeHttps(reference: string): string | null {
  try {
    const url = new URL(reference);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Inspection details are metadata; their presence does not mark a claim Reviewed. */
export function renderPreviewClaimEvidence(
  fact: CatalogPreviewFactView | undefined,
): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "compare-evidence";
  details.dataset.compareEvidence = "true";
  const summary = document.createElement("summary");
  summary.textContent = `Preview evidence · ${fact?.review_status ?? "UNKNOWN"} · ${fact?.sources.length ?? 0} source(s)`;
  details.append(summary);
  const claim = document.createElement("code");
  claim.textContent = fact?.claim_id ?? "No Preview claim recorded";
  details.append(claim);
  if (!fact || fact.sources.length === 0) {
    const missing = document.createElement("p");
    missing.textContent = "No sources recorded for this Preview dimension.";
    details.append(missing);
    return details;
  }
  const sources = document.createElement("div");
  sources.className = "profile-source-links";
  for (const source of fact.sources) {
    const href = safeHttps(source.reference);
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.rel = "noopener noreferrer";
      link.textContent = source.title;
      sources.append(link);
    } else {
      const invalid = document.createElement("p");
      invalid.textContent = `Unlinked source: ${source.title}`;
      sources.append(invalid);
    }
  }
  details.append(sources);
  return details;
}
