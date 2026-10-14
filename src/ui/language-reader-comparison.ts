// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readerExampleStatus } from "../product/language-reader-profiles.ts";
import type { LanguageReaderProfile } from "../product/language-reader-validation.ts";
import {
  READER_SECTION_LABELS,
  readerExampleStatusLabel,
  readerSources,
} from "./language-reader-profile.ts";
import type {
  CatalogLanguageSelection,
  LanguageCompareRow,
} from "./product.ts";
import type { CatalogPreviewFactView, CatalogPreviewView } from "./types.ts";

export interface CatalogLanguageCompareRow {
  label: string;
  dimensionId?: string;
  assessment?: boolean;
  value: (selection: CatalogLanguageSelection) => string;
  previewFact?: (
    selection: CatalogLanguageSelection,
  ) => CatalogPreviewFactView | undefined;
  sources: (
    selection: CatalogLanguageSelection,
  ) => readonly { label: string; url: string }[];
}

/** Shared rows are the only producer for the mixed table and its CSV export. */
export function readerComparisonRows(
  catalog: CatalogPreviewView,
  editorialRows: readonly LanguageCompareRow[],
): CatalogLanguageCompareRow[] {
  const noSources = () => [];
  const rows: CatalogLanguageCompareRow[] = [
    {
      label: "Entity ID",
      value: (selection) => selection.entity_id,
      sources: noSources,
    },
    {
      label: "Evidence tier",
      value: (selection) =>
        selection.editorial
          ? "Editorial Preview (not Reviewed)"
          : "Assessments pending / NOT_REVIEWED; sourced reader information only",
      sources: noSources,
    },
    {
      label: "Preview snapshot",
      value: () => catalog.knowledge_snapshot,
      sources: noSources,
    },
    {
      label: "Implementation",
      value: (selection) => selection.reader.implementation.name,
      sources: (selection) =>
        readerSources(
          selection.reader,
          selection.reader.implementation.source_ids,
        ),
    },
    {
      label: "Implementation scope",
      value: (selection) => selection.reader.implementation.version_scope,
      sources: (selection) =>
        readerSources(
          selection.reader,
          selection.reader.implementation.source_ids,
        ),
    },
  ];
  for (const [key, label] of Object.entries(READER_SECTION_LABELS) as [
    keyof LanguageReaderProfile["sections"],
    string,
  ][]) {
    rows.push({
      label,
      value: (selection) => selection.reader.sections[key].text,
      sources: (selection) =>
        readerSources(
          selection.reader,
          selection.reader.sections[key].source_ids,
        ),
    });
  }
  const exampleSources = (selection: CatalogLanguageSelection) =>
    readerSources(selection.reader, selection.reader.example.source_ids);
  rows.push(
    {
      label: "Example type",
      value: (selection) => selection.reader.example.kind,
      sources: exampleSources,
    },
    {
      label: "Example filename",
      value: (selection) =>
        selection.reader.example.filename ??
        "Reference workflow; no executable filename",
      sources: exampleSources,
    },
    {
      label: "Example code",
      value: (selection) =>
        selection.reader.example.code ??
        "No executable code documented; see the reference workflow.",
      sources: exampleSources,
    },
    {
      label: "Example instructions",
      value: (selection) => selection.reader.example.run_instructions,
      sources: exampleSources,
    },
    {
      label: "Expected result",
      value: (selection) => selection.reader.example.expected_result,
      sources: exampleSources,
    },
    {
      label: "Example status",
      value: (selection) =>
        readerExampleStatusLabel(readerExampleStatus(selection.reader)),
      sources: exampleSources,
    },
    {
      label: "Implementation and runtime licenses",
      value: (selection) =>
        selection.reader.licenses
          .map((license) =>
            [
              license.component,
              license.role,
              license.spdx_expression ?? "License expression not established",
              license.scope,
              license.notice,
            ].join(" · "),
          )
          .join("\n"),
      sources: (selection) =>
        readerSources(
          selection.reader,
          selection.reader.licenses.flatMap((license) => license.source_ids),
        ),
    },
  );
  for (const row of editorialRows.slice(4)) {
    const previewFact = (selection: CatalogLanguageSelection) =>
      row.dimensionId && selection.editorial
        ? catalog.languages
            .find((entry) => entry.entity_id === selection.entity_id)
            ?.facts.find((fact) => fact.dimension_id === row.dimensionId)
        : undefined;
    rows.push({
      label: row.label,
      ...(row.dimensionId
        ? { dimensionId: row.dimensionId, previewFact }
        : { assessment: true }),
      value: (selection) =>
        selection.editorial ? row.value(selection.editorial) : "UNKNOWN",
      sources: (selection) =>
        (previewFact(selection)?.sources ?? []).map((source) => ({
          label: source.title,
          url: source.reference,
        })),
    });
  }
  return rows;
}
