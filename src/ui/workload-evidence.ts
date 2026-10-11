// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { workloadEvidenceFor } from "../product/workload-observations.ts";

function paragraph(text: string): HTMLParagraphElement {
  const node = document.createElement("p");
  node.textContent = text;
  return node;
}

function link(label: string, href: string): HTMLAnchorElement {
  const node = document.createElement("a");
  node.textContent = label;
  node.href = href;
  node.rel = "noopener noreferrer";
  node.target = "_blank";
  return node;
}

function milliseconds(ns: number): string {
  return `${(ns / 1_000_000).toFixed(2)} ms`;
}

export function renderWorkloadEvidence(entityId: string): HTMLElement | null {
  const evidence = workloadEvidenceFor(entityId);
  if (!evidence) return null;
  const details = document.createElement("details");
  details.className = "profile-facts workload-evidence";
  details.dataset.workloadEvidence = entityId;
  const summary = document.createElement("summary");
  summary.textContent = "Measured workload evidence (2 runs)";
  details.append(
    summary,
    paragraph(
      "Measured workload only, not a language ranking. Two Node.js 24.15.0 JSON encode/decode observations: 2,048 records, 16 round trips per sample, five warmups and 21 timed samples per run. These measurements do not verify the editorial bands or complexity ratings.",
    ),
  );
  details.append(
    paragraph(
      "Different CPU models; shared VM noise and CPU frequency were uncontrolled. No confidence interval for a runtime difference can be inferred from these two single-process observations. Matching metadata alone would not establish independent hosts or a controlled comparison.",
    ),
  );
  for (const observation of evidence.observations) {
    const run = document.createElement("section");
    run.dataset.workloadRun = observation.run_id;
    const title = document.createElement("h4");
    title.textContent = `Run ${observation.run_id} · ${observation.environment.cpu_model}`;
    const spread = observation.spread;
    const values = document.createElement("dl");
    for (const [label, value] of [
      ["Median", milliseconds(spread.median_ns)],
      [
        "Middle 50% (Q1–Q3)",
        `${milliseconds(spread.q1_ns)}–${milliseconds(spread.q3_ns)}`,
      ],
      ["IQR (Q3 − Q1)", milliseconds(spread.iqr_ns)],
      ["MAD (median absolute deviation)", milliseconds(spread.mad_ns)],
      ["Sample p95 (whole workload)", milliseconds(spread.p95_ns)],
      [
        "All samples (min–max)",
        `${milliseconds(spread.minimum_ns)}–${milliseconds(spread.maximum_ns)}`,
      ],
    ] as const) {
      const term = document.createElement("dt");
      term.textContent = label;
      const definition = document.createElement("dd");
      definition.textContent = value;
      values.append(term, definition);
    }
    const sources = document.createElement("p");
    for (const [index, [label, href]] of [
      ["Original Actions run", observation.run_url],
      ["Raw samples (pinned archive)", observation.raw_record_url],
      ["Measured source", observation.source_url],
    ].entries()) {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.textContent = " · ";
        sources.append(separator);
      }
      if (label && href) sources.append(link(label, href));
    }
    run.append(title, values, sources);
    details.append(run);
  }
  details.append(
    paragraph(
      "Percentiles use nearest rank; MAD is unscaled descriptive spread, not a confidence interval. Raw samples retain their original order and no outliers are removed. Process startup, build time, request latency and end-to-end application performance were not measured. Not Reviewed.",
    ),
  );
  return details;
}
