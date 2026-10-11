// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { CatalogPreviewEntryView, CatalogPreviewView } from "./types.ts";

export interface PreviewEvidenceCount {
  claims: number;
  withSources: number;
  withoutSources: number;
  unknownValues: number;
  sourceReferences: number;
  distinctReferences: number;
}

/**
 * Inventory only: sources recorded in Preview data are not independently verified
 * evidence and must never be interpreted as a Reviewed assertion.
 */
export function countPreviewEvidence(
  entries: readonly CatalogPreviewEntryView[],
): PreviewEvidenceCount {
  const facts = entries.flatMap((entry) => entry.facts);
  const linked = facts.filter((fact) =>
    fact.sources.some((source) => source.reference.trim().length > 0),
  );
  const sourceReferences = facts
    .flatMap((fact) => fact.sources)
    .map((source) => source.reference.trim())
    .filter(Boolean);
  return {
    claims: facts.length,
    withSources: linked.length,
    withoutSources: facts.length - linked.length,
    unknownValues: facts.filter((fact) => fact.state === "UNKNOWN").length,
    sourceReferences: sourceReferences.length,
    distinctReferences: new Set(sourceReferences).size,
  };
}

export function renderPreviewEvidenceInventory(
  catalog: CatalogPreviewView,
): HTMLDetailsElement {
  if (catalog.status !== "Preview" || !catalog.knowledge_snapshot) {
    throw new Error("Evidence inventory requires a named Preview snapshot");
  }
  const languages = countPreviewEvidence(catalog.languages);
  const licenses = countPreviewEvidence(catalog.licenses);
  const details = document.createElement("details");
  details.className = "preview-evidence-inventory";
  details.id = "evidence-inventory";
  const summary = document.createElement("summary");
  summary.textContent = `Evidence inventory · ${languages.claims + licenses.claims} recorded Preview claims`;
  details.append(summary);
  const warning = document.createElement("p");
  warning.textContent =
    "This inventory counts recorded references, not independently verified claims. It does not certify source accuracy, currentness, or legal conclusions.";
  details.append(warning);
  const pinned = document.createElement("p");
  pinned.textContent = `Preview snapshot: ${catalog.knowledge_snapshot}`;
  details.append(pinned);

  const rows = [
    ["Languages", languages],
    ["Licenses", licenses],
  ] as const;
  const list = document.createElement("dl");
  for (const [name, counts] of rows) {
    const term = document.createElement("dt");
    term.textContent = name;
    const value = document.createElement("dd");
    value.textContent = `${counts.claims} claims · ${counts.withSources} with recorded references · ${counts.withoutSources} without recorded references · ${counts.unknownValues} UNKNOWN values · ${counts.sourceReferences} total reference entries (${counts.distinctReferences} distinct URLs)`;
    value.dataset.inventoryKind = name.toLowerCase();
    list.append(term, value);
  }
  details.append(list);
  return details;
}
