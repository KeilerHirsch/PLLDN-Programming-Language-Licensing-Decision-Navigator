// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { CatalogPreviewFactView, UiEvidenceSource } from "./types.ts";

const SEED_IDS = new Set([
  "source.catalog-block1-preview",
  "source.catalog-block2-preview",
  "source.catalog-block3-preview",
]);
const REPO_PREFIX =
  "/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/blob/main/knowledge/candidate/catalog-2026-10-03/evidence/";

/** Identify only the three known historical self-referential seed sources. */
export function isInternalPreviewSeed(source: UiEvidenceSource): boolean {
  if (!SEED_IDS.has(source.source_id)) return false;
  try {
    const url = new URL(source.reference);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.startsWith(REPO_PREFIX) &&
      url.pathname.endsWith(".md") &&
      !url.pathname.includes("..")
    );
  } catch {
    return false;
  }
}

/** A link is evidence lineage, never a substitute for factual review. */
export function factProvenanceDisclosure(
  fact: CatalogPreviewFactView | undefined,
): string {
  if (!fact || fact.sources.length === 0) {
    return "No recorded source. This claim is not independently verified.";
  }
  return fact.sources.every(isInternalPreviewSeed)
    ? "Internal classification seed only. No independent primary evidence is attached to this claim."
    : "Recorded source reference(s) only. Independent verification is not established.";
}
