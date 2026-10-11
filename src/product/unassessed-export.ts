// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import snapshot from "../../catalog/unassessed-candidates.v0.2.json" with {
  type: "json",
};

export const UNASSESSED_EXPORT_HEADER = [
  "candidate_id",
  "entity_type",
  "name",
  "spdx_id",
  "source_status",
  "source_url",
  "source_commit",
  "source_blob_sha",
  "spdx_version",
  "osi_source_flag",
  "performance",
  "complexity",
  "suitability",
  "rights",
  "obligations",
  "compatibility",
  "review_status",
  "stage",
] as const;

/** Always quote fields; protect spreadsheet software against CSV formulas. */
export function exportCsvCell(value: string): string {
  const text = /^[\u0000-\u0020]*[=+@-]/u.test(value) ? `'${value}` : value;
  return `"${text.replaceAll('"', '""')}"`;
}

/** Export pinned, unassessed v0.2 data without creating any reviewed facts. */
export function exportUnassessedCandidateCsv(): string {
  if (
    snapshot.schema_version !== "0.2" ||
    snapshot.migration_from !== "identity-index.v1" ||
    snapshot.records.length !== 841
  ) {
    throw new Error("Unsupported unassessed catalogue version or count");
  }
  const lines = [UNASSESSED_EXPORT_HEADER.join(",")];
  const seen = new Set<string>();
  let previous = "";
  for (const record of snapshot.records) {
    if (
      seen.has(record.id) ||
      record.id <= previous ||
      record.stage !== "UNASSESSED_PREVIEW" ||
      record.review_status !== "NOT_REVIEWED" ||
      record.source_status !== "PINNED_IDENTITY" ||
      record.claim_refs.length !== 0 ||
      !Object.values(record.assessments).every((value) => value === "UNKNOWN")
    ) {
      throw new Error("Unassessed export source failed integrity checks");
    }
    seen.add(record.id);
    previous = record.id;
    const language = record.kind === "language";
    const assessments: Record<string, string> = record.assessments;
    const fields = [
      record.id,
      record.kind,
      record.name,
      "spdx_id" in record ? record.spdx_id : "",
      record.source_status,
      record.reference,
      language ? snapshot.source_pins.linguist_commit : snapshot.source_pins.spdx_commit,
      language ? snapshot.source_pins.linguist_blob_sha : snapshot.source_pins.spdx_blob_sha,
      language ? "" : snapshot.source_pins.spdx_version,
      "osi_approved_source_flag" in record ? String(record.osi_approved_source_flag) : "",
      assessments.performance ?? "",
      assessments.complexity ?? "",
      assessments.suitability ?? "",
      assessments.rights ?? "",
      assessments.obligations ?? "",
      assessments.compatibility ?? "",
      record.review_status,
      record.stage,
    ];
    lines.push(fields.map(exportCsvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}
