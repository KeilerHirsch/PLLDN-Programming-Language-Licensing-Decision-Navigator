// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { FacetDefinition, FacetOption } from "../ui/types.ts";
import { normalizeText } from "./normalize.ts";
import type {
  PatternAtom,
  SourceSpan,
  TextAnalysis,
  TextProposal,
  TextRule,
  TextRuleSet,
} from "./types.ts";

const MAX_PATTERN_VARIANTS = 1024;

interface Match {
  rule: TextRule;
  span: SourceSpan;
}

function aliasMap(
  ruleSet: TextRuleSet,
): ReadonlyMap<string, readonly (readonly string[])[]> {
  return new Map(
    ruleSet.aliases.map((alias) => [alias.alias_id, alias.phrases]),
  );
}

function variantsForAtom(
  atom: PatternAtom,
  aliases: ReadonlyMap<string, readonly (readonly string[])[]>,
): readonly (readonly string[])[] {
  if (typeof atom === "string") return [[atom]];
  const phrases = aliases.get(atom.alias);
  if (!phrases) throw new Error(`Unknown alias reference: ${atom.alias}`);
  return phrases;
}

function expandPattern(
  pattern: readonly PatternAtom[],
  aliases: ReadonlyMap<string, readonly (readonly string[])[]>,
): readonly (readonly string[])[] {
  let variants: readonly (readonly string[])[] = [[]];
  for (const atom of pattern) {
    const atomVariants = variantsForAtom(atom, aliases);
    if (variants.length * atomVariants.length > MAX_PATTERN_VARIANTS) {
      throw new Error("Text rule alias expansion exceeds deterministic bound");
    }
    variants = variants.flatMap((prefix) =>
      atomVariants.map((suffix) => [...prefix, ...suffix]),
    );
  }
  return variants;
}

function findMatches(input: string, ruleSet: TextRuleSet): Match[] {
  const normalized = normalizeText(input);
  const aliases = aliasMap(ruleSet);
  const matches: Match[] = [];
  const seen = new Set<string>();

  for (const rule of ruleSet.rules) {
    for (const pattern of expandPattern(rule.pattern, aliases)) {
      if (pattern.length === 0 || pattern.length > normalized.tokens.length)
        continue;
      for (
        let start = 0;
        start <= normalized.tokens.length - pattern.length;
        start++
      ) {
        const equal = pattern.every(
          (value, offset) => normalized.tokens[start + offset]?.value === value,
        );
        if (!equal) continue;
        const first = normalized.tokens[start];
        const last = normalized.tokens[start + pattern.length - 1];
        if (!first || !last) continue;
        const key = `${rule.rule_id}:${first.start}:${last.end}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matches.push({
          rule,
          span: {
            start: first.start,
            end: last.end,
            text: normalized.original.slice(first.start, last.end),
          },
        });
      }
    }
  }
  return matches;
}

function sortedUniqueSpans(matches: readonly Match[]): SourceSpan[] {
  const byRange = new Map<string, SourceSpan>();
  for (const match of matches) {
    const key = `${match.span.start}:${match.span.end}`;
    if (!byRange.has(key)) byRange.set(key, match.span);
  }
  return [...byRange.values()].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );
}

function sortedRuleIds(matches: readonly Match[]): string[] {
  return [...new Set(matches.map((match) => match.rule.rule_id))].sort();
}

function proposalId(
  state: TextProposal["state"],
  matches: readonly Match[],
  facetId = "-",
  optionId = "-",
): string {
  const spans = sortedUniqueSpans(matches)
    .map((span) => `${span.start}-${span.end}`)
    .join(",");
  return `text-proposal:${state}:${facetId}:${optionId}:${sortedRuleIds(matches).join(",")}:${spans}`;
}

function resolveTarget(
  rule: Extract<TextRule, { kind: "actionable" }>,
  facets: ReadonlyMap<string, FacetDefinition>,
): { facet: FacetDefinition; option: FacetOption } {
  const facet = facets.get(rule.target.facet_id);
  if (!facet) throw new Error(`Unknown facet target: ${rule.target.facet_id}`);
  const option = facet.options.find(
    (candidate) => candidate.option_id === rule.target.option_id,
  );
  if (!option) {
    throw new Error(
      `Unknown option target ${rule.target.option_id} for facet ${rule.target.facet_id}`,
    );
  }
  return { facet, option };
}

function actionableProposal(
  matches: readonly Match[],
  facets: ReadonlyMap<string, FacetDefinition>,
): TextProposal {
  const actionable = matches.filter(
    (
      match,
    ): match is Match & { rule: Extract<TextRule, { kind: "actionable" }> } =>
      match.rule.kind === "actionable",
  );
  if (actionable.length === 0) throw new Error("Actionable evidence required");
  const resolved = actionable.map((match) => ({
    match,
    ...resolveTarget(match.rule, facets),
  }));
  const facet = resolved[0]?.facet;
  if (!facet) throw new Error("Facet target required");
  const optionIds = new Set(resolved.map((item) => item.option.option_id));
  const spans = sortedUniqueSpans(actionable);
  const ruleIds = sortedRuleIds(actionable);
  if (optionIds.size > 1) {
    return {
      proposal_id: proposalId("CONFLICTING", actionable, facet.facet_id),
      state: "CONFLICTING",
      spans,
      rule_ids: ruleIds,
      reason_key: "text.conflicting",
      facet_id: facet.facet_id,
      facet_label: facet.label,
      dimension_id: facet.dimension_id,
    };
  }

  const option = resolved[0]?.option;
  if (!option) throw new Error("Facet option required");
  const reasonKey = [
    ...new Set(actionable.map((item) => item.rule.reason_key)),
  ].sort()[0];
  if (!reasonKey) throw new Error("Reason key required");
  return {
    proposal_id: proposalId(
      "PROPOSED",
      actionable,
      facet.facet_id,
      option.option_id,
    ),
    state: "PROPOSED",
    spans,
    rule_ids: ruleIds,
    reason_key: reasonKey,
    facet_id: facet.facet_id,
    option_id: option.option_id,
    facet_label: facet.label,
    option_label: option.label,
    dimension_id: facet.dimension_id,
    value: option.value,
  };
}

function ambiguityProposal(matches: readonly Match[]): TextProposal {
  const ambiguity = matches.filter(
    (
      match,
    ): match is Match & { rule: Extract<TextRule, { kind: "ambiguity" }> } =>
      match.rule.kind === "ambiguity",
  );
  const rule = ambiguity[0]?.rule;
  if (!rule) throw new Error("Ambiguity evidence required");
  return {
    proposal_id: proposalId("AMBIGUOUS", ambiguity),
    state: "AMBIGUOUS",
    spans: sortedUniqueSpans(ambiguity),
    rule_ids: sortedRuleIds(ambiguity),
    reason_key: rule.reason_key,
  };
}

function firstSpanStart(proposal: TextProposal): number {
  return proposal.spans[0]?.start ?? Number.MAX_SAFE_INTEGER;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareProposals(left: TextProposal, right: TextProposal): number {
  return (
    firstSpanStart(left) - firstSpanStart(right) ||
    compareText(left.rule_ids[0] ?? "", right.rule_ids[0] ?? "") ||
    compareText(left.facet_id ?? "", right.facet_id ?? "") ||
    compareText(left.option_id ?? "", right.option_id ?? "")
  );
}

export function analyzeText(
  input: string,
  ruleSet: TextRuleSet,
  facets: readonly FacetDefinition[],
): TextAnalysis {
  const facetMap = new Map<string, FacetDefinition>();
  for (const facet of facets) {
    if (facetMap.has(facet.facet_id)) {
      throw new Error(`Duplicate facet ID: ${facet.facet_id}`);
    }
    facetMap.set(facet.facet_id, facet);
  }

  const matches = findMatches(input, ruleSet);
  if (matches.length === 0) return { proposals: [] };

  const actionableByFacet = new Map<string, Match[]>();
  const ambiguityByRule = new Map<string, Match[]>();
  for (const match of matches) {
    if (match.rule.kind === "ambiguity") {
      const bucket = ambiguityByRule.get(match.rule.rule_id) ?? [];
      bucket.push(match);
      ambiguityByRule.set(match.rule.rule_id, bucket);
      continue;
    }
    resolveTarget(match.rule, facetMap);
    const bucket = actionableByFacet.get(match.rule.target.facet_id) ?? [];
    bucket.push(match);
    actionableByFacet.set(match.rule.target.facet_id, bucket);
  }

  const proposals = [
    ...[...actionableByFacet.values()].map((group) =>
      actionableProposal(group, facetMap),
    ),
    ...[...ambiguityByRule.values()].map(ambiguityProposal),
  ].sort(compareProposals);

  return { proposals };
}
