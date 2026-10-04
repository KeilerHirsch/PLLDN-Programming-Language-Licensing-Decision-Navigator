// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { ConditionRecord, TypedValue } from "../decision/types.ts";
import type { Document } from "../validation/documents.ts";
import type {
  CatalogEntityType,
  CatalogPreviewEntryView,
  CatalogPreviewFactView,
  CatalogPreviewView,
  KnowledgeClaimState,
} from "./types.ts";

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Invalid Preview catalogue ${field}`);
  }
  return [...value];
}

function entityType(value: unknown): CatalogEntityType | null {
  return value === "language" || value === "license" ? value : null;
}

function factsFor(
  documents: readonly Document[],
  entityId: string,
  labels: ReadonlyMap<string, string>,
  sources: ReadonlyMap<string, Record<string, unknown>>,
): CatalogPreviewFactView[] {
  return documents
    .filter(
      (document) =>
        document.kind === "claim" && document.record.entity_id === entityId,
    )
    .map((document) => {
      if (document.record.review_status === "Reviewed") {
        throw new Error("Preview catalogue must not contain Reviewed claims");
      }
      const dimensionId = String(document.record.dimension_id);
      const sourceIds = stringArray(
        document.record.source_ids,
        "claim source_ids",
      );
      return {
        claim_id: String(document.record.claim_id),
        dimension_id: dimensionId,
        label: labels.get(dimensionId) ?? dimensionId,
        state: document.record.state as KnowledgeClaimState,
        value:
          document.record.value === undefined
            ? null
            : structuredClone(document.record.value as TypedValue),
        conditions: structuredClone(
          (document.record.conditions ?? []) as ConditionRecord[],
        ),
        review_status: String(document.record.review_status),
        sources: sourceIds.map((sourceId) => {
          const source = sources.get(sourceId);
          if (!source) {
            throw new Error(`Missing Preview catalogue source: ${sourceId}`);
          }
          return {
            source_id: sourceId,
            title: String(source.title),
            reference: String(source.reference),
          };
        }),
      };
    })
    .sort((a, b) => {
      const labelOrder = a.label.localeCompare(b.label);
      return labelOrder !== 0
        ? labelOrder
        : a.claim_id.localeCompare(b.claim_id);
    });
}

function entries(
  documents: readonly Document[],
  kind: CatalogEntityType,
  labels: ReadonlyMap<string, string>,
  sources: ReadonlyMap<string, Record<string, unknown>>,
): CatalogPreviewEntryView[] {
  return documents
    .filter(
      (document) =>
        document.kind === "entity" &&
        entityType(document.record.entity_type) === kind,
    )
    .map((document) => {
      const entityId = String(document.record.entity_id);
      return {
        entity_id: entityId,
        label: String(document.record.canonical_name),
        entity_type: kind,
        version_scope: stringArray(
          document.record.version_scope,
          "entity version_scope",
        ),
        target_scope: stringArray(
          document.record.target_scope,
          "entity target_scope",
        ),
        facts: factsFor(documents, entityId, labels, sources),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildCatalogPreview(input: {
  knowledgeSnapshot: string;
  documents: readonly Document[];
}): CatalogPreviewView {
  const documents = structuredClone(input.documents);
  const labels = new Map(
    documents
      .filter((document) => document.kind === "dimension")
      .map((document) => [
        String(document.record.dimension_id),
        String(document.record.canonical_name),
      ]),
  );
  const sources = new Map(
    documents
      .filter((document) => document.kind === "source")
      .map((document) => [
        String(document.record.source_id),
        document.record,
      ]),
  );
  return {
    knowledge_snapshot: input.knowledgeSnapshot,
    status: "Preview",
    languages: entries(documents, "language", labels, sources),
    licenses: entries(documents, "license", labels, sources),
  };
}
