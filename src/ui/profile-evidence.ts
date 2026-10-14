// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readerSafeHttps } from "../product/language-reader-validation.ts";
import { tr } from "./ui-locale.ts";

export interface ProfileEvidenceLink {
  label: string;
  url: string;
  checkedOn?: string;
}
export type ProfileEvidenceStatus = "Editorial Preview" | "NOT_REVIEWED";

/** Public catalogue identity only; issue form remains under the user's control. */
export function sourceFeedbackUrl(entityId: string): string {
  if (!/^[A-Za-z0-9._+:-]{1,220}$/u.test(entityId)) {
    throw new Error("Invalid public catalogue identity for feedback");
  }
  const target = new URL(
    "https://github.com/KeilerHirsch/PLLDN-Programming-Language-Licensing-Decision-Navigator/issues/new",
  );
  target.searchParams.set("title", `Source correction: ${entityId}`);
  target.searchParams.set(
    "body",
    [
      `Public catalogue identity: ${entityId}`,
      "",
      "What appears incorrect or outdated?",
      "",
      "Canonical or independent source URL (provide voluntarily):",
      "",
      "Scope or applicable version:",
      "",
      "This is a draft only. Review it before submitting. Do not include personal or private data.",
    ].join("\n"),
  );
  return target.href;
}

export function renderProfileEvidence(
  entityId: string,
  status: ProfileEvidenceStatus,
  sources: readonly ProfileEvidenceLink[],
): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "profile-evidence-overview";
  const summary = document.createElement("summary");
  summary.textContent = tr("Sources, checking dates & assessment status");
  const notice = document.createElement("p");
  notice.textContent = tr(
    status === "NOT_REVIEWED"
      ? "NOT_REVIEWED / UNKNOWN: identity exists, but rights and suitability assessments have not been reviewed."
      : "Editorial Preview: descriptive claims are not automatically Reviewed assessments or measured benchmarks.",
  );
  details.append(summary, notice);

  const list = document.createElement("ul");
  const seen = new Set<string>();
  for (const source of sources) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    const item = document.createElement("li");
    const date = source.checkedOn ?? tr("not recorded");
    if (readerSafeHttps(source.url)) {
      const link = document.createElement("a");
      link.href = source.url;
      link.rel = "noopener noreferrer";
      link.textContent = source.label;
      item.append(link);
    } else {
      item.textContent = `${tr("Unlinked reference")}: ${source.label}`;
    }
    const checked = document.createElement("span");
    checked.textContent = ` · ${tr("Checked")}: ${date}`;
    item.append(checked);
    list.append(item);
  }
  if (list.children.length === 0) {
    const absent = document.createElement("li");
    absent.textContent = tr(
      "No recorded source in this view; independent verification is UNKNOWN.",
    );
    list.append(absent);
  }
  details.append(list);
  const report = document.createElement("a");
  report.href = sourceFeedbackUrl(entityId);
  report.target = "_blank";
  report.rel = "noopener noreferrer";
  report.textContent = tr(
    "Suggest a source correction on GitHub (review draft before submitting)",
  );
  details.append(report);
  return details;
}
