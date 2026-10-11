// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
// This v0.2 candidate surface is separate from historical v0.1 snapshots.
import catalog from "../../catalog/identity-data.json" with { type: "json" };
import selection from "../../catalog/identity-selection.json" with { type: "json" };
import { INDEX_ONLY_LANGUAGES, INDEX_ONLY_LICENSES } from "./identity-index.ts";

const fold = (s: string): string => s.normalize("NFC").toLocaleLowerCase("en-US");
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const languageId = (name: string): string =>
  "candidate.language." +
  Array.from(new TextEncoder().encode(fold(name)), (b) => b.toString(16).padStart(2, "0")).join("");
function unique(items: readonly string[], kind: string): void {
  if (new Set(items.map(fold)).size !== items.length) throw new Error("Duplicate " + kind);
}

/** Pinned identities to explicitly UNKNOWN envelopes, never Reviewed claims. */
export function buildUnassessedCandidatesV02() {
  if (catalog.schema_version !== 1 || selection.schema_version !== 1 ||
    catalog.source.spdx_version !== selection.source_pins.spdx_version ||
    !catalog.source.languages.includes(selection.source_pins.linguist_commit) ||
    !catalog.source.licenses.includes(selection.source_pins.spdx_commit)) {
    throw new Error("Unpinned or unsupported identity catalogue");
  }
  unique(catalog.languages, "Linguist identities");
  unique(catalog.licenses.map((x) => x.id), "SPDX identities");
  unique(INDEX_ONLY_LANGUAGES, "candidate languages");
  unique(INDEX_ONLY_LICENSES.map((x) => x.id), "candidate licenses");
  const languages = new Set(catalog.languages.map(fold));
  const licenses = new Set(catalog.licenses.map((x) => fold(x.id)));
  const records = [
    ...INDEX_ONLY_LANGUAGES.map((name) => {
      if (!languages.has(fold(name))) throw new Error("Unknown source language " + name);
      return {
        id: languageId(name), kind: "language" as const, name,
        reference: catalog.source.languages,
        source_status: "PINNED_IDENTITY" as const,
        stage: "UNASSESSED_PREVIEW" as const,
        review_status: "NOT_REVIEWED" as const,
        assessments: {
          performance: "UNKNOWN" as const, complexity: "UNKNOWN" as const,
          suitability: "UNKNOWN" as const,
        },
        claim_refs: [] as string[],
      };
    }),
    ...INDEX_ONLY_LICENSES.map((license) => {
      if (!licenses.has(fold(license.id)) ||
        license.reference !== `https://spdx.org/licenses/${license.id}.html`) {
        throw new Error("Unknown or invalid source license " + license.id);
      }
      return {
        id: "candidate.license." + fold(license.id), kind: "license" as const,
        name: license.name, spdx_id: license.id,
        osi_approved_source_flag: license.osiApproved, reference: license.reference,
        source_status: "PINNED_IDENTITY" as const,
        stage: "UNASSESSED_PREVIEW" as const,
        review_status: "NOT_REVIEWED" as const,
        assessments: {
          rights: "UNKNOWN" as const, obligations: "UNKNOWN" as const,
          compatibility: "UNKNOWN" as const,
        },
        claim_refs: [] as string[],
      };
    }),
  ];
  records.sort((a,b) => compare(a.id,b.id));
  unique(records.map((x) => x.id), "candidate IDs");
  return {
    schema_version: "0.2" as const,
    migration_from: "identity-index.v1" as const,
    source_pins: { ...selection.source_pins },
    records,
  };
}
