// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { sha256 } from "../snapshots/manifest.ts";
import { verifySnapshot } from "../snapshots/verify.ts";
import { loadStage4Rules } from "../text/rules.ts";
import type { TextRuleSet } from "../text/types.ts";
import { asObject, parseStrictJson } from "../validation/json.ts";
import { createUiController, type UiController } from "./controller.ts";
import { validatedProductFacets } from "./product-facets.ts";
import type { FacetDefinition } from "./types.ts";

export interface BrowserRuntimeInput {
  snapshotManifest: string;
  snapshotFiles: Readonly<Record<string, string>>;
  trustedSnapshotDigests: readonly string[];
  evaluatedAt: string;
  baseProject: Record<string, unknown>;
  facets?: readonly FacetDefinition[];
  candidateType: string;
  componentId: string | null;
}

export type BrowserRuntimeResult =
  | {
      status: "ready";
      controller: UiController;
      facets: readonly FacetDefinition[];
      textRules: TextRuleSet | null;
    }
  | { status: "unavailable"; reason: string };

function diagnostic(error: unknown): string {
  return error instanceof Error ? error.message : "Runtime verification failed";
}

export async function bootstrapUiRuntime(
  input: BrowserRuntimeInput,
): Promise<BrowserRuntimeResult> {
  if (input.trustedSnapshotDigests.length === 0) {
    return {
      status: "unavailable",
      reason: "Runtime snapshot not configured with a trusted approval digest.",
    };
  }
  try {
    const knowledge = await verifySnapshot(
      input.snapshotManifest,
      input.snapshotFiles,
      input.trustedSnapshotDigests,
      input.evaluatedAt,
    );
    const manifest = asObject(parseStrictJson(input.snapshotManifest));
    const snapshotSha256 = await sha256(input.snapshotManifest);
    const facets = input.facets ?? validatedProductFacets(knowledge);
    const textRules = input.facets ? null : loadStage4Rules(facets);
    const controller = createUiController({
      baseProject: input.baseProject,
      knowledge,
      facets,
      candidateType: input.candidateType,
      componentId: input.componentId,
      evaluatedAt: input.evaluatedAt,
      knowledgeSnapshot: String(manifest.knowledge_snapshot),
      rulesSnapshot: String(manifest.rules_snapshot),
      snapshotSha256,
    });
    return { status: "ready", controller, facets, textRules };
  } catch (error) {
    return { status: "unavailable", reason: diagnostic(error) };
  }
}
