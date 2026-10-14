// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

/** Explanatory vocabulary only: these entries are never decision inputs. */
export const GLOSSARY_TERMS = [
  {
    term: "SPDX",
    definition:
      "An identifier and expression format for referencing licenses; an identifier alone does not establish that a particular distribution satisfies its obligations.",
  },
  {
    term: "Copyleft",
    definition:
      "License conditions that can require sharing covered source code when the relevant distribution or network-use conditions are met. Scope differs between licenses.",
  },
  {
    term: "SaaS",
    definition:
      "Software provided as an online service. A network deployment is not the same licensing event as distributing software, and some licenses have special network clauses.",
  },
  {
    term: "Runtime",
    definition:
      "The environment and components that execute a program. Runtime and library licenses may differ from the programming language or compiler license.",
  },
  {
    term: "Preview",
    definition:
      "Human-facing descriptive or editorial information. It is not automatically verified, benchmarked, or promoted into the separate Reviewed decision engine.",
  },
  {
    term: "Reviewed",
    definition:
      "A narrowly scoped decision fact approved through the maintained evidence and snapshot process. Reviewed does not imply universal compatibility.",
  },
  {
    term: "UNKNOWN",
    definition:
      "The needed value was not assessed or supported by available evidence. It must not be interpreted as a positive or negative result.",
  },
  {
    term: "NOT_REVIEWED",
    definition:
      "An identity or record exists, but the required review has not been completed. Availability is not evidence of suitability or license clearance.",
  },
  {
    term: "Complexity",
    definition:
      "A context-dependent description of language, tooling, maintenance or deployment difficulty. Qualitative editorial bands are not objective universal rankings.",
  },
  {
    term: "Throughput",
    definition:
      "The amount of work completed per unit time under a specified workload and environment. Without comparable measurements, a band is only qualitative guidance.",
  },
  {
    term: "PolyForm",
    definition:
      "A family of source-available licenses with differing conditions. Source availability must not be equated with OSI-approved open-source permissions.",
  },
] as const;

export function renderProductGlossary(): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "product-glossary";
  details.id = "glossary";
  const summary = document.createElement("summary");
  summary.textContent = "Explain terms: licenses, evidence and complexity";
  details.append(summary);
  const caution = document.createElement("p");
  caution.textContent =
    "Reference only. This glossary does not create licensing conclusions or Reviewed assessments.";
  details.append(caution);
  const list = document.createElement("dl");
  for (const entry of GLOSSARY_TERMS) {
    const title = document.createElement("dt");
    title.textContent = entry.term;
    const description = document.createElement("dd");
    description.textContent = entry.definition;
    list.append(title, description);
  }
  details.append(list);
  return details;
}
