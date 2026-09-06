// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { TextProposal } from "../text/types.ts";
import type { UiController } from "./controller.ts";
import type { UiViewModel } from "./types.ts";

interface ConfirmableTarget {
  facetId: string;
  optionId: string;
}

function confirmableTarget(proposal: TextProposal): ConfirmableTarget {
  if (proposal.state !== "PROPOSED") {
    throw new Error("Only PROPOSED text items are confirmable");
  }
  if (!proposal.facet_id || !proposal.option_id) {
    throw new Error("PROPOSED text item requires a facet target");
  }
  return { facetId: proposal.facet_id, optionId: proposal.option_id };
}

export async function confirmProposal(
  controller: UiController,
  proposal: TextProposal,
): Promise<UiViewModel> {
  const target = confirmableTarget(proposal);
  return controller.selectFacet(target.facetId, target.optionId);
}

export async function confirmProposals(
  controller: UiController,
  proposals: readonly TextProposal[],
): Promise<UiViewModel> {
  const targets = proposals.map(confirmableTarget);
  const byFacet = new Map<string, string>();
  for (const target of targets) {
    const existing = byFacet.get(target.facetId);
    if (existing !== undefined && existing !== target.optionId) {
      throw new Error(
        `Conflicting proposed options for facet ${target.facetId}`,
      );
    }
    byFacet.set(target.facetId, target.optionId);
  }

  let view = await controller.view();
  for (const [facetId, optionId] of [...byFacet.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    view = await controller.selectFacet(facetId, optionId);
  }
  return view;
}
